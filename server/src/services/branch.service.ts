import { BranchModel } from '../models/Branch.model';
import { Branch } from '@prisma/client';
import { CreateBranchRequest } from '../types';

export class BranchService {
  static async getAllBranches(): Promise<Branch[]> {
    return BranchModel.findAll();
  }

  static async getBranchById(id: number): Promise<Branch> {
    const branch = await BranchModel.findById(id);
    if (!branch) {
      throw new Error('Branch not found');
    }
    return branch;
  }

  static async getBranchByCode(branchCode: string): Promise<Branch | null> {
    return BranchModel.findByBranchCode(branchCode);
  }

  static async getBranchByAccountNumber(accountNumber: string): Promise<Branch | null> {
    if (!accountNumber || accountNumber.length < 3) return null;
    const branchCode = accountNumber.substring(0, 3);
    return BranchModel.findByBranchCode(branchCode);
  }

  static async createBranch(data: CreateBranchRequest): Promise<Branch> {
    // Check if routing number already exists
    const existing = await BranchModel.findByRoutingNumber(data.routing_number);
    if (existing) {
      throw new Error('Routing number already exists');
    }

    return BranchModel.create({
      branchName: data.branch_name,
      branchLocation: data.branch_location,
      routingNumber: data.routing_number,
      branchNumber: data.branch_number ?? '',
      accountingNumber: data.accounting_number ?? '',
    });
  }

  static async updateBranch(
    id: number,
    data: Partial<CreateBranchRequest>
  ): Promise<Branch> {
    // Check if branch exists
    const existing = await BranchModel.findById(id);
    if (!existing) {
      throw new Error('Branch not found');
    }

    // Check if new routing number conflicts
    if (data.routing_number && data.routing_number !== existing.routingNumber) {
      const conflict = await BranchModel.findByRoutingNumber(data.routing_number);
      if (conflict) {
        throw new Error('Routing number already exists');
      }
    }

    const updated = await BranchModel.update(id, {
      branchName: data.branch_name,
      branchLocation: data.branch_location,
      routingNumber: data.routing_number,
      branchNumber: data.branch_number,
      accountingNumber: data.accounting_number,
    });

    if (!updated) {
      throw new Error('Failed to update branch');
    }
    return updated;
  }

  static async deleteBranch(id: number): Promise<void> {
    const success = await BranchModel.delete(id);
    if (!success) {
      throw new Error('Failed to delete branch');
    }
  }
}
