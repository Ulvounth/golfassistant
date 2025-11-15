import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Stack for DynamoDB tabeller
 */
export class DatabaseStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly roundsTable: dynamodb.Table;
  public readonly coursesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Users Table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'golftracker-users',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Behold data ved sletting av stack
      pointInTimeRecovery: true,
    });

    // Global Secondary Index for å søke etter e-post
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Rounds Table
    this.roundsTable = new dynamodb.Table(this, 'RoundsTable', {
      tableName: 'golftracker-rounds',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Global Secondary Index for å hente runder per bruker sortert etter dato
    this.roundsTable.addGlobalSecondaryIndex({
      indexName: 'userId-date-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Courses Table
    this.coursesTable = new dynamodb.Table(this, 'CoursesTable', {
      tableName: 'golftracker-courses',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'Name of the Users DynamoDB table',
    });

    new cdk.CfnOutput(this, 'RoundsTableName', {
      value: this.roundsTable.tableName,
      description: 'Name of the Rounds DynamoDB table',
    });

    new cdk.CfnOutput(this, 'CoursesTableName', {
      value: this.coursesTable.tableName,
      description: 'Name of the Courses DynamoDB table',
    });
  }
}
