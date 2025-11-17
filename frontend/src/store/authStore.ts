import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

/**
 * Global state for autentisering med Zustand
 * Håndterer brukerdata og JWT token
 */
export const useAuthStore = create<AuthState>(set => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: user => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));

// Initialisér brukerdata fra localStorage ved oppstart
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

if (storedToken && storedUser) {
  try {
    const user = JSON.parse(storedUser);

    // Sjekk om token er utløpt
    const payload = JSON.parse(atob(storedToken.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const isExpired = Date.now() >= expiryTime;

    if (isExpired) {
      // Token er utløpt, clear alt
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } else {
      // Token er gyldig, last inn state
      useAuthStore.setState({ user, token: storedToken, isAuthenticated: true });
    }
  } catch (error) {
    console.error('Failed to parse stored auth data:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

// Lytt til logout-event fra axios interceptor
window.addEventListener('auth-logout', () => {
  useAuthStore.getState().logout();
});
