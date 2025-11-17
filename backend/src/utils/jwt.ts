import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Hent JWT secret (leser direkte fra process.env hver gang)
 */
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET er ikke satt i environment variables');
  }
  return secret;
};

/**
 * Generer JWT token
 */
export const generateToken = (payload: { userId: string; email: string }): string => {
  const JWT_SECRET = getJWTSecret();
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);

  return token;
};

/**
 * Verifiser JWT token
 */
export const verifyToken = (token: string): { userId: string; email: string } | null => {
  try {
    const JWT_SECRET = getJWTSecret();
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
};
