import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getHandicapHistory,
  searchUsers,
} from '../controllers/userController';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../validators/schemas';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Alle ruter krever autentisering
router.use(authenticate);

/**
 * GET /api/user/search?q=query
 * Søk etter brukere (må være før /profile for å ikke matche :id pattern)
 */
router.get('/search', searchUsers);

/**
 * GET /api/user/profile
 * Hent brukerens profil
 */
router.get('/profile', getProfile);

/**
 * PUT /api/user/profile
 * Oppdater brukerens profil
 */
router.put('/profile', validate(updateProfileSchema), updateProfile);

/**
 * POST /api/user/profile-image
 * Last opp profilbilde
 */
router.post('/profile-image', upload.single('image'), uploadProfileImage);

/**
 * GET /api/user/handicap-history
 * Hent handicap-historikk
 */
router.get('/handicap-history', getHandicapHistory);

export default router;
