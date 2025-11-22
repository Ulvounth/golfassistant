import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { logger } from './logger';

const REGION = process.env.AWS_REGION || 'eu-north-1';

// Configure AWS SDK v3
// In Lambda, don't specify credentials - it will use the Lambda execution role
// Only use explicit credentials in local development (non-Lambda environment)
const awsConfig = {
  region: REGION,
  ...(!process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
};

logger.info(`🔧 Kobler til AWS region: ${REGION}`);

// Create DynamoDB client
const ddbClient = new DynamoDBClient(awsConfig);

// Create DynamoDB Document Client with v3 syntax
export const dynamodb = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

// Create S3 client
export const s3Client = new S3Client(awsConfig);

// Table names
export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'golftracker-users',
  ROUNDS: process.env.DYNAMODB_ROUNDS_TABLE || 'golftracker-rounds',
  COURSES: process.env.DYNAMODB_COURSES_TABLE || 'golftracker-courses',
};

// S3 bucket
export const S3_BUCKET = process.env.S3_BUCKET_NAME || 'golftracker-profiles';
