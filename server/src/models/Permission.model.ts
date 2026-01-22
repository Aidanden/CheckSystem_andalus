import prisma from '../lib/prisma';
import { Permission } from '@prisma/client';

export class PermissionModel {
  static async findAll(): Promise<Permission[]> {
    return prisma.permission.findMany({
      orderBy: { id: 'asc' },
    });
  }

  static async findById(id: number): Promise<Permission | null> {
    return prisma.permission.findUnique({
      where: { id },
    });
  }

  static async findByCode(code: string): Promise<Permission | null> {
    return prisma.permission.findUnique({
      where: { permissionCode: code },
    });
  }

  static async findByUserId(userId: number): Promise<Permission[]> {
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
      orderBy: { permission: { id: 'asc' } },
    });
    
    return userPermissions.map(up => up.permission);
  }
}
