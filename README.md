# GolfTracker

[![CI/CD Pipeline](https://github.com/Ulvounth/golftracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Ulvounth/golftracker/actions/workflows/ci.yml)
[![Dependency Review](https://github.com/Ulvounth/golftracker/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/Ulvounth/golftracker/actions/workflows/dependency-review.yml)

Track golf rounds and calculate WHS handicap.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Node.js 20, Express, TypeScript
- Infrastructure: AWS CDK, DynamoDB, S3, Lambda, API Gateway

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

## Setup

1. Clone repository
2. Deploy AWS infrastructure (see infrastructure/README.md)
3. Configure environment variables
4. Install dependencies and run

See backend/README.md and frontend/README.md for details.

## Development

### Backend

```bash
cd backend
npm install
npm run dev
npm test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm test
```

## CI/CD

Automated testing and deployment:

- ✅ **Automated Tests**: Run on every push and PR
- 🔒 **Security Audits**: Dependency vulnerability scanning
- 🤖 **Dependabot**: Automatic dependency updates
- 🚀 **Auto-merge**: Minor/patch updates auto-merge after tests pass

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass locally
5. Submit a pull request

All PRs are automatically tested via GitHub Actions.
