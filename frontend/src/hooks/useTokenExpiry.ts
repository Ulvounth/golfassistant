import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook for å sjekke om JWT token snart utløper
 * Returnerer antall minutter til token utløper
 */
export function useTokenExpiry() {
  const token = useAuthStore(state => state.token);
  const [minutesUntilExpiry, setMinutesUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      setMinutesUntilExpiry(null);
      return;
    }

    const checkExpiry = () => {
      try {
        // Decode JWT token (base64)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const minutesLeft = Math.floor((expiryTime - now) / 60000);

        setMinutesUntilExpiry(minutesLeft);
      } catch (error) {
        console.error('Failed to decode token:', error);
        setMinutesUntilExpiry(null);
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60000);

    return () => clearInterval(interval);
  }, [token]);

  return {
    minutesUntilExpiry,
    isExpiringSoon: minutesUntilExpiry !== null && minutesUntilExpiry < 30, // < 30 min
    isExpired: minutesUntilExpiry !== null && minutesUntilExpiry <= 0,
  };
}
