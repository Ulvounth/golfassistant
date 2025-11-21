interface UserAvatarProps {
  firstName: string;
  lastName: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * UserAvatar - Reusable avatar component showing user initials or profile image
 */
export function UserAvatar({
  firstName,
  lastName,
  imageUrl,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-24 h-24 text-3xl',
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 ${className}`}
    >
      {initials}
    </div>
  );
}
