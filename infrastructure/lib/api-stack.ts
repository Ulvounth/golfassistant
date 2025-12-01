import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  usersTable: dynamodb.Table;
  roundsTable: dynamodb.Table;
  coursesTable: dynamodb.Table;
  profileBucket: s3.Bucket;
}

/**
 * Stack for API Gateway og Lambda functions
 *
 * NOTE: Dette er en forenklet versjon. I produksjon bør du:
 * - Bruke Lambda Layers for delte dependencies
 * - Implementere hver route som egen Lambda
 * - Legge til API Gateway authorizer
 * - Konfigurere CloudWatch alarms
 * - Sette opp X-Ray tracing
 */
export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Lambda function for API
    // Using simple Function with pre-built code including node_modules
    // Ensure backend/dist contains node_modules before deployment
    const logGroup = new logs.LogGroup(this, 'ApiHandlerLogGroup', {
      logGroupName: `/aws/lambda/golftracker-api-handler`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        DYNAMODB_USERS_TABLE: props.usersTable.tableName,
        DYNAMODB_ROUNDS_TABLE: props.roundsTable.tableName,
        DYNAMODB_COURSES_TABLE: props.coursesTable.tableName,
        S3_BUCKET_NAME: props.profileBucket.bucketName,
        JWT_SECRET:
          this.node.tryGetContext('jwtSecret') ||
          process.env.JWT_SECRET ||
          'change-me-in-production',
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://golfassistant.vercel.app',
        // AWS_REGION is automatically set by Lambda runtime - do not set manually
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logGroup: logGroup,
    });

    // Gi Lambda tilgang til DynamoDB tabeller
    props.usersTable.grantReadWriteData(apiHandler);
    props.roundsTable.grantReadWriteData(apiHandler);
    props.coursesTable.grantReadData(apiHandler);

    // Gi Lambda tilgang til S3 bucket
    props.profileBucket.grantReadWrite(apiHandler);

    // API Gateway
    const apiGatewayLogsRole = new iam.Role(this, 'ApiGatewayLogsRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
      description: 'Role that allows API Gateway to push execution logs to CloudWatch',
    });

    const apiGatewayAccount = new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayLogsRole.roleArn,
    });

    this.api = new apigateway.RestApi(this, 'GolfTrackerApi', {
      restApiName: 'GolfTracker API',
      description: 'API for GolfTracker application',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // I produksjon: begrens til faktisk domene
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    this.api.deploymentStage.node.addDependency(apiGatewayAccount);

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(apiHandler);

    // API Routes
    const apiResource = this.api.root.addResource('api');

    // Add explicit GET method for /api root endpoint
    apiResource.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Proxy for all /api/* sub-routes
    apiResource.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // Output
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'URL of the API Gateway',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'ID of the API Gateway',
    });
  }
}
