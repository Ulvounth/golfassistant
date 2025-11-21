#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

/**
 * Main CDK App
 * Oppretter og organiserer alle stacks for GolfTracker
 * 
 * Production deployment order:
 * 1. DatabaseStack - DynamoDB tables
 * 2. StorageStack - S3 buckets
 * 3. ApiStack - Lambda + API Gateway
 * 4. FrontendStack - React app on S3 + CloudFront
 * 5. MonitoringStack - CloudWatch alarms + Dashboard
 */
const app = new cdk.App();

// Hent environment fra context eller bruk default
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'eu-north-1',
};

// Get configuration from context (can be passed via --context flag)
const environment = app.node.tryGetContext('environment') || 'development';
const domainName = app.node.tryGetContext('domainName'); // e.g., 'golftracker.no'
const certificateArn = app.node.tryGetContext('certificateArn');
const alertEmail = app.node.tryGetContext('alertEmail');

// Database Stack - DynamoDB tabeller
const databaseStack = new DatabaseStack(app, 'GolfTrackerDatabaseStack', {
  env,
  description: 'DynamoDB tables for GolfTracker',
  tags: {
    Stack: 'Database',
  },
});

// Storage Stack - S3 bucket for profilbilder
const storageStack = new StorageStack(app, 'GolfTrackerStorageStack', {
  env,
  description: 'S3 storage for GolfTracker profile images',
  tags: {
    Stack: 'Storage',
  },
});

// API Stack - Lambda functions og API Gateway
const apiStack = new ApiStack(app, 'GolfTrackerApiStack', {
  env,
  description: 'API Gateway and Lambda functions for GolfTracker',
  usersTable: databaseStack.usersTable,
  roundsTable: databaseStack.roundsTable,
  coursesTable: databaseStack.coursesTable,
  profileBucket: storageStack.profileBucket,
  tags: {
    Stack: 'API',
  },
});

apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);

// Frontend Stack - React app on S3 + CloudFront
// Note: Build frontend first with 'npm run build' in frontend/
const frontendStack = new FrontendStack(app, 'GolfTrackerFrontendStack', {
  env,
  description: 'React frontend hosted on S3 with CloudFront CDN',
  domainName: domainName,
  certificateArn: certificateArn,
  tags: {
    Stack: 'Frontend',
  },
});

// Monitoring Stack - CloudWatch alarms and dashboards
// Note: Uncomment when you want to add monitoring
// const monitoringStack = new MonitoringStack(app, 'GolfTrackerMonitoringStack', {
//   env,
//   description: 'CloudWatch monitoring, alarms and dashboards',
//   apiFunction: apiStack.handler, // Use the handler from ApiStack
//   api: apiStack.api,
//   usersTable: databaseStack.usersTable,
//   roundsTable: databaseStack.roundsTable,
//   emailAddress: alertEmail,
//   tags: {
//     Stack: 'Monitoring',
//   },
// });
// monitoringStack.addDependency(apiStack);

// Legg til globale tags på alle stacks
cdk.Tags.of(app).add('Project', 'GolfTracker');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'AWS-CDK');

app.synth();
