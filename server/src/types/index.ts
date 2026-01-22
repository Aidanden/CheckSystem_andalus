// Import Prisma types
import type { UserWithPermissions } from '../models/User.model';

// Re-export for convenience
export type { UserWithPermissions };

// Enums
export enum AccountType {
  INDIVIDUAL = 1,
  CORPORATE = 2,
  EMPLOYEE = 3,
}

export enum StockType {
  INDIVIDUAL = 1,
  CORPORATE = 2,
  CERTIFIED = 3,
}

export enum TransactionType {
  ADD = 'ADD',
  DEDUCT = 'DEDUCT',
}

export enum PrintStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PermissionCode {
  MANAGE_USERS_BRANCHES = 'MANAGE_USERS_BRANCHES',
  PRINTING = 'PRINTING',
  HANDOVER = 'HANDOVER',
  REPORTING = 'REPORTING',
  INVENTORY_MANAGEMENT = 'INVENTORY_MANAGEMENT',
  CERTIFIED_INVENTORY_MANAGEMENT = 'CERTIFIED_INVENTORY_MANAGEMENT',
}

// Interfaces
// Branch type is now from @prisma/client

// Permission type is now from @prisma/client

// User type is now from @prisma/client

// UserWithPermissions is now defined in User.model.ts with Prisma types

// Account type is now from @prisma/client

// Inventory type is now from @prisma/client

// InventoryTransaction type is now from @prisma/client

// PrintOperation type is now from @prisma/client

// API Response from Banking System
export interface BankAPIResponse {
  account_number: string;
  account_holder_name: string;
  account_type: AccountType;
}

export interface ChequeStatusInfo {
  chequeBookNumber: string;
  chequeNumber: number;
  status: string;
}

export interface CheckbookDetails {
  accountNumber: string;
  accountBranch: string;
  firstChequeNumber?: number;
  chequeLeaves?: number;
  requestStatus?: string;
  deliveryMode?: string;
  checkBookType?: string;
  languageCode?: string;
  chequeStatuses: ChequeStatusInfo[];
}

// Request/Response Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserWithPermissions;
}

export interface CreateBranchRequest {
  branch_name: string;
  branch_location: string;
  routing_number: string;
  branch_number?: string;
  accounting_number?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  branch_id?: number;
  is_admin?: boolean;
  permission_ids: number[];
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  branch_id?: number;
  is_admin?: boolean;
  is_active?: boolean;
  permission_ids?: number[];
}

export interface AddInventoryRequest {
  stock_type: StockType;
  quantity: number;
  serial_from?: string;
  serial_to?: string;
  notes?: string;
}

export interface QueryAccountRequest {
  account_number: string;
  branch_id?: number;
  branch_core_code?: string;
  source?: 'test' | 'bank';
}

export interface PrintCheckbookRequest {
  account_number: string;
  serial_from?: number; // Optional: specify custom serial range
  serial_to?: number;   // Optional: specify custom serial range
  source?: 'test' | 'bank';
  branch_id?: number;
  branch_core_code?: string;
}

export interface PrintCheckbookResponse {
  success: boolean;
  message: string;
  operation?: any; // Prisma PrintOperation type
  pdfPath?: string; // Path to generated PDF file
}

