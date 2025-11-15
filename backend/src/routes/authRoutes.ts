import { Router } from 'express';
import { register, login, verifyToken } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/schemas';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * POST /api/auth/register
 * Registrer ny bruker
 */
router.post('/register', validate(registerSchema), register);

/**
 * POST /api/auth/login
 * Logg inn bruker
 */
router.post('/login', validate(loginSchema), login);

/**
 * GET /api/auth/verify
 * Verifiser JWT token
 */
router.get('/verify', authenticate, verifyToken);

export default router;
