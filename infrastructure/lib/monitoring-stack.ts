import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  apiFunction: lambda.Function;
  api: apigateway.RestApi;
  usersTable: dynamodb.Table;
  roundsTable: dynamodb.Table;
  emailAddress?: string;
}

/**
 * Stack for monitoring, alerting and dashboards
 *
 * Features:
 * - CloudWatch alarms for Lambda errors, duration, throttles
 * - API Gateway monitoring (4xx, 5xx, latency)
 * - DynamoDB monitoring (throttles, errors)
 * - SNS notifications to email
 * - Comprehensive CloudWatch dashboard
 */
export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'GolfTracker Production Alerts',
      topicName: 'golftracker-alerts',
    });

    // Add email subscription if provided
    if (props.emailAddress) {
      this.alertTopic.addSubscription(new subscriptions.EmailSubscription(props.emailAddress));
    }

    // ============= Lambda Alarms =============

    // Lambda Error Rate Alarm
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: 'GolfTracker-Lambda-Errors',
      metric: props.apiFunction.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Lambda function has 5+ errors in 5 minutes',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    errorAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));
    errorAlarm.addOkAction(new actions.SnsAction(this.alertTopic));

    // Lambda Duration Alarm (slow responses)
    const durationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: 'GolfTracker-Lambda-SlowResponse',
      metric: props.apiFunction.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Lambda average duration exceeds 5 seconds',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    durationAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // Lambda Throttles Alarm
    const throttleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: 'GolfTracker-Lambda-Throttled',
      metric: props.apiFunction.metricThrottles({
        period: cdk.Duration.minutes(1),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Lambda function is throttled',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    throttleAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // Lambda Concurrent Executions Alarm
    const concurrentExecAlarm = new cloudwatch.Alarm(this, 'LambdaConcurrentExecAlarm', {
      alarmName: 'GolfTracker-Lambda-HighConcurrency',
      metric: props.apiFunction.metric('ConcurrentExecutions', {
        period: cdk.Duration.minutes(1),
        statistic: 'Maximum',
      }),
      threshold: 800, // 80% of default 1000 concurrent limit
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when concurrent executions approach limit',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    concurrentExecAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // ============= API Gateway Alarms =============

    // API Gateway 5xx Errors
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: 'GolfTracker-API-5xxErrors',
      metric: props.api.metricServerError({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when API has 10+ server errors in 5 minutes',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    api5xxAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // API Gateway 4xx Errors (high rate indicates potential issues)
    const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxAlarm', {
      alarmName: 'GolfTracker-API-4xxErrors',
      metric: props.api.metricClientError({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 50,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when API has 50+ client errors in 5 minutes',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    api4xxAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // API Gateway Latency Alarm
    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: 'GolfTracker-API-HighLatency',
      metric: props.api.metricLatency({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 2000, // 2 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when API latency exceeds 2 seconds',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    apiLatencyAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // ============= DynamoDB Alarms =============

    // DynamoDB User Throttles
    const userThrottleAlarm = new cloudwatch.Alarm(this, 'UserTableThrottleAlarm', {
      alarmName: 'GolfTracker-DynamoDB-UserThrottles',
      metric: props.usersTable.metricUserErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Users table is throttled',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    userThrottleAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // DynamoDB Rounds Throttles
    const roundsThrottleAlarm = new cloudwatch.Alarm(this, 'RoundsTableThrottleAlarm', {
      alarmName: 'GolfTracker-DynamoDB-RoundsThrottles',
      metric: props.roundsTable.metricUserErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Rounds table is throttled',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    roundsThrottleAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // ============= CloudWatch Dashboard =============

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'GolfTracker-Production',
    });

    // Lambda Metrics
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        width: 12,
        left: [
          props.apiFunction.metricInvocations({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        width: 12,
        left: [
          props.apiFunction.metricErrors({ statistic: 'Sum', period: cdk.Duration.minutes(5) }),
        ],
      })
    );

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration (ms)',
        width: 12,
        left: [
          props.apiFunction.metricDuration({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          props.apiFunction.metricDuration({
            statistic: 'Maximum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Throttles',
        width: 12,
        left: [
          props.apiFunction.metricThrottles({ statistic: 'Sum', period: cdk.Duration.minutes(5) }),
        ],
      })
    );

    // API Gateway Metrics
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        width: 12,
        left: [props.api.metricCount({ statistic: 'Sum', period: cdk.Duration.minutes(5) })],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Errors',
        width: 12,
        left: [
          props.api.metricClientError({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: '4xx Errors',
          }),
          props.api.metricServerError({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: '5xx Errors',
          }),
        ],
      })
    );

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency (ms)',
        width: 12,
        left: [
          props.api.metricLatency({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            label: 'Average',
          }),
          props.api.metricLatency({
            statistic: 'p99',
            period: cdk.Duration.minutes(5),
            label: 'P99',
          }),
        ],
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Current Invocations',
        width: 12,
        metrics: [
          props.apiFunction.metricInvocations({
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    // DynamoDB Metrics
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read Capacity',
        width: 12,
        left: [
          props.usersTable.metricConsumedReadCapacityUnits({
            period: cdk.Duration.minutes(5),
            label: 'Users',
          }),
          props.roundsTable.metricConsumedReadCapacityUnits({
            period: cdk.Duration.minutes(5),
            label: 'Rounds',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Write Capacity',
        width: 12,
        left: [
          props.usersTable.metricConsumedWriteCapacityUnits({
            period: cdk.Duration.minutes(5),
            label: 'Users',
          }),
          props.roundsTable.metricConsumedWriteCapacityUnits({
            period: cdk.Duration.minutes(5),
            label: 'Rounds',
          }),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });

    new cdk.CfnOutput(this, 'LogsUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${props.apiFunction.functionName}`,
      description: 'CloudWatch Logs URL',
    });
  }
}
