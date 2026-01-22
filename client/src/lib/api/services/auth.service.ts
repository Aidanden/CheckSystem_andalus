import { request } from '../client';
import { LoginRequest, LoginResponse, User } from '@/types';

export const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return request<LoginResponse>({
      url: '/auth/login',
      method: 'POST',
      data: credentials,
    });
  },

  // Get current user
  getMe: async (): Promise<User> => {
    return request<User>({
      url: '/users/me',
      method: 'GET',
    });
  },

  // Logout (client-side)
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
};

