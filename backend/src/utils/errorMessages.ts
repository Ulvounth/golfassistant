/**
 * Standard error messages for the API
 */
export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'Du må være logget inn for å utføre denne handlingen',
  INVALID_TOKEN: 'Ugyldig eller utløpt token',
  INVALID_CREDENTIALS: 'Ugyldig e-post eller passord',
  EMAIL_IN_USE: 'E-postadressen er allerede i bruk',

  // Authorization
  FORBIDDEN: 'Du har ikke tilgang til denne ressursen',
  NOT_YOUR_ROUND: 'Du kan bare redigere dine egne runder',

  // Validation
  INVALID_INPUT: 'Ugyldig input',
  MISSING_REQUIRED_FIELDS: 'Mangler påkrevde felter',
  SEARCH_TOO_SHORT: 'Søkeord må være minst 2 tegn',

  // Resources
  USER_NOT_FOUND: 'Bruker ikke funnet',
  ROUND_NOT_FOUND: 'Runde ikke funnet',
  COURSE_NOT_FOUND: 'Golfbane ikke funnet',

  // Database
  DATABASE_ERROR: 'Databasefeil - prøv igjen senere',
  FETCH_ERROR: 'Kunne ikke hente data',
  CREATE_ERROR: 'Kunne ikke opprette ressurs',
  UPDATE_ERROR: 'Kunne ikke oppdatere ressurs',
  DELETE_ERROR: 'Kunne ikke slette ressurs',

  // Server
  INTERNAL_ERROR: 'En uventet feil oppstod',
  SERVER_CONFIG_ERROR: 'Server konfigurasjonsfeil',

  // Rate limiting
  TOO_MANY_REQUESTS: 'For mange forespørsler - prøv igjen senere',
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
