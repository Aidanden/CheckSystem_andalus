// User & Auth Types
export interface User {
  id: number;
  username: string;
  branchId?: number;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  permissions: Permission[];
}

export interface Branch {
  id: number;
  branchName: string;
  branchLocation: string;
  routingNumber: string;
  branchNumber?: string;
  accountingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: number;
  permissionName: string;
  permissionCode: string;
  description?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Account Types
export interface Account {
  id: number;
  accountNumber: string;
  accountHolderName: string;
  accountType: 1 | 2; // 1: Individual, 2: Corporate
  lastPrintedSerial: number;
  createdAt: string;
  updatedAt: string;
  branchId?: number;
  branch?: Branch;
}

// Inventory Types
export interface Inventory {
  id: number;
  stockType: 1 | 2 | 3; // 1: Individual, 2: Corporate, 3: Certified
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: number;
  stockType: 1 | 2 | 3;
  transactionType: 'ADD' | 'DEDUCT';
  quantity: number;
  serialFrom?: string;
  serialTo?: string;
  userId?: number;
  notes?: string;
  createdAt: string;
}

export interface AddInventoryRequest {
  stock_type: 1 | 2 | 3;
  quantity: number;
  serial_from?: string;
  serial_to?: string;
  notes?: string;
}

// Print Operation Types
export interface PrintOperation {
  id: number;
  accountId: number;
  userId?: number;
  branchId?: number;
  routingNumber: string;
  accountNumber: string;
  accountType: 1 | 2;
  serialFrom: number;
  serialTo: number;
  sheetsPrinted: number;
  printDate: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  notes?: string;
}

export interface PrintCheckbookRequest {
  account_number: string;
}

export interface PrintCheckbookResponse {
  success: boolean;
  message: string;
  operation?: PrintOperation;
  pdfPath?: string;
  checkbookData?: any; // Checkbook data for client-side PDF generation
}


// Statistics Types
export interface PrintStatistics {
  total_operations: string;
  total_sheets_printed: string;
  corporate_50: string;
  individual_25: string;
  employees_10: string;
  reprint_operations: string;
  reprint_sheets: string;
  first_print_date?: string;
  last_print_date?: string;
}

// Certified Check Types
export interface CertifiedPrintRecord {
  id: number;
  accountHolderName: string;
  beneficiaryName: string;
  accountNumber: string;
  amountDinars: string;
  amountDirhams: string;
  amountInWords: string;
  issueDate: string;
  checkType: string;
  checkNumber: string;
  branchId: number;
  branchName?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
}

export interface CertifiedBranch {
  id: number;
  branchName: string;
  branchLocation: string;
  routingNumber: string;
  branchNumber: string;
  accountingNumber: string;
  lastSerial: number;
}

// Create User Request
export interface CreateUserRequest {
  username: string;
  password: string;
  branch_id?: number;
  is_admin?: boolean;
  permission_ids: number[];
}

// Update User Request
export interface UpdateUserRequest {
  username?: string;
  password?: string;
  branch_id?: number;
  is_admin?: boolean;
  is_active?: boolean;
  permission_ids?: number[];
}

// Create Branch Request
export interface CreateBranchRequest {
  branch_name: string;
  branch_location: string;
  routing_number: string;
  branch_number?: string;
  accounting_number?: string;
}

// API Error Response
export interface ApiError {
  error: string;
  details?: any;
}

