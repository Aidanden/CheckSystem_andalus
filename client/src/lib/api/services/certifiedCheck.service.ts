import { request } from '../client';

export interface CertifiedBranch {
    id: number;
    branchName: string;
    branchLocation: string;
    routingNumber: string;
    branchNumber: string;
    accountingNumber: string;
    lastSerial: number;
}

export interface CertifiedSerialRange {
    branchId: number;
    branchName: string;
    accountingNumber: string;
    routingNumber: string;
    firstSerial: number;
    lastSerial: number;
    checksCount?: number;
    numberOfBooks?: number;
    totalChecks?: number;
    checksPerBook?: number;
}

export interface CertifiedCheckLog {
    id: number;
    branchId: number;
    branchName: string;
    accountingNumber: string;
    routingNumber: string;
    firstSerial: number;
    lastSerial: number;
    totalChecks: number;
    numberOfBooks?: number;
    customStartSerial?: number;
    operationType: 'print' | 'reprint';
    printedBy: number;
    printedByName: string;
    printDate: string;
    notes?: string;
    user?: {
        id: number;
        username: string;
    };
    branch?: {
        id: number;
        branchName: string;
    };
}

export interface CertifiedPrintResult {
    success: boolean;
    log: CertifiedCheckLog;
    printData: {
        branchId: number;
        branchName: string;
        accountingNumber: string;
        routingNumber: string;
        firstSerial: number;
        lastSerial: number;
        checksCount?: number;
        numberOfBooks?: number;
        totalChecks?: number;
        checksPerBook?: number;
    };
}

export interface CertifiedStatistics {
    totalBooks: number;
    totalChecks: number;
    lastPrintDate: string | null;
    branchSerials: Array<{
        branchId: number;
        branchName: string;
        lastSerial: number;
    }>;
}

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
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    createdByName?: string;
}

export interface CertifiedSettings {
    id?: number;
    accountType: number;
    checkWidth: number;
    checkHeight: number;

    // Existing fields for book printing
    branchName?: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    serialNumber?: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    accountNumber?: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    checkSequence?: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    accountHolderName?: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    micrLine?: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };

    // New fields for individual certified check printing
    beneficiaryNameX?: number;
    beneficiaryNameY?: number;
    beneficiaryNameFontSize?: number;
    beneficiaryNameAlign?: string;

    accountNumberX?: number;
    accountNumberY?: number;
    accountNumberFontSize?: number;
    accountNumberAlign?: string;

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

    accountHolderNameX?: number;
    accountHolderNameY?: number;
    accountHolderNameFontSize?: number;
    accountHolderNameAlign?: string;
}

export const certifiedCheckService = {
    // Get branches available for certified check printing
    getBranches: async (): Promise<CertifiedBranch[]> => {
        return request<CertifiedBranch[]>({
            url: '/certified-checks/branches',
            method: 'GET',
        });
    },

    // Get next serial range for a branch
    getNextSerialRange: async (branchId: number, params?: {
        customStartSerial?: number;
        numberOfBooks?: number;
    }): Promise<CertifiedSerialRange> => {
        return request<CertifiedSerialRange>({
            url: `/certified-checks/serial/${branchId}`,
            method: 'GET',
            params,
        });
    },

    // Print a new certified check book
    printBook: async (
        branchId: number,
        notes?: string,
        customStartSerial?: number,
        numberOfBooks?: number
    ): Promise<CertifiedPrintResult> => {
        return request<CertifiedPrintResult>({
            url: '/certified-checks/print',
            method: 'POST',
            data: {
                branchId,
                notes,
                customStartSerial,
                numberOfBooks,
            },
        });
    },

    // Reprint a certified check book
    reprintBook: async (
        logId: number,
        options?: {
            firstSerial?: number;
            lastSerial?: number;
            reprintReason?: 'damaged' | 'not_printed';
        }
    ): Promise<CertifiedPrintResult> => {
        return request<CertifiedPrintResult>({
            url: `/certified-checks/reprint/${logId}`,
            method: 'POST',
            data: options || {},
        });
    },

    // Get print logs
    getLogs: async (options?: {
        skip?: number;
        take?: number;
        branchId?: number;
        userId?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<{ logs: CertifiedCheckLog[]; total: number }> => {
        return request<{ logs: CertifiedCheckLog[]; total: number }>({
            url: '/certified-checks/logs',
            method: 'GET',
            params: options,
        });
    },

    // Get statistics
    getStatistics: async (branchId?: number): Promise<CertifiedStatistics> => {
        return request<CertifiedStatistics>({
            url: '/certified-checks/statistics',
            method: 'GET',
            params: branchId ? { branchId } : undefined,
        });
    },

    // Get print settings
    getSettings: async (): Promise<CertifiedSettings> => {
        return request<CertifiedSettings>({
            url: '/certified-checks/settings',
            method: 'GET',
        });
    },

    // Update print settings
    updateSettings: async (settings: CertifiedSettings): Promise<{ success: boolean }> => {
        return request<{ success: boolean }>({
            url: '/certified-checks/settings',
            method: 'PUT',
            data: settings,
        });
    },

    // Save an individual certified check print record
    savePrintRecord: async (record: CertifiedPrintRecord): Promise<{ success: boolean; record: CertifiedPrintRecord }> => {
        return request<{ success: boolean; record: CertifiedPrintRecord }>({
            url: '/certified-checks/print-record',
            method: 'POST',
            data: record,
        });
    },

    // Update an individual certified check print record
    updatePrintRecord: async (id: number, record: CertifiedPrintRecord): Promise<{ success: boolean; record: CertifiedPrintRecord }> => {
        return request<{ success: boolean; record: CertifiedPrintRecord }>({
            url: `/certified-checks/print-record/${id}`,
            method: 'PUT',
            data: record,
        });
    },

    // Get individual certified check print records
    getPrintRecords: async (options?: {
        skip?: number;
        take?: number;
        branchId?: number;
        search?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{ records: CertifiedPrintRecord[]; total: number }> => {
        return request<{ records: CertifiedPrintRecord[]; total: number }>({
            url: '/certified-checks/print-records',
            method: 'GET',
            params: options,
        });
    },

    // Get individual certified check statistics
    getRecordStatistics: async (branchId?: number): Promise<{ totalRecords: number; lastRecordDate: string | null }> => {
        return request<{ totalRecords: number; lastRecordDate: string | null }>({
            url: '/certified-checks/record-statistics',
            method: 'GET',
            params: branchId ? { branchId } : undefined,
        });
    },
};
