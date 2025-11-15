# ⛳ GolfTracker

A fullstack golf app for tracking rounds and automatic handicap calculation.

## 🚀 Features

- 🔐 User authentication (JWT)
- ⛳ Round registration (9 or 18 holes)
- 📊 Automatic handicap calculation
- 📜 Round history
- 👤 User profile with profile image
- 🏆 Leaderboard

## 🛠️ Technology

**Frontend:** React 18 + TypeScript + Tailwind CSS  
**Backend:** Node.js + Express + TypeScript  
**Database:** AWS DynamoDB  
**Storage:** AWS S3  
**Infrastructure:** AWS CDK + CloudFormation

## 📁 Structure

```text
golftracker/
├── frontend/           # React app
├── backend/            # Express API
└── infrastructure/     # AWS CDK
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured with credentials
- AWS CDK CLI: `npm install -g aws-cdk`

### 1. Clone and Install

```bash
git clone https://github.com/Ulvounth/golftracker.git
cd golftracker

# Install dependencies
cd frontend && npm install
cd ../backend && npm install
cd ../infrastructure && npm install
```

### 2. Setup AWS

```bash
# Configure AWS CLI
aws configure

# Deploy infrastructure (DynamoDB, S3, API Gateway)
cd infrastructure
npx cdk bootstrap
npx cdk deploy --all
```

### 3. Run Locally

**Backend:**

```bash
cd backend
npm run dev  # Starts on port 3001
```

**Frontend:**

```bash
cd frontend
npm run dev  # Starts on port 3000
```

Open <http://localhost:3000> in your browser! 🎉

## 🐳 With Docker

```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up
```

## 📚 More Info

See README in each folder for details:

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Infrastructure README](./infrastructure/README.md)

## 👤 Author

Ulvounth - GitHub: [@Ulvounth](https://github.com/Ulvounth)
