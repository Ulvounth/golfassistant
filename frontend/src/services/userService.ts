import api from '@/lib/axios';
import { User } from '@/types';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  handicap: number;
  profileImageUrl?: string;
}

/**
 * Service for brukerprofilhåndtering
 */
export const userService = {
  /**
   * Henter brukerens profil
   */
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/user/profile');
    return response.data;
  },

  /**
   * Oppdaterer brukerens profil
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put<User>('/user/profile', data);
    return response.data;
  },

  /**
   * Laster opp profilbilde
   */
  async uploadProfileImage(file: File): Promise<{ profileImageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<{ profileImageUrl: string }>('/user/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Henter brukerens handicap-historikk
   */
  async getHandicapHistory(): Promise<{ date: string; handicap: number }[]> {
    const response = await api.get<{ date: string; handicap: number }[]>('/user/handicap-history');
    return response.data;
  },

  /**
   * Søker etter brukere
   */
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const response = await api.get<UserSearchResult[]>('/user/search', {
      params: { q: query },
    });
    return response.data;
  },

  /**
   * Henter flere brukere basert på IDs
   */
  async batchGetUsers(userIds: string[]): Promise<UserSearchResult[]> {
    if (userIds.length === 0) return [];

    const response = await api.post<UserSearchResult[]>('/user/batch', {
      userIds,
    });
    return response.data;
  },

  /**
   * Re-kalkulerer handicap basert på eksisterende runder
   * Nyttig når runder er slettet manuelt fra databasen
   */
  async recalculateHandicap(): Promise<User> {
    const response = await api.post<{ message: string; user: User }>('/user/recalculate-handicap');
    return response.data.user;
  },
};
