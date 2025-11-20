import { logger } from '../config/logger';

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'AWS_REGION',
  'DYNAMODB_USERS_TABLE',
  'DYNAMODB_ROUNDS_TABLE',
  'DYNAMODB_COURSES_TABLE',
] as const;

/**
 * Optional environment variables with default values
 */
const OPTIONAL_ENV_VARS = {
  PORT: '3001',
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
  CORS_ORIGIN: 'http://localhost:3000',
  S3_BUCKET_NAME: 'golftracker-profiles',
} as const;

/**
 * Validate that all required environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateEnvironment(): void {
  const missingVars: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    const errorMsg = `❌ Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Set defaults for optional variables
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      logger.info(`ℹ️  Using default value for ${key}: ${defaultValue}`);
    }
  }

  logger.info('✅ Environment variables validated');
}

/**
 * Get environment info for logging
 */
export function getEnvironmentInfo(): Record<string, string | undefined> {
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    AWS_REGION: process.env.AWS_REGION,
    LOG_LEVEL: process.env.LOG_LEVEL,
  };
}
