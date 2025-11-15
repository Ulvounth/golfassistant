# GolfTracker Backend

Node.js + TypeScript backend API for GolfTracker.

## 🚀 Kom i gang

### Installasjon

```bash
npm install
```

### Kjør i development-modus

```bash
npm run dev
```

### Bygg for produksjon

```bash
npm run build
npm start
```

## 📁 Prosjektstruktur

```
src/
├── config/              # Konfigurasjoner (AWS, database)
│   └── aws.ts           # AWS SDK konfigurasjon
├── controllers/         # Request handlers
│   ├── authController.ts
│   ├── userController.ts
│   ├── roundController.ts
│   ├── courseController.ts
│   └── leaderboardController.ts
├── middleware/          # Express middleware
│   ├── authenticate.ts  # JWT autentisering
│   ├── errorHandler.ts  # Global error handler
│   └── validate.ts      # Zod validering
├── routes/              # API routes
│   ├── authRoutes.ts
│   ├── userRoutes.ts
│   ├── roundRoutes.ts
│   ├── courseRoutes.ts
│   └── leaderboardRoutes.ts
├── utils/               # Utility functions
│   ├── jwt.ts           # JWT helpers
│   └── password.ts      # Bcrypt helpers
├── validators/          # Zod schemas
│   └── schemas.ts
└── index.ts             # Entry point
```

## 🔒 Autentisering

API bruker JWT (JSON Web Tokens) for autentisering.

### Registrering

```
POST /api/auth/register
Body: { email, password, firstName, lastName }
```

### Innlogging

```
POST /api/auth/login
Body: { email, password }
Returns: { user, token }
```

### Autentiserte requests

Legg til header:

```
Authorization: Bearer <token>
```

## 📡 API Endpoints

### Auth

- `POST /api/auth/register` - Registrer ny bruker
- `POST /api/auth/login` - Logg inn
- `GET /api/auth/verify` - Verifiser token

### User

- `GET /api/user/profile` - Hent profil
- `PUT /api/user/profile` - Oppdater profil
- `POST /api/user/profile-image` - Last opp profilbilde
- `GET /api/user/handicap-history` - Hent handicap-historikk

### Rounds

- `GET /api/rounds` - Hent alle runder
- `GET /api/rounds/:id` - Hent spesifikk runde
- `POST /api/rounds` - Opprett ny runde
- `PUT /api/rounds/:id` - Oppdater runde
- `DELETE /api/rounds/:id` - Slett runde

### Courses

- `GET /api/courses` - Hent alle baner
- `GET /api/courses/:id` - Hent spesifikk bane
- `GET /api/courses/search?q=query` - Søk etter baner

### Leaderboard

- `GET /api/leaderboard?limit=50` - Hent leaderboard

## 🗄️ Database

Bruker AWS DynamoDB med følgende tabeller:

- `golftracker-users` - Brukere
- `golftracker-rounds` - Golfrunder
- `golftracker-courses` - Golfbaner

## 📦 S3

Profilbilder lagres i S3:

- Bucket: `golftracker-profiles`
- Prefix: `profile-images/`

## 🛠️ Miljøvariabler

Se `.env.example` for nødvendige miljøvariabler.

## 🧪 Testing

```bash
npm test
```

## 📝 Notater

- Handicap-beregningen er forenklet og bør forbedres i produksjon
- Bør legge til rate limiting
- Bør legge til request logging med Morgan eller Winston
- Bør legge til input sanitization
- Bør legge til caching med Redis for ofte-brukte data
