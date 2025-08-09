import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add group access token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('group_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('group_access_token');
      localStorage.removeItem('groupInfo');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Kiosk API moved to `src/features/kiosk/api/kiosk.ts`

// Note: Student join API moved to `src/features/session-joining/api/join-session.ts`