interface TeeColorBadgeProps {
  color: 'white' | 'yellow' | 'blue' | 'red';
  className?: string;
}

/**
 * TeeColorBadge - Reusable tee color indicator with emoji and label
 */
export function TeeColorBadge({ color, className = '' }: TeeColorBadgeProps) {
  const colorConfig = {
    white: { emoji: '⚪', label: 'White' },
    yellow: { emoji: '🟡', label: 'Yellow' },
    blue: { emoji: '🔵', label: 'Blue' },
    red: { emoji: '🔴', label: 'Red' },
  };

  const config = colorConfig[color];

  return (
    <span className={className}>
      {config.emoji} {config.label}
    </span>
  );
}
