import api from '@/lib/axios';
import { LeaderboardEntry } from '@/types';

/**
 * Service for leaderboard
 */
export const leaderboardService = {
  /**
   * Henter leaderboard
   */
  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    const response = await api.get<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`);
    return response.data;
  },
};
