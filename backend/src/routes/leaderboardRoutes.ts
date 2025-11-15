import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController';

const router = Router();

/**
 * GET /api/leaderboard
 * Hent leaderboard
 */
router.get('/', getLeaderboard);

export default router;
