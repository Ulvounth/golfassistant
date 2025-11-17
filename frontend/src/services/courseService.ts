import api from '@/lib/axios';
import { GolfCourse, CourseHole } from '@/types';

export interface CreateCourseData {
  name: string;
  location: string;
  holes: CourseHole[];
  rating: {
    white: number;
    yellow: number;
    blue: number;
    red: number;
  };
  slope: {
    white: number;
    yellow: number;
    blue: number;
    red: number;
  };
}

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

  /**
   * Oppretter en ny golfbane
   */
  async createCourse(data: CreateCourseData): Promise<GolfCourse> {
    const response = await api.post<GolfCourse>('/courses', data);
    return response.data;
  },
};
