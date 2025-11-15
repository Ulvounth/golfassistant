/**
 * Type-definisjon for en bruker
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  handicap: number;
  profileImageUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type-definisjon for en golfrunde
 */
export interface GolfRound {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  teeColor: 'white' | 'yellow' | 'blue' | 'red';
  numberOfHoles: 9 | 18;
  date: string;
  holes: HoleScore[];
  totalScore: number;
  totalPar: number;
  scoreDifferential: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type-definisjon for score på ett hull
 */
export interface HoleScore {
  holeNumber: number;
  par: number;
  strokes: number;
  fairwayHit: boolean; // VC (veien ble truffet)
  greenInRegulation: boolean; // S (på green i regulation)
  putts: number; // OUT (antall putter)
}

/**
 * Type-definisjon for en golfbane
 */
export interface GolfCourse {
  id: string;
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
 * Type-definisjon for hull på en golfbane
 */
export interface CourseHole {
  holeNumber: number;
  par: number;
  length: {
    white: number;
    yellow: number;
    blue: number;
    red: number;
  };
  strokeIndex: number; // Vanskelighetsnivå
}

/**
 * Type-definisjon for autentiseringsrespons
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Type-definisjon for leaderboard-entry
 */
export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  handicap: number;
  roundsPlayed: number;
  profileImageUrl?: string;
}
