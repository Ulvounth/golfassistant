import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roundRoutes from './routes/roundRoutes';
import courseRoutes from './routes/courseRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import { errorHandler } from './middleware/errorHandler';

// Last inn miljøvariabler
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Sikkerhet
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' })); // CORS
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Ruter
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler (må være sist)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server kjører på port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});

export default app;
