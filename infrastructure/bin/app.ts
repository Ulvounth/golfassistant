#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';

/**
 * Main CDK App
 * Oppretter og organiserer alle stacks for GolfTracker
 */
const app = new cdk.App();

// Hent environment fra context eller bruk default
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'eu-north-1',
};

// Database Stack - DynamoDB tabeller
const databaseStack = new DatabaseStack(app, 'GolfTrackerDatabaseStack', {
  env,
  description: 'DynamoDB tables for GolfTracker',
});

// Storage Stack - S3 bucket for profilbilder
const storageStack = new StorageStack(app, 'GolfTrackerStorageStack', {
  env,
  description: 'S3 storage for GolfTracker',
});

// API Stack - Lambda functions og API Gateway
const apiStack = new ApiStack(app, 'GolfTrackerApiStack', {
  env,
  description: 'API Gateway and Lambda functions for GolfTracker',
  usersTable: databaseStack.usersTable,
  roundsTable: databaseStack.roundsTable,
  coursesTable: databaseStack.coursesTable,
  profileBucket: storageStack.profileBucket,
});

// Legg til tags på alle stacks
cdk.Tags.of(app).add('Project', 'GolfTracker');
cdk.Tags.of(app).add('Environment', 'Development');

app.synth();
