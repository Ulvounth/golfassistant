import serverlessExpress from '@vendia/serverless-express';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roundRoutes from './routes/roundRoutes';
import courseRoutes from './routes/courseRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import { errorHandler } from './middleware/errorHandler';

// Create Express app
const app: Express = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(
  cors({
    origin: [
      'https://golfassistant.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      '*',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Routes - API Gateway already strips /api prefix, so routes start from /
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/rounds', roundRoutes);
app.use('/courses', courseRoutes);
app.use('/leaderboard', leaderboardRoutes);

// API Root & Health check - Welcome page with full documentation
app.get(['/', '/health'], (req, res) => {
  res.json({
    name: 'GolfAssistant API',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
      user: {
        profile: 'GET /api/user/profile',
        updateProfile: 'PUT /api/user/profile',
        uploadImage: 'POST /api/user/profile/image',
      },
      rounds: {
        list: 'GET /api/rounds',
        create: 'POST /api/rounds',
        getById: 'GET /api/rounds/:id',
        update: 'PUT /api/rounds/:id',
        delete: 'DELETE /api/rounds/:id',
      },
      courses: {
        list: 'GET /api/courses',
        create: 'POST /api/courses',
      },
      leaderboard: {
        topPlayers: 'GET /api/leaderboard',
      },
    },
    documentation: 'https://github.com/Ulvounth/golfassistant',
    frontend: 'https://golfassistant.vercel.app',
  });
});

// Error handler
app.use(errorHandler);

// Export Lambda handler using @vendia/serverless-express
export const handler = serverlessExpress({ app });
