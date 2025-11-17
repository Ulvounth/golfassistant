import axios from 'axios';

// Opprett en axios-instans med grunnleggende konfigurasjon
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for å legge til JWT token i alle requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor for å håndtere 401 Unauthorized
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Lagre current path for redirect etter login
      const currentPath = window.location.pathname;

      // Clear auth data direkte (unngå circular dependency)
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Trigge en custom event for å oppdatere authStore
      window.dispatchEvent(new Event('auth-logout'));

      // Redirect til login med current path
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
    return Promise.reject(error);
  }
);

export default api;
