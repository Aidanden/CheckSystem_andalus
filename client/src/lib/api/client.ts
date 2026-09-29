import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Resolve API base URL for the browser.
 * Never use localhost/127.0.0.1 from the user's machine — that breaks production.
 * Prefer same-origin `/api` (Next.js rewrites to Express).
 */
function resolveApiUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim();

  if (typeof window !== 'undefined') {
    if (!configured || /localhost|127\.0\.0\.1/i.test(configured)) {
      return '/api';
    }
  }

  return configured || '/api';
}

const API_URL = resolveApiUrl();

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Don't redirect away from the login page itself
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const request = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<T>(config);
  return response.data;
};

export default apiClient;
