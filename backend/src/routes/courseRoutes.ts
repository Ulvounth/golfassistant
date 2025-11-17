import { Router } from 'express';
import {
  getCourses,
  getCourse,
  searchCourses,
  createCourse,
} from '../controllers/courseController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * GET /api/courses
 * Hent alle golfbaner
 */
router.get('/', getCourses);

/**
 * GET /api/courses/search
 * Søk etter golfbaner
 */
router.get('/search', searchCourses);

/**
 * GET /api/courses/:id
 * Hent en spesifikk golfbane
 */
router.get('/:id', getCourse);

/**
 * POST /api/courses
 * Opprett ny golfbane (krever autentisering)
 */
router.post('/', authenticate, createCourse);

export default router;
