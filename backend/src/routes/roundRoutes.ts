import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getRounds,
  getRound,
  createRound,
  updateRound,
  deleteRound,
} from '../controllers/roundController';
import { validate } from '../middleware/validate';
import { createRoundSchema } from '../validators/schemas';

const router = Router();

// Alle ruter krever autentisering
router.use(authenticate);

/**
 * GET /api/rounds
 * Hent alle runder for bruker
 */
router.get('/', getRounds);

/**
 * GET /api/rounds/:id
 * Hent en spesifikk runde
 */
router.get('/:id', getRound);

/**
 * POST /api/rounds
 * Opprett ny runde
 */
router.post('/', validate(createRoundSchema), createRound);

/**
 * PUT /api/rounds/:id
 * Oppdater eksisterende runde
 */
router.put('/:id', updateRound);

/**
 * DELETE /api/rounds/:id
 * Slett runde
 */
router.delete('/:id', deleteRound);

export default router;
