# GolfTracker Infrastructure

AWS CDK Infrastructure-as-Code for GolfTracker.

## 🏗️ Architecture

The project uses the following AWS services:

- **DynamoDB**: Database for users, rounds, and golf courses
- **S3**: Storage for profile images
- **Lambda**: Backend API functions
- **API Gateway**: REST API endpoint
- **CloudWatch**: Logging and monitoring

## 📦 Stacks

### DatabaseStack

- `golftracker-users` - User table with email-index
- `golftracker-rounds` - Rounds table with userId-date-index
- `golftracker-courses` - Golf courses table

### StorageStack

- `golftracker-profiles` - S3 bucket for profile images

### ApiStack

- Lambda function for backend API
- API Gateway with CORS configured
- CloudWatch logging

## 🚀 Deployment

### Prerequisites

```bash
npm install -g aws-cdk
aws configure
```

### Bootstrap CDK (first time)

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Deploy all stacks

```bash
cd infrastructure
npm install
npm run build
cdk deploy --all
```

### Deploy single stack

```bash
cdk deploy GolfTrackerDatabaseStack
cdk deploy GolfTrackerStorageStack
cdk deploy GolfTrackerApiStack
```

## 🧪 Testing

### Preview changes

```bash
cdk diff
```

### Generate CloudFormation template

```bash
cdk synth
```

## 🗑️ Cleanup

**WARNING:** This deletes all resources!

```bash
cdk destroy --all
```

## 📝 Environment Variables

Set the following environment variables before deployment:

```bash
export CDK_DEFAULT_ACCOUNT=your-account-id
export CDK_DEFAULT_REGION=eu-north-1
export JWT_SECRET=your-secret-key
```

## 🔧 Configuration

### Cost Management

All DynamoDB tables use **PAY_PER_REQUEST** billing mode to minimize costs.

### Security

- S3 bucket has public read access disabled by default
- API Gateway has CORS configured
- Lambda functions have minimal IAM permissions

## 📊 Monitoring

CloudWatch logs are automatically created for:

- Lambda function execution
- API Gateway requests
- DynamoDB operations

## 🔐 Best Practices

- Use separate AWS accounts for dev/staging/prod
- Enable DynamoDB point-in-time recovery in production
- Set up CloudWatch alarms for critical metrics
- Use AWS Secrets Manager for sensitive data
- Enable AWS CloudTrail for audit logging
