/**
 * Check Types and Interfaces
 * مواصفات وأنواع الشيكات
 */

// Check size specifications
export interface CheckSize {
  width: number;  // mm
  height: number; // mm
  unit: 'mm';
}

// MICR line components (RTL format - displayed right to left)
export interface MICRComponents {
  serialNumber: string;      // 9 digits: "000000001" (leftmost)
  routingNumber: string;     // 10 digits: "1100000001"
  accountNumber: string;     // 15 digits: "100012345678901"
  accountType: string;       // 2 digits: "01" or "02" (rightmost)
}

// Single check data
export interface CheckData {
  checkNumber: number;              // Sequential number in the book (1-25 or 1-50)
  serialNumber: string;             // Formatted serial: "000000001"
  routingNumber: string;            // Branch routing number
  accountNumber: string;            // Customer account number
  accountType: string;              // "01" for individual, "02" for corporate
  accountHolderName: string;        // Customer name
  branchName: string;               // Branch name
  checkSize: CheckSize;             // Check dimensions
  micrLine: string;                 // Complete MICR line (RTL: Type Account Routing Serial)
}

// Checkbook data (collection of checks)
export interface CheckbookData {
  operation: {
    operationId: number;
    accountNumber: string;
    accountHolderName: string;
    accountType: 1 | 2;
    branchName: string;
    routingNumber: string;
    serialFrom: number;
    serialTo: number;
    sheetsPrinted: number;
    printDate: Date;
  };
  checks: CheckData[];
}

// Print position data
export interface PrintPosition {
  element: 'branchName' | 'serialNumber' | 'accountHolderName' | 'micrLine';
  x: number;  // mm from left
  y: number;  // mm from top
  align: 'left' | 'center' | 'right';
  fontSize: number;  // pt
  fontFamily: string;
}

// Complete check layout
export interface CheckLayout {
  checkSize: CheckSize;
  positions: PrintPosition[];
}

// Check constants
export const CHECK_CONSTANTS = {
  // Sizes (mm)
  INDIVIDUAL_CHECK: {
    width: 86,
    height: 235,
  },
  CORPORATE_CHECK: {
    width: 86,
    height: 240,
  },

  // Number of checks per book
  SHEETS_PER_BOOK: {
    INDIVIDUAL: 25,
    CORPORATE: 50,
  },

  // Field lengths
  SERIAL_LENGTH: 9,
  ROUTING_LENGTH: 9,
  ACCOUNT_LENGTH: 15,
  TYPE_LENGTH: 2,

  // Account type codes
  ACCOUNT_TYPE: {
    INDIVIDUAL: '01',
    CORPORATE: '02',
  },

  // MICR font
  MICR_FONT: 'MICR E-13B',

  // Print positions (approximate, adjust as needed)
  POSITIONS: {
    BRANCH_NAME: {
      x: 43,  // center (86/2)
      y: 10,
      align: 'center' as const,
      fontSize: 14,
      fontFamily: 'Arial',
    },
    SERIAL_NUMBER: {
      x: 70,  // right side
      y: 25,
      align: 'right' as const,
      fontSize: 12,
      fontFamily: 'Arial',
    },
    ACCOUNT_HOLDER_NAME: {
      x: 5,   // left side
      y: 220, // near bottom (for 235mm check)
      align: 'left' as const,
      fontSize: 10,
      fontFamily: 'Arial',
    },
    MICR_LINE: {
      x: 5,   // left side
      y: 230, // bottom (for 235mm check)
      align: 'left' as const,
      fontSize: 12,
      fontFamily: 'MICR E-13B',
    },
  },
};

// Helper functions
export class CheckFormatter {
  /**
   * Format serial number to 9 digits with leading zeros
   */
  static formatSerialNumber(serial: number): string {
    return serial.toString().padStart(CHECK_CONSTANTS.SERIAL_LENGTH, '0');
  }

  /**
   * Format account type to 2 digits
   */
  static formatAccountType(type: 1 | 2): string {
    return type === 1
      ? CHECK_CONSTANTS.ACCOUNT_TYPE.INDIVIDUAL
      : CHECK_CONSTANTS.ACCOUNT_TYPE.CORPORATE;
  }

  /**
   * Generate complete MICR line (RTL format - starts from right)
   * Format (Right to Left): [Account Type] [Routing Number] [Account Number] [Serial Number]
   * Example: 01  1100000001  100012345678901  000000001
   */
  static generateMICRLine(
    serialNumber: number,
    routingNumber: string,
    accountNumber: string,
    accountType: 1 | 2
  ): string {
    const serial = this.formatSerialNumber(serialNumber);
    const type = this.formatAccountType(accountType);

    // MICR format: Type (01/02) → Routing → Account → Serial (right to left)
    return `${type}  ${routingNumber}  ${accountNumber}  ${serial}`;
  }

  /**
   * Get check size based on account type
   */
  static getCheckSize(accountType: 1 | 2): CheckSize {
    if (accountType === 1) {
      return {
        width: CHECK_CONSTANTS.INDIVIDUAL_CHECK.width,
        height: CHECK_CONSTANTS.INDIVIDUAL_CHECK.height,
        unit: 'mm',
      };
    } else {
      return {
        width: CHECK_CONSTANTS.CORPORATE_CHECK.width,
        height: CHECK_CONSTANTS.CORPORATE_CHECK.height,
        unit: 'mm',
      };
    }
  }

  /**
   * Get number of sheets per checkbook
   */
  static getSheetsPerBook(accountType: 1 | 2): number {
    return accountType === 1
      ? CHECK_CONSTANTS.SHEETS_PER_BOOK.INDIVIDUAL
      : CHECK_CONSTANTS.SHEETS_PER_BOOK.CORPORATE;
  }

  /**
   * Validate MICR components
   */
  static validateMICRComponents(components: MICRComponents): boolean {
    return (
      components.serialNumber.length === CHECK_CONSTANTS.SERIAL_LENGTH &&
      components.routingNumber.length === CHECK_CONSTANTS.ROUTING_LENGTH &&
      components.accountNumber.length === CHECK_CONSTANTS.ACCOUNT_LENGTH &&
      components.accountType.length === CHECK_CONSTANTS.TYPE_LENGTH &&
      (components.accountType === '01' || components.accountType === '02')
    );
  }
}



