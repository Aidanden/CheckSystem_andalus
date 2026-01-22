import { UserModel, UserWithPermissions } from '../models/User.model';
import { BranchModel } from '../models/Branch.model';
import { PermissionModel } from '../models/Permission.model';
import { AuthService } from './auth.service';
import { CreateUserRequest, UpdateUserRequest } from '../types';

export class UserService {
  static async getAllUsers(): Promise<UserWithPermissions[]> {
    const users = await UserModel.findAll();
    const usersWithDetails: UserWithPermissions[] = [];

    for (const user of users) {
      const userWithDetails = await UserModel.findByIdWithDetails(user.id);
      if (userWithDetails) {
        usersWithDetails.push(userWithDetails);
      }
    }

    return usersWithDetails;
  }

  static async getUserById(id: number): Promise<UserWithPermissions> {
    const user = await UserModel.findByIdWithDetails(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  static async createUser(data: CreateUserRequest): Promise<UserWithPermissions> {
    // Check if username already exists
    const existing = await UserModel.findByUsername(data.username);
    if (existing) {
      throw new Error('Username already exists');
    }

    // Validate branch if provided
    if (data.branch_id) {
      const branch = await BranchModel.findById(data.branch_id);
      if (!branch) {
        throw new Error('Branch not found');
      }
    }

    // Validate permissions
    for (const permissionId of data.permission_ids) {
      const permission = await PermissionModel.findById(permissionId);
      if (!permission) {
        throw new Error(`Permission with id ${permissionId} not found`);
      }
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(data.password);

    // Create user
    const user = await UserModel.create({
      username: data.username,
      passwordHash: passwordHash,
      branchId: data.branch_id,
      isAdmin: data.is_admin || false,
    });

    // Assign permissions
    await UserModel.assignPermissions(user.id, data.permission_ids);

    // Return user with details
    const userWithDetails = await UserModel.findByIdWithDetails(user.id);
    if (!userWithDetails) {
      throw new Error('Failed to fetch created user');
    }

    return userWithDetails;
  }

  static async updateUser(id: number, data: UpdateUserRequest): Promise<UserWithPermissions> {
    // Check if user exists
    const existing = await UserModel.findById(id);
    if (!existing) {
      throw new Error('User not found');
    }

    // Check if new username conflicts
    if (data.username && data.username !== existing.username) {
      const conflict = await UserModel.findByUsername(data.username);
      if (conflict) {
        throw new Error('Username already exists');
      }
    }

    // Validate branch if provided
    if (data.branch_id) {
      const branch = await BranchModel.findById(data.branch_id);
      if (!branch) {
        throw new Error('Branch not found');
      }
    }

    // Validate permissions if provided
    if (data.permission_ids) {
      for (const permissionId of data.permission_ids) {
        const permission = await PermissionModel.findById(permissionId);
        if (!permission) {
          throw new Error(`Permission with id ${permissionId} not found`);
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      username: data.username,
      branchId: data.branch_id,
      isAdmin: data.is_admin,
      isActive: data.is_active,
    };

    // Hash new password if provided
    if (data.password) {
      updateData.passwordHash = await AuthService.hashPassword(data.password);
    }

    // Update user
    await UserModel.update(id, updateData);

    // Update permissions if provided
    if (data.permission_ids) {
      await UserModel.assignPermissions(id, data.permission_ids);
    }

    // Return updated user with details
    const updated = await UserModel.findByIdWithDetails(id);
    if (!updated) {
      throw new Error('Failed to fetch updated user');
    }

    return updated;
  }

  static async deleteUser(id: number): Promise<void> {
    const success = await UserModel.delete(id);
    if (!success) {
      throw new Error('Failed to delete user');
    }
  }

  static async checkPermission(userId: number, permissionCode: string): Promise<boolean> {
    const user = await UserModel.findById(userId);
    if (!user) {
      return false;
    }

    // Admins have all permissions
    if (user.isAdmin) {
      return true;
    }

    return UserModel.hasPermission(userId, permissionCode);
  }
}
