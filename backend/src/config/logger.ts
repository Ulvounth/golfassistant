import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  if (stack) {
    return `${timestamp} [${level}]: ${message}\n${stack}`;
  }
  return `${timestamp} [${level}]: ${message}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  defaultMeta: { service: 'golftracker-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
  ],
});

// Add file transports in production (but NOT in Lambda - use CloudWatch instead)
if (process.env.NODE_ENV === 'production' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), winston.format.json()),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), winston.format.json()),
    })
  );
}

// In Lambda, logs go to CloudWatch automatically via console
if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
  logger.info('Running in AWS Lambda - logs will be sent to CloudWatch');
}

// Create a stream for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
