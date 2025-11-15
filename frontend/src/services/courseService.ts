import api from '@/lib/axios';
import { GolfCourse } from '@/types';

/**
 * Service for golfbaner
 */
export const courseService = {
  /**
   * Henter alle tilgjengelige golfbaner
   */
  async getCourses(): Promise<GolfCourse[]> {
    const response = await api.get<GolfCourse[]>('/courses');
    return response.data;
  },

  /**
   * Henter en spesifikk golfbane
   */
  async getCourse(id: string): Promise<GolfCourse> {
    const response = await api.get<GolfCourse>(`/courses/${id}`);
    return response.data;
  },

  /**
   * Søker etter golfbaner
   */
  async searchCourses(query: string): Promise<GolfCourse[]> {
    const response = await api.get<GolfCourse[]>(`/courses/search?q=${query}`);
    return response.data;
  },
};
