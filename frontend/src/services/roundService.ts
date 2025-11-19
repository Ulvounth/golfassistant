import api from '@/lib/axios';
import { GolfRound, HoleScore } from '@/types';

export interface CreateRoundData {
  courseId: string;
  courseName: string;
  teeColor: 'white' | 'yellow' | 'blue' | 'red';
  numberOfHoles: 9 | 18;
  date: string;
  players: string[]; // Array of userIds
  holes: HoleScore[];
}

export interface PlayerScores {
  playerId: string;
  holes: HoleScore[];
}

export interface CreateMultiPlayerRoundData {
  courseId: string;
  courseName: string;
  teeColor: 'white' | 'yellow' | 'blue' | 'red';
  numberOfHoles: 9 | 18;
  date: string;
  playerScores: PlayerScores[];
}

/**
 * Service for håndtering av golfrunder
 */
export const roundService = {
  /**
   * Henter alle runder for innlogget bruker
   */
  async getRounds(): Promise<GolfRound[]> {
    const response = await api.get<GolfRound[]>('/rounds');
    return response.data;
  },

  /**
   * Henter en spesifikk runde
   */
  async getRound(id: string): Promise<GolfRound> {
    const response = await api.get<GolfRound>(`/rounds/${id}`);
    return response.data;
  },

  /**
   * Oppretter en ny runde
   */
  async createRound(data: CreateRoundData): Promise<GolfRound> {
    const response = await api.post<GolfRound>('/rounds', data);
    return response.data;
  },

  /**
   * Oppretter runde for flere spillere samtidig
   */
  async createMultiPlayerRound(
    data: CreateMultiPlayerRoundData
  ): Promise<{ message: string; rounds: GolfRound[] }> {
    const response = await api.post<{ message: string; rounds: GolfRound[] }>(
      '/rounds/multi-player',
      data
    );
    return response.data;
  },

  /**
   * Oppdaterer en eksisterende runde
   */
  async updateRound(id: string, data: Partial<CreateRoundData>): Promise<GolfRound> {
    const response = await api.put<GolfRound>(`/rounds/${id}`, data);
    return response.data;
  },

  /**
   * Sletter en runde
   */
  async deleteRound(id: string): Promise<void> {
    await api.delete(`/rounds/${id}`);
  },
};
