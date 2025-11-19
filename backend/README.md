# Backend

Express API for authentication, rounds, and WHS handicap.

## Tech

Node.js 20, Express, TypeScript, DynamoDB, JWT, Zod

## Setup

```bash
npm install

# Create .env file:
JWT_SECRET=your-secret-key
AWS_REGION=eu-north-1
PORT=3001

npm run dev
```

## API Endpoints

- POST /api/auth/register - Register user
- POST /api/auth/login - Login
- POST /api/rounds - Create round
- GET /api/rounds - List rounds
- POST /api/courses - Create course
- GET /api/leaderboard - Rankings

## Handicap Formula

WHS: (Score - Rating) 113 / Slope

9-hole: Rating and Slope divided by 2
