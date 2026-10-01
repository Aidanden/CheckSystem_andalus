import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Always call same-origin `/api` from the browser.
 * Next.js rewrites proxy to Express (API_INTERNAL_URL).
 * Never use localhost — that breaks remote production users.
 */
const BROWSER_API_BASE = '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: BROWSER_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    // Force same-origin even if an old bundle tried to override baseURL
    if (typeof window !== 'undefined') {
      config.baseURL = BROWSER_API_BASE;
    }

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
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
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
