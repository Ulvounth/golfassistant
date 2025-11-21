interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

/**
 * LoadingSpinner - Reusable loading spinner component
 */
export function LoadingSpinner({ size = 'md', message, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-b-2',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-primary-600 ${sizeClasses[size]}`}
        style={{ borderTopColor: 'transparent' }}
      />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );
}
