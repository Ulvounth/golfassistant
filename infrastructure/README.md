# GolfTracker Infrastructure

AWS CDK Infrastructure-as-Code for GolfTracker.

## 🏗️ Arkitektur

Prosjektet bruker følgende AWS-tjenester:

- **DynamoDB**: Database for brukere, runder og golfbaner
- **S3**: Storage for profilbilder
- **Lambda**: Backend API functions
- **API Gateway**: REST API endpoint
- **CloudWatch**: Logging og monitoring

## 📦 Stacks

### DatabaseStack

- `golftracker-users` - Brukertabell med email-index
- `golftracker-rounds` - Rundetabell med userId-date-index
- `golftracker-courses` - Golfbanetabell

### StorageStack

- `golftracker-profiles` - S3 bucket for profilbilder

### ApiStack

- Lambda function for backend API
- API Gateway med CORS konfigurert
- CloudWatch logging

## 🚀 Deployment

### Forutsetninger

```bash
npm install -g aws-cdk
aws configure
```

### Bootstrap CDK (første gang)

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

### Deploy enkeltstack

```bash
cdk deploy GolfTrackerDatabaseStack
cdk deploy GolfTrackerStorageStack
cdk deploy GolfTrackerApiStack
```

## 🧪 Testing

### Se hva som vil bli deployed

```bash
cdk diff
```

### Generer CloudFormation template

```bash
cdk synth
```

## 🗑️ Sletting

**OBS:** Dette sletter alle ressurser!

```bash
cdk destroy --all
```

## 📝 Miljøvariabler

Sett følgende miljøvariabler før deployment:

```bash
export CDK_DEFAULT_ACCOUNT=your-account-id
export CDK_DEFAULT_REGION=eu-north-1
export JWT_SECRET=your-secret-key
```

## 🔧 Konfigurasjon

### Kostnadsstyring

Alle tabeller bruker PAY_PER_REQUEST billing mode for å minimere kostnader i development.

### Retention Policies

- DynamoDB tabeller: RETAIN (slettes ikke automatisk)
- S3 bucket: RETAIN (slettes ikke automatisk)
- CloudWatch logs: 7 dager

## 📚 Useful CDK Commands

- `npm run build` - Kompiler TypeScript til JavaScript
- `npm run watch` - Watch for endringer
- `cdk ls` - List alle stacks
- `cdk synth` - Generer CloudFormation templates
- `cdk diff` - Sammenlign deployed stack med current state
- `cdk deploy` - Deploy this stack til AWS account/region
- `cdk destroy` - Slett stack fra AWS

## 🔒 Sikkerhet

### Produksjonsanbefalinger:

- Bruk Secrets Manager for JWT_SECRET
- Begrens CORS origins til faktisk domene
- Implementer API Gateway authorizer
- Aktiver AWS WAF for API Gateway
- Konfigurer S3 bucket policies mer restriktivt
- Bruk VPC for Lambda functions
- Implementer rate limiting

## 📊 Monitoring

CloudWatch dashboards og alarmer bør legges til for:

- Lambda errors og throttling
- API Gateway 4xx/5xx errors
- DynamoDB consumed capacity
- S3 bucket size

## 💰 Kostnader

Estimerte månedlige kostnader for lav trafikk:

- DynamoDB: $1-5 (pay per request)
- S3: $1-2
- Lambda: Gratis tier eller < $1
- API Gateway: $3.50 per million requests
- CloudWatch: < $1

**Total:** ~$5-10/måned for lav trafikk
