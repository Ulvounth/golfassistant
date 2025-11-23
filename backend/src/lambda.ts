import serverless from 'serverless-http';
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
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Routes - API Gateway sends /api/* so we need /api prefix here
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// API Root & Health check - Welcome page with full documentation
app.get(['/api', '/api/health'], (req, res) => {
  res.json({
    name: 'GolfTracker API',
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
    documentation: 'https://github.com/Ulvounth/golftracker',
    frontend: 'https://golfassistant.vercel.app',
  });
});

// Error handler
app.use(errorHandler);

// Export Lambda handler
// Version: 1.0.1 - Fixed for AWS Lambda
export const handler = serverless(app);
