interface RankBadgeProps {
  rank: number;
  className?: string;
}

/**
 * RankBadge - Display rank with medals for top 3 positions
 */
export function RankBadge({ rank, className = '' }: RankBadgeProps) {
  const getMedalEmoji = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}.`;
  };

  return <span className={className}>{getMedalEmoji(rank)}</span>;
}
