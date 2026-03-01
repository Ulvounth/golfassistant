import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { updateUserHandicap } from '../src/utils/handicap';

const client = new DynamoDBClient({ region: 'eu-north-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLES = {
  USERS: 'golftracker-users',
};

/**
 * Rekalkuler handicap for alle brukere
 * Kjør dette etter at handicap-beregningslogikken er endret
 */
async function recalculateAllHandicaps() {
  console.log('🔄 Starter rekalkulering av alle handicaps...\n');

  try {
    // Hent alle brukere
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLES.USERS,
      })
    );

    const users = result.Items || [];
    console.log(`📊 Fant ${users.length} brukere\n`);

    // Oppdater hver bruker
    for (const user of users) {
      const oldHandicap = user.handicap;
      console.log(
        `Oppdaterer ${user.firstName} ${user.lastName} (${user.email}) - gammel handicap: ${oldHandicap.toFixed(1)}`
      );

      try {
        await updateUserHandicap(user.id);
        console.log(`  ✅ Oppdatert`);
      } catch (error) {
        console.error(`  ❌ Feil: ${error}`);
      }
    }

    console.log('\n✨ Ferdig! Alle handicaps er rekalkulert.');
  } catch (error) {
    console.error('Feil ved rekalkulering:', error);
    process.exit(1);
  }
}

// Kjør script
recalculateAllHandicaps().catch(console.error);
