import AWS from 'aws-sdk';

// Konfigurer AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'eu-north-1',
  ...(process.env.AWS_ACCESS_KEY_ID && {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }),
});

console.log('🔧 Kobler til AWS region:', process.env.AWS_REGION || 'eu-north-1');

// Eksporter DynamoDB Document Client
export const dynamodb = new AWS.DynamoDB.DocumentClient(); // Eksporter S3 Client (vi hopper over S3 lokalt)
export const s3 = new AWS.S3();

// Tabellnavn
export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'golftracker-users',
  ROUNDS: process.env.DYNAMODB_ROUNDS_TABLE || 'golftracker-rounds',
  COURSES: process.env.DYNAMODB_COURSES_TABLE || 'golftracker-courses',
};

// S3 bucket
export const S3_BUCKET = process.env.S3_BUCKET_NAME || 'golftracker-profiles';
