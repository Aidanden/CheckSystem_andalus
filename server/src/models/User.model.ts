import prisma from '../lib/prisma';
import { User, Branch, Permission } from '@prisma/client';

export interface UserWithPermissions extends Omit<User, 'passwordHash'> {
  branch?: Branch | null;
  permissions: Permission[];
}

export class UserModel {
  static async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { id: 'asc' },
    });
  }

  static async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  static async findByIdWithDetails(id: number): Promise<UserWithPermissions | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        branch: true,
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) return null;

    const { passwordHash, userPermissions, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      permissions: userPermissions.map(up => up.permission),
    };
  }

  static async create(user: {
    username: string;
    passwordHash: string;
    branchId?: number;
    isAdmin?: boolean;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        username: user.username,
        passwordHash: user.passwordHash,
        branchId: user.branchId || null,
        isAdmin: user.isAdmin || false,
      },
    });
  }

  static async update(
    id: number,
    user: {
      username?: string;
      passwordHash?: string;
      branchId?: number | null;
      isAdmin?: boolean;
      isActive?: boolean;
    }
  ): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data: user,
    });
  }

  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  static async assignPermissions(userId: number, permissionIds: number[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.userPermission.deleteMany({
        where: { userId },
      });

      // Insert new permissions
      if (permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: permissionIds.map(permissionId => ({
            userId,
            permissionId,
          })),
        });
      }
    });
  }

  static async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const count = await prisma.userPermission.count({
      where: {
        userId,
        permission: {
          permissionCode,
        },
      },
    });

    return count > 0;
  }
}
