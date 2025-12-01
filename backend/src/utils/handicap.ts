import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TABLES } from '../config/aws';
import { logger } from '../config/logger';

/**
 * Beregn og oppdater brukerens handicap basert på WHS (World Handicap System)
 * Handicap = gjennomsnitt av de 8 beste score differentials av de siste 20 rundene
 * Test change to verify file tracking
 */
export const updateUserHandicap = async (userId: string): Promise<void> => {
  try {
    // Hent brukerens siste 20 runder
    const roundsResult = await dynamodb.send(
      new QueryCommand({
        TableName: TABLES.ROUNDS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Nyeste først
        Limit: 20,
      })
    );

    const rounds = roundsResult.Items || [];

    if (rounds.length === 0) {
      // Ingen runder, sett handicap til 54 (maks)
      await dynamodb.send(
        new UpdateCommand({
          TableName: TABLES.USERS,
          Key: { id: userId },
          UpdateExpression: 'set handicap = :handicap, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':handicap': 54.0,
            ':updatedAt': new Date().toISOString(),
          },
        })
      );
      return;
    }

    // Sorter etter score differential (beste først)
    const sortedDifferentials = rounds.map(r => r.scoreDifferential).sort((a, b) => a - b);

    // WHS regel: Bruk antall runder for å bestemme hvor mange som teller
    let numberOfScoresToUse = 1;
    if (rounds.length >= 20) {
      numberOfScoresToUse = 8;
    } else if (rounds.length >= 19) {
      numberOfScoresToUse = 7;
    } else if (rounds.length >= 16) {
      numberOfScoresToUse = 6;
    } else if (rounds.length >= 12) {
      numberOfScoresToUse = 5;
    } else if (rounds.length >= 9) {
      numberOfScoresToUse = 4;
    } else if (rounds.length >= 6) {
      numberOfScoresToUse = 3;
    } else if (rounds.length >= 3) {
      numberOfScoresToUse = 2;
    }

    // Ta de beste differentialene
    const bestDifferentials = sortedDifferentials.slice(0, numberOfScoresToUse);
    const averageDifferential =
      bestDifferentials.reduce((sum, diff) => sum + diff, 0) / bestDifferentials.length;

    // Handicap Index = gjennomsnitt av beste differentials (avrundet til 1 desimal)
    const newHandicap = Math.round(averageDifferential * 10) / 10;

    // Oppdater brukerens handicap
    await dynamodb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { id: userId },
        UpdateExpression: 'set handicap = :handicap, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':handicap': Math.max(0, Math.min(54, newHandicap)), // Clamp mellom 0 og 54
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    logger.info(
      `Updated handicap for user ${userId}: ${newHandicap.toFixed(1)} (from ${
        rounds.length
      } rounds)`
    );
  } catch (error) {
    logger.error('Error updating handicap:', error);
    // Ikke kast feil - handicap-oppdatering skal ikke stoppe runde-lagring
  }
};
