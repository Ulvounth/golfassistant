/**
 * Format date to Norwegian locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get color class for score relative to par
 */
export function getScoreColor(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return 'text-blue-600 font-bold'; // Eagle or better
  if (diff === -1) return 'text-green-600 font-semibold'; // Birdie
  if (diff === 0) return 'text-gray-700'; // Par
  if (diff === 1) return 'text-orange-600'; // Bogey
  return 'text-red-600'; // Double bogey or worse
}

/**
 * Format score differential with sign
 */
export function formatScoreDiff(score: number, par: number): string {
  const diff = score - par;
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

/**
 * Format handicap to one decimal place
 */
export function formatHandicap(handicap: number): string {
  return handicap.toFixed(1);
}

/**
 * Get CSS classes for tee color badge background
 */
export function getTeeColorBadgeClasses(color: string): string {
  const colors: Record<string, string> = {
    white: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
  };
  return colors[color] || 'bg-gray-100 text-gray-800';
}
