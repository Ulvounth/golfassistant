import { Router } from 'express';
import { getCourses, getCourse, searchCourses } from '../controllers/courseController';

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

export default router;
