# GolfAssistant ⛳

[![CI/CD Pipeline](https://github.com/Ulvounth/golftracker/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Ulvounth/golftracker/actions/workflows/ci-cd.yml)

Your digital golf assistant - track rounds, follow your handicap, and compete with friends.

## 🚀 Live Demo

**Production App:** [https://golfassistant.vercel.app](https://golfassistant.vercel.app)

**API Health:** `https://9nln867ik6.execute-api.eu-north-1.amazonaws.com/prod/api/health`

**API Documentation:** See [API Endpoints](#api-endpoints) below

## 🛠️ Tech Stack

**Frontend:**

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand
- Deployed on **Vercel**

**Backend:**

- Node.js 18 + Express
- TypeScript
- JWT Authentication
- Deployed on **AWS Lambda** (serverless)

**Infrastructure:**

- **AWS CDK** - Infrastructure as Code
- **DynamoDB** - NoSQL database
- **S3** - Profile image storage
- **API Gateway** - REST API endpoint
- **CloudWatch** - Logging and monitoring

## Features

- ✅ User authentication with JWT
- ⛳ Round registration (18-hole and 9-hole)
- 🏌️ Multi-player rounds support
- 🏆 Course management (user-generated courses)
- 📊 WHS handicap calculation
- 🏅 Leaderboard
- 👤 Profile with statistics and handicap history
- 📸 Profile picture upload
- 📄 Pagination on rounds list
- 🔔 Toast notifications for better UX

## 📦 Project Structure

```
golftracker/
├── frontend/          # React app (Vercel)
├── backend/           # Express API (AWS Lambda)
├── infrastructure/    # AWS CDK (DynamoDB, S3, etc.)
└── .github/          # CI/CD workflows
```

## 🚀 Deployment

### Production (Current Setup)

**Frontend:**

- Hosted on Vercel
- Auto-deploys on push to `main` branch
- Environment: `VITE_API_URL` points to AWS API Gateway

**Backend:**

- Runs on AWS Lambda (Node.js 18)
- API Gateway as proxy
- Deploy with: `cd infrastructure && cdk deploy GolfTrackerApiStack`

**Database:**

- DynamoDB tables in `eu-north-1` region
- On-demand billing (pay per request)

### Local Development

**Prerequisites:**

- Node.js 18+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

**Backend:**

```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev           # Runs on localhost:3001
```

**Frontend:**

```bash
cd frontend
npm install
cp .env.example .env  # Set VITE_API_URL
npm run dev           # Runs on localhost:3000
```

**Deploy Infrastructure:**

```bash
cd infrastructure
npm install
cdk bootstrap         # One-time setup
cdk deploy --all      # Deploy all stacks
```

See detailed guides:

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Infrastructure README](infrastructure/README.md)

## 💰 Cost Estimate

Current setup is optimized for minimal cost:

- **Vercel:** Free tier (hobby projects)
- **AWS Lambda:** ~$0/month (1M free requests)
- **API Gateway:** ~$0/month (1M free requests)
- **DynamoDB:** ~$0-1/month (25GB free tier)
- **S3:** ~$0/month (5GB free tier)

**Total: ~$0-1/month** for moderate usage 🎉

## 🔄 CI/CD Pipeline

Automated workflows via GitHub Actions:

- ✅ **Automated Tests**: Run on every push and PR
- 🔒 **Security Audits**: Dependency vulnerability scanning
- 🤖 **Dependabot**: Automatic dependency updates
- 🚀 **Vercel Deployment**: Auto-deploy frontend on push to `main`

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📝 Environment Variables

**Backend (.env):**

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-key      # Local dev only
AWS_SECRET_ACCESS_KEY=your-key  # Local dev only
DYNAMODB_USERS_TABLE=golftracker-users
DYNAMODB_ROUNDS_TABLE=golftracker-rounds
DYNAMODB_COURSES_TABLE=golftracker-courses
S3_BUCKET_NAME=golftracker-profiles
```

**Frontend (.env):**

```env
VITE_API_URL=https://9nln867ik6.execute-api.eu-north-1.amazonaws.com/prod/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

All PRs are automatically tested via GitHub Actions.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Andreas Ulvund**

- GitHub: [@Ulvounth](https://github.com/Ulvounth)
