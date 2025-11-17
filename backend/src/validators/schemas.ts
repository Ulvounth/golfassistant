import { z } from 'zod';

/**
 * Validering for registrering
 */
export const registerSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(8, 'Passord må være minst 8 tegn'),
  firstName: z.string().min(1, 'Fornavn er påkrevd'),
  lastName: z.string().min(1, 'Etternavn er påkrevd'),
});

/**
 * Validering for innlogging
 */
export const loginSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(1, 'Passord er påkrevd'),
});

/**
 * Validering for oppdatering av profil
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  bio: z.string().max(500, 'Bio kan ikke være mer enn 500 tegn').optional(),
});

/**
 * Validering for ny golfrunde
 */
export const createRoundSchema = z.object({
  courseId: z.string().uuid('Ugyldig courseId'),
  courseName: z.string().min(1, 'Banenavn er påkrevd'),
  teeColor: z.enum(['white', 'yellow', 'blue', 'red'], {
    errorMap: () => ({ message: 'Ugyldig tee-farge' }),
  }),
  numberOfHoles: z.union([z.literal(9), z.literal(18)], {
    errorMap: () => ({ message: 'Antall hull må være 9 eller 18' }),
  }),
  date: z.string().datetime('Ugyldig datoformat'),
  players: z.array(z.string()).optional().default([]), // Array of userIds
  holes: z.array(
    z.object({
      holeNumber: z.number().int().min(1).max(18),
      par: z.number().int().min(3).max(6),
      strokes: z.number().int().min(1),
      fairwayHit: z.boolean(),
      greenInRegulation: z.boolean(),
      putts: z.number().int().min(0),
    })
  ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateRoundInput = z.infer<typeof createRoundSchema>;
