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

export interface PaginatedRoundsResponse {
  rounds: GolfRound[];
  nextToken: string | null;
  hasMore: boolean;
}

/**
 * Service for håndtering av golfrunder
 */
export const roundService = {
  /**
   * Henter runder for innlogget bruker med paginering
   */
  async getRounds(limit: number = 20, nextToken?: string): Promise<PaginatedRoundsResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (nextToken) {
      params.append('nextToken', nextToken);
    }

    const response = await api.get<PaginatedRoundsResponse>(`/rounds?${params.toString()}`);
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
   * Henter runder basert på dato, bane og spillere
   */
  async getRoundsByCriteria(
    date: string,
    courseId: string,
    userIds: string[]
  ): Promise<GolfRound[]> {
    const response = await api.post<GolfRound[]>('/rounds/by-criteria', {
      date,
      courseId,
      userIds,
    });
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
   * @param deleteRelated - Hvis true, sletter alle relaterte multi-player runder. Hvis false, sletter kun din egen runde.
   */
  async deleteRound(id: string, deleteRelated: boolean = true): Promise<void> {
    await api.delete(`/rounds/${id}?deleteRelated=${deleteRelated}`);
  },
};
