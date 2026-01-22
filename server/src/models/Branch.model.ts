import prisma from '../lib/prisma';
import { Branch } from '@prisma/client';

export class BranchModel {
  static async findAll(): Promise<Branch[]> {
    return prisma.branch.findMany({
      orderBy: { id: 'asc' },
    });
  }

  static async findById(id: number): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { id },
    });
  }

  static async findByRoutingNumber(routingNumber: string): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { routingNumber },
    });
  }

  static async findByBranchCode(branchCode: string): Promise<Branch | null> {
    const trimmedCode = branchCode?.trim();
    if (!trimmedCode) {
      return null;
    }

    // محاولة البحث بالرقم كما هو
    let branch = await prisma.branch.findFirst({
      where: {
        branchNumber: trimmedCode,
      },
    });

    if (branch) return branch;

    // محاولة البحث بدون أصفار بادئة (مثلاً "001" -> "1")
    const noZeros = trimmedCode.replace(/^0+/, '');
    if (noZeros && noZeros !== trimmedCode) {
      branch = await prisma.branch.findFirst({
        where: {
          branchNumber: noZeros,
        },
      });
    }

    if (branch) return branch;

    // محاولة البحث مع أصفار بادئة (مثلاً "1" -> "001")
    const padded = trimmedCode.padStart(3, '0');
    if (padded !== trimmedCode) {
      branch = await prisma.branch.findFirst({
        where: {
          branchNumber: padded,
        },
      });
    }

    return branch;
  }

  static async create(branch: {
    branchName: string;
    branchLocation: string;
    routingNumber: string;
    branchNumber?: string;
    accountingNumber?: string;
  }): Promise<Branch> {
    return prisma.branch.create({
      data: branch,
    });
  }

  static async update(
    id: number,
    branch: {
      branchName?: string;
      branchLocation?: string;
      routingNumber?: string;
      branchNumber?: string;
      accountingNumber?: string;
    }
  ): Promise<Branch | null> {
    return prisma.branch.update({
      where: { id },
      data: branch,
    });
  }

  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.branch.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
