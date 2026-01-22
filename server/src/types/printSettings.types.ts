// Print Settings Types for physical check printing

export interface PrintPosition {
  x: number; // mm from left
  y: number; // mm from top
  fontSize?: number; // pt
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export interface CheckPrintSettings {
  id?: number;
  accountType: 1 | 2 | 3 | 4; // 1: Individual, 2: Corporate, 3: Bank Staff (10 checks), 4: Certified Checks

  // Check dimensions (mm)
  checkWidth: number;
  checkHeight: number;

  // Print positions for each element
  branchName: PrintPosition;
  serialNumber: PrintPosition;
  accountHolderName: PrintPosition;
  micrLine: PrintPosition;

  // New fields
  accountNumber: PrintPosition;
  checkSequence: PrintPosition;

  // Optional: Date field
  dateField?: PrintPosition;

  // Specialized fields for individual certified check printing
  beneficiaryNameX?: number;
  beneficiaryNameY?: number;
  beneficiaryNameFontSize?: number;
  beneficiaryNameAlign?: string;

  amountNumbersX?: number;
  amountNumbersY?: number;
  amountNumbersFontSize?: number;
  amountNumbersAlign?: string;

  amountWordsX?: number;
  amountWordsY?: number;
  amountWordsFontSize?: number;
  amountWordsAlign?: string;

  issueDateX?: number;
  issueDateY?: number;
  issueDateFontSize?: number;
  issueDateAlign?: string;

  checkTypeX?: number;
  checkTypeY?: number;
  checkTypeFontSize?: number;
  checkTypeAlign?: string;

  checkNumberX?: number;
  checkNumberY?: number;
  checkNumberFontSize?: number;
  checkNumberAlign?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_INDIVIDUAL_SETTINGS: Omit<CheckPrintSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  accountType: 1,
  checkWidth: 235, // mm
  checkHeight: 86, // mm

  branchName: {
    x: 20, // Moved to left
    y: 10,
    fontSize: 14,
    fontWeight: 'bold',
    align: 'left', // Changed to left
  },

  serialNumber: {
    x: 200, // right side
    y: 18,
    fontSize: 12,
    fontWeight: 'normal',
    align: 'right',
  },

  accountNumber: {
    x: 117.5, // Old branch name position (center)
    y: 10,
    fontSize: 14,
    fontWeight: 'bold',
    align: 'center',
  },

  checkSequence: {
    x: 20, // Left side
    y: 18, // Same Y as serialNumber
    fontSize: 12,
    fontWeight: 'normal',
    align: 'left',
  },

  accountHolderName: {
    x: 20, // left side
    y: 70,
    fontSize: 10,
    fontWeight: 'normal',
    align: 'left',
  },

  micrLine: {
    x: 117.5, // center
    y: 80,
    fontSize: 12,
    fontWeight: 'normal',
    align: 'center',
  },
};

export const DEFAULT_CORPORATE_SETTINGS: Omit<CheckPrintSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  accountType: 2,
  checkWidth: 240, // mm
  checkHeight: 86, // mm

  branchName: {
    x: 20, // Moved to left
    y: 10,
    fontSize: 14,
    fontWeight: 'bold',
    align: 'left',
  },

  serialNumber: {
    x: 205, // right side
    y: 18,
    fontSize: 12,
    fontWeight: 'normal',
    align: 'right',
  },

  accountNumber: {
    x: 120, // Old branch name position
    y: 10,
    fontSize: 14,
    fontWeight: 'bold',
    align: 'center',
  },

  checkSequence: {
    x: 20, // Left side
    y: 18, // Same Y as serialNumber
    fontSize: 12,
    fontWeight: 'normal',
    align: 'left',
  },

  accountHolderName: {
    x: 20, // left side
    y: 70,
    fontSize: 10,
    fontWeight: 'normal',
    align: 'left',
  },

  micrLine: {
    x: 120, // center
    y: 80,
    fontSize: 12,
    fontWeight: 'normal',
    align: 'center',
  },
};

export const DEFAULT_BANK_STAFF_SETTINGS: Omit<CheckPrintSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  accountType: 3,
  checkWidth: DEFAULT_INDIVIDUAL_SETTINGS.checkWidth,
  checkHeight: DEFAULT_INDIVIDUAL_SETTINGS.checkHeight,
  branchName: { ...DEFAULT_INDIVIDUAL_SETTINGS.branchName },
  serialNumber: { ...DEFAULT_INDIVIDUAL_SETTINGS.serialNumber },
  accountNumber: { ...DEFAULT_INDIVIDUAL_SETTINGS.accountNumber },
  checkSequence: { ...DEFAULT_INDIVIDUAL_SETTINGS.checkSequence },
  accountHolderName: { ...DEFAULT_INDIVIDUAL_SETTINGS.accountHolderName },
  micrLine: { ...DEFAULT_INDIVIDUAL_SETTINGS.micrLine },
};


export const DEFAULT_CERTIFIED_SETTINGS: Omit<CheckPrintSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  accountType: 4,
  checkWidth: 240, // mm - نفس حجم شيك الشركات
  checkHeight: 86, // mm
  branchName: {
    x: 145,
    y: 5,
    fontSize: 8,
    fontWeight: 'bold',
    align: 'center',
  },
  serialNumber: {
    x: 215, // للتاريخ
    y: 18,
    fontSize: 8,
    fontWeight: 'normal',
    align: 'right',
  },
  accountNumber: {
    x: 0, // لا يظهر
    y: 0,
    fontSize: 0,
    fontWeight: 'normal',
    align: 'center',
  },
  checkSequence: {
    x: 20,
    y: 18,
    fontSize: 8,
    fontWeight: 'normal',
    align: 'left',
  },
  accountHolderName: {
    x: -1000, // خارج الشيك - لا يظهر
    y: -1000,
    fontSize: 0,
    fontWeight: 'normal',
    align: 'left',
  },
  micrLine: {
    x: 138, // رقم الترميز
    y: 70,
    fontSize: 14,
    fontWeight: 'normal',
    align: 'center',
  },
};
