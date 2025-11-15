# ⛳ GolfTracker

En fullstack golf-app for registrering av golfrunder og automatisk handicap-beregning.

## 🚀 Funksjoner

- 🔐 Brukerautentisering (JWT)
- ⛳ Runderegistrering (9 eller 18 hull)
- 📊 Automatisk handicap-beregning
- 📜 Rundehistorikk
- 👤 Brukerprofil med profilbilde
- 🏆 Leaderboard

## 🛠️ Teknologi

**Frontend:** React 18 + TypeScript + Tailwind CSS  
**Backend:** Node.js + Express + TypeScript  
**Database:** AWS DynamoDB  
**Storage:** AWS S3  
**Infrastructure:** AWS CDK + CloudFormation

## 📁 Struktur

```text
golftracker/
├── frontend/           # React app
├── backend/            # Express API
└── infrastructure/     # AWS CDK
```

## 🚀 Kom i gang

### Forutsetninger

- Node.js 18+
- AWS CLI konfigurert med credentials
- AWS CDK CLI: `npm install -g aws-cdk`

### 1. Klon og installer

```bash
git clone https://github.com/Ulvounth/golftracker.git
cd golftracker

# Installer dependencies
cd frontend && npm install
cd ../backend && npm install
cd ../infrastructure && npm install
```

### 2. Sett opp AWS

```bash
# Konfigurer AWS CLI
aws configure

# Deploy infrastruktur (DynamoDB, S3, API Gateway)
cd infrastructure
npx cdk bootstrap
npx cdk deploy --all
```

### 3. Kjør lokalt

**Backend:**

```bash
cd backend
npm run dev  # Starter på port 3001
```

**Frontend:**

```bash
cd frontend
npm run dev  # Starter på port 3000
```

Åpne <http://localhost:3000> i nettleseren! 🎉

## 🐳 Med Docker

```bash
# Development med hot reload
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up
```

## 📚 Mer info

Se README i hver mappe for detaljer:

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Infrastructure README](./infrastructure/README.md)

## 👤 Forfatter

Ulvounth - GitHub: [@Ulvounth](https://github.com/Ulvounth)
