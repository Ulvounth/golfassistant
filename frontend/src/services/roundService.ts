import api from '@/lib/axios';
import { GolfRound, HoleScore } from '@/types';

export interface CreateRoundData {
  courseId: string;
  courseName: string;
  teeColor: 'white' | 'yellow' | 'blue' | 'red';
  numberOfHoles: 9 | 18;
  date: string;
  holes: HoleScore[];
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
