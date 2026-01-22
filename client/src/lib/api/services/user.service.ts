import { request } from '../client';
import { User, CreateUserRequest, UpdateUserRequest, Permission } from '@/types';

export const userService = {
  // Get all users
  getAll: async (): Promise<User[]> => {
    return request<User[]>({
      url: '/users',
      method: 'GET',
    });
  },

  // Get user by ID
  getById: async (id: number): Promise<User> => {
    return request<User>({
      url: `/users/${id}`,
      method: 'GET',
    });
  },

  // Create user
  create: async (data: CreateUserRequest): Promise<User> => {
    return request<User>({
      url: '/users',
      method: 'POST',
      data,
    });
  },

  // Update user
  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    return request<User>({
      url: `/users/${id}`,
      method: 'PUT',
      data,
    });
  },

  // Delete user
  delete: async (id: number): Promise<{ message: string }> => {
    return request<{ message: string }>({
      url: `/users/${id}`,
      method: 'DELETE',
    });
  },

  // Get all permissions
  getPermissions: async (): Promise<Permission[]> => {
    return request<Permission[]>({
      url: '/users/permissions',
      method: 'GET',
    });
  },
};

