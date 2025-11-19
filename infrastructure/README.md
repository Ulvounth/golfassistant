# Infrastructure

AWS CDK deployment for GolfTracker.

## Resources

- DynamoDB tables (users, rounds, courses)
- S3 bucket (profile images)
- Lambda functions
- API Gateway
- CloudFront distribution

## Deploy

```bash
cd infrastructure
npm install
cdk bootstrap
cdk deploy
```

## Tables

- golftracker-users
- golftracker-rounds
- golftracker-courses

## Region

eu-north-1 (Stockholm)

## Cleanup

```bash
cdk destroy
```
