# GolfTracker Backend

Node.js + TypeScript backend API for GolfTracker.

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

### Build for production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── config/              # Configuration (AWS, database)
│   └── aws.ts           # AWS SDK configuration
├── controllers/         # Request handlers
│   ├── authController.ts
│   ├── userController.ts
│   ├── roundController.ts
│   ├── courseController.ts
│   └── leaderboardController.ts
├── middleware/          # Express middleware
│   ├── authenticate.ts  # JWT authentication
│   ├── errorHandler.ts  # Global error handler
│   └── validate.ts      # Zod validation
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

## 🔒 Authentication

API uses JWT (JSON Web Tokens) for authentication.

### Registration

```
POST /api/auth/register
Body: { email, password, firstName, lastName }
```

### Login

```
POST /api/auth/login
Body: { email, password }
Returns: { user, token }
```

### Authenticated requests

Add header:

```
Authorization: Bearer <token>
```

## 📡 API Endpoints

### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### User

- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/profile-image` - Upload profile image
- `GET /api/user/handicap-history` - Get handicap history

### Rounds

- `GET /api/rounds` - Get all rounds
- `GET /api/rounds/:id` - Get specific round
- `POST /api/rounds` - Create new round
- `PUT /api/rounds/:id` - Update round
- `DELETE /api/rounds/:id` - Delete round

### Courses

- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get specific course
- `GET /api/courses/search?q=query` - Search courses

### Leaderboard

- `GET /api/leaderboard?limit=50` - Get leaderboard

## 🗄️ Database

Uses AWS DynamoDB with the following tables:

- `golftracker-users` - Users
- `golftracker-rounds` - Golf rounds
- `golftracker-courses` - Golf courses

## 📦 S3

Profile images are stored in S3:

- Bucket: `golftracker-profiles`
- Prefix: `profile-images/`

## 🛠️ Environment Variables

See `.env.example` for required environment variables.

## 🧪 Testing

```bash
npm test
```

## 📝 Notes

- Handicap calculation is simplified and should be improved for production
- Should add rate limiting
- Should add request logging with Morgan or Winston
- Should add input sanitization
- Should add caching with Redis for frequently accessed data
