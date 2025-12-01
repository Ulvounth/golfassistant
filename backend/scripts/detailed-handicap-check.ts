import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'eu-north-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLES = {
  USERS: 'golftracker-users',
  ROUNDS: 'golftracker-rounds',
};

/**
 * Beregn handicap basert på WHS regler
 */
function calculateHandicap(scoreDifferentials: number[]): number {
  if (scoreDifferentials.length === 0) return 54.0;

  const sorted = [...scoreDifferentials].sort((a, b) => a - b);

  let numberOfScoresToUse = 1;
  if (sorted.length >= 20) numberOfScoresToUse = 8;
  else if (sorted.length >= 19) numberOfScoresToUse = 7;
  else if (sorted.length >= 16) numberOfScoresToUse = 6;
  else if (sorted.length >= 12) numberOfScoresToUse = 5;
  else if (sorted.length >= 9) numberOfScoresToUse = 4;
  else if (sorted.length >= 6) numberOfScoresToUse = 3;
  else if (sorted.length >= 3) numberOfScoresToUse = 2;

  const best = sorted.slice(0, numberOfScoresToUse);
  const average = best.reduce((sum, diff) => sum + diff, 0) / best.length;
  const handicap = Math.round(average * 10) / 10;

  return Math.max(0, Math.min(54, handicap));
}

/**
 * Detaljert handicap-sjekk med alle runder
 */
async function detailedHandicapCheck() {
  console.log('🔍 Detaljert handicap-verifisering med alle runder...\n');

  // Hent alle brukere
  const usersResult = await dynamodb.send(
    new ScanCommand({
      TableName: TABLES.USERS,
      ProjectionExpression: 'id, firstName, lastName, handicap',
    })
  );

  const users = usersResult.Items || [];

  for (const user of users) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`👤 ${user.firstName} ${user.lastName}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Lagret handicap: ${user.handicap.toFixed(1)}\n`);

    // Hent alle runder (ikke bare 20)
    const roundsResult = await dynamodb.send(
      new QueryCommand({
        TableName: TABLES.ROUNDS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': user.id,
        },
        ScanIndexForward: false,
        ProjectionExpression: 'id, #d, courseName, totalScore, totalPar, scoreDifferential',
        ExpressionAttributeNames: {
          '#d': 'date',
        },
      })
    );

    const allRounds = roundsResult.Items || [];
    console.log(`📋 Total antall runder: ${allRounds.length}`);

    if (allRounds.length === 0) {
      console.log('   Ingen runder registrert. Standard handicap: 54.0');
      continue;
    }

    // Vis alle runder
    console.log('\n📊 Runder (nyeste først):');
    console.log('─'.repeat(60));
    allRounds.slice(0, 20).forEach((round, index) => {
      const date = new Date(round.date).toLocaleDateString('no-NO');
      const scoreToPar = round.totalScore - round.totalPar;
      const scoreToPaStr = scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar.toString();
      console.log(
        `${(index + 1).toString().padStart(2, ' ')}. ${date} | ${round.courseName.padEnd(
          20
        )} | Score: ${round.totalScore} (${scoreToPaStr}) | Diff: ${round.scoreDifferential.toFixed(
          1
        )}`
      );
    });

    if (allRounds.length > 20) {
      console.log(`    ... og ${allRounds.length - 20} eldre runder`);
    }

    // Beregn handicap basert på siste 20 runder
    const last20Rounds = allRounds.slice(0, 20);
    const scoreDiffs = last20Rounds.map(r => r.scoreDifferential);
    const sorted = [...scoreDiffs].sort((a, b) => a - b);

    // Finn ut hvor mange runder som brukes
    let numberOfScoresToUse = 1;
    if (last20Rounds.length >= 20) numberOfScoresToUse = 8;
    else if (last20Rounds.length >= 19) numberOfScoresToUse = 7;
    else if (last20Rounds.length >= 16) numberOfScoresToUse = 6;
    else if (last20Rounds.length >= 12) numberOfScoresToUse = 5;
    else if (last20Rounds.length >= 9) numberOfScoresToUse = 4;
    else if (last20Rounds.length >= 6) numberOfScoresToUse = 3;
    else if (last20Rounds.length >= 3) numberOfScoresToUse = 2;

    console.log(`\n🎯 Handicap-beregning (WHS):`);
    console.log(`   Bruker ${numberOfScoresToUse} beste av ${last20Rounds.length} runder`);
    console.log(
      `   Beste score differentials: ${sorted
        .slice(0, numberOfScoresToUse)
        .map(d => d.toFixed(1))
        .join(', ')}`
    );

    const calculatedHandicap = calculateHandicap(scoreDiffs);
    const bestAverage =
      sorted.slice(0, numberOfScoresToUse).reduce((sum, d) => sum + d, 0) / numberOfScoresToUse;

    console.log(`   Gjennomsnitt av beste: ${bestAverage.toFixed(1)}`);
    console.log(`   Beregnet handicap: ${calculatedHandicap.toFixed(1)}`);

    const diff = Math.abs(calculatedHandicap - user.handicap);
    if (diff < 0.1) {
      console.log(`   ✅ KORREKT! Stemmer med lagret handicap.`);
    } else {
      console.log(`   ❌ FEIL! Differanse: ${diff.toFixed(1)}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verifisering fullført!');
  console.log('='.repeat(60));
}

// Kjør detaljert sjekk
detailedHandicapCheck().catch(console.error);
