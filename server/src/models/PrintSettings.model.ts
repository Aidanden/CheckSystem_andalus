import prisma from '../lib/prisma';
import { PrintSettings } from '@prisma/client';
import {
  DEFAULT_BANK_STAFF_SETTINGS,
  DEFAULT_CERTIFIED_SETTINGS,
  DEFAULT_CORPORATE_SETTINGS,
  DEFAULT_INDIVIDUAL_SETTINGS,
} from '../types/printSettings.types';

function finite(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export class PrintSettingsModel {
  static async findByAccountType(accountType: number): Promise<PrintSettings | null> {
    return prisma.printSettings.findUnique({
      where: { accountType },
    });
  }

  /** Keep sheet/single mode consistent across individual, corporate, and employee. */
  static async syncPrintModeForRegularTypes(printMode: string): Promise<void> {
    const mode = printMode === 'sheet3' ? 'sheet3' : 'single';
    try {
      await prisma.printSettings.updateMany({
        where: { accountType: { in: [1, 2, 3] } },
        data: { printMode: mode },
      });
    } catch (error) {
      // Older DBs without print_mode column — ignore
      console.warn('syncPrintModeForRegularTypes skipped:', error);
    }
  }

  static async upsert(data: {
    accountType: number;
    checkWidth: number;
    checkHeight: number;
    printMode?: string;
    branchNameX: number;
    branchNameY: number;
    branchNameFontSize: number;
    branchNameAlign: string;
    serialNumberX: number;
    serialNumberY: number;
    serialNumberFontSize: number;
    serialNumberAlign: string;
    accountNumberX: number;
    accountNumberY: number;
    accountNumberFontSize: number;
    accountNumberAlign: string;
    checkSequenceX: number;
    checkSequenceY: number;
    checkSequenceFontSize: number;
    checkSequenceAlign: string;
    accountHolderNameX: number;
    accountHolderNameY: number;
    accountHolderNameFontSize: number;
    accountHolderNameAlign: string;
    micrLineX: number;
    micrLineY: number;
    micrLineFontSize: number;
    micrLineAlign: string;
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
  }): Promise<PrintSettings> {
    const printMode = data.printMode === 'sheet3' ? 'sheet3' : 'single';

    const baseUpdate = {
      checkWidth: finite(data.checkWidth, 235),
      checkHeight: finite(data.checkHeight, 86),
      branchNameX: finite(data.branchNameX, 20),
      branchNameY: finite(data.branchNameY, 10),
      branchNameFontSize: Math.round(finite(data.branchNameFontSize, 14)),
      branchNameAlign: data.branchNameAlign || 'left',
      serialNumberX: finite(data.serialNumberX, 200),
      serialNumberY: finite(data.serialNumberY, 18),
      serialNumberFontSize: Math.round(finite(data.serialNumberFontSize, 12)),
      serialNumberAlign: data.serialNumberAlign || 'right',
      accountNumberX: finite(data.accountNumberX, 117.5),
      accountNumberY: finite(data.accountNumberY, 10),
      accountNumberFontSize: Math.round(finite(data.accountNumberFontSize, 14)),
      accountNumberAlign: data.accountNumberAlign || 'center',
      checkSequenceX: finite(data.checkSequenceX, 20),
      checkSequenceY: finite(data.checkSequenceY, 18),
      checkSequenceFontSize: Math.round(finite(data.checkSequenceFontSize, 12)),
      checkSequenceAlign: data.checkSequenceAlign || 'left',
      accountHolderNameX: finite(data.accountHolderNameX, 20),
      accountHolderNameY: finite(data.accountHolderNameY, 70),
      accountHolderNameFontSize: Math.round(finite(data.accountHolderNameFontSize, 10)),
      accountHolderNameAlign: data.accountHolderNameAlign || 'left',
      micrLineX: finite(data.micrLineX, 117.5),
      micrLineY: finite(data.micrLineY, 80),
      micrLineFontSize: Math.round(finite(data.micrLineFontSize, 12)),
      micrLineAlign: data.micrLineAlign || 'center',
    };

    const createData = {
      accountType: data.accountType,
      ...baseUpdate,
      printMode,
    };

    try {
      return await prisma.printSettings.upsert({
        where: { accountType: data.accountType },
        update: { ...baseUpdate, printMode },
        create: createData,
      });
    } catch (error: any) {
      const msg = String(error?.message || error);
      // Fallback if print_mode column is missing in production DB
      if (/print_mode|printMode|Unknown argument/i.test(msg)) {
        console.warn('print_mode column missing — saving without printMode field');
        return prisma.printSettings.upsert({
          where: { accountType: data.accountType },
          update: baseUpdate,
          create: {
            accountType: data.accountType,
            ...baseUpdate,
          } as any,
        });
      }
      throw error;
    }
  }

  static async getOrDefault(accountType: number): Promise<any> {
    const settings = await this.findByAccountType(accountType);

    if (settings) {
      const isCertified = settings.accountType === 4;
      const printMode =
        (settings as any).printMode === 'sheet3' ? 'sheet3' : 'single';

      return {
        id: settings.id,
        accountType: settings.accountType,
        checkWidth: settings.checkWidth,
        checkHeight: settings.checkHeight,
        printMode,
        branchName: {
          x: settings.branchNameX,
          y: settings.branchNameY,
          fontSize: settings.branchNameFontSize,
          align: settings.branchNameAlign,
        },
        serialNumber: {
          x: settings.serialNumberX,
          y: settings.serialNumberY,
          fontSize: settings.serialNumberFontSize,
          align: settings.serialNumberAlign,
        },
        accountNumber: isCertified
          ? null
          : {
              x: settings.accountNumberX ?? 117.5,
              y: settings.accountNumberY ?? 10,
              fontSize: settings.accountNumberFontSize ?? 14,
              align: settings.accountNumberAlign ?? 'center',
            },
        checkSequence: {
          x: settings.checkSequenceX ?? 20,
          y: settings.checkSequenceY ?? 18,
          fontSize: settings.checkSequenceFontSize ?? 12,
          align: settings.checkSequenceAlign ?? 'left',
        },
        accountHolderName: {
          x: settings.accountHolderNameX,
          y: settings.accountHolderNameY,
          fontSize: settings.accountHolderNameFontSize,
          align: settings.accountHolderNameAlign,
        },
        micrLine: {
          x: settings.micrLineX,
          y: settings.micrLineY,
          fontSize: settings.micrLineFontSize,
          align: settings.micrLineAlign,
        },
        beneficiaryNameX: settings.beneficiaryNameX,
        beneficiaryNameY: settings.beneficiaryNameY,
        beneficiaryNameFontSize: settings.beneficiaryNameFontSize,
        beneficiaryNameAlign: settings.beneficiaryNameAlign,
        accountNumberX: settings.accountNumberX,
        accountNumberY: settings.accountNumberY,
        accountNumberFontSize: settings.accountNumberFontSize,
        accountNumberAlign: settings.accountNumberAlign,
        amountNumbersX: settings.amountNumbersX,
        amountNumbersY: settings.amountNumbersY,
        amountNumbersFontSize: settings.amountNumbersFontSize,
        amountNumbersAlign: settings.amountNumbersAlign,
        amountWordsX: settings.amountWordsX,
        amountWordsY: settings.amountWordsY,
        amountWordsFontSize: settings.amountWordsFontSize,
        amountWordsAlign: settings.amountWordsAlign,
        issueDateX: settings.issueDateX,
        issueDateY: settings.issueDateY,
        issueDateFontSize: settings.issueDateFontSize,
        issueDateAlign: settings.issueDateAlign,
        checkTypeX: settings.checkTypeX,
        checkTypeY: settings.checkTypeY,
        checkTypeFontSize: settings.checkTypeFontSize,
        checkTypeAlign: settings.checkTypeAlign,
        checkNumberX: settings.checkNumberX,
        checkNumberY: settings.checkNumberY,
        checkNumberFontSize: settings.checkNumberFontSize,
        checkNumberAlign: settings.checkNumberAlign,
        accountHolderNameX: settings.accountHolderNameX,
        accountHolderNameY: settings.accountHolderNameY,
        accountHolderNameFontSize: settings.accountHolderNameFontSize,
        accountHolderNameAlign: settings.accountHolderNameAlign,
      };
    }

    if (accountType === 1) return { ...DEFAULT_INDIVIDUAL_SETTINGS };
    if (accountType === 2) return { ...DEFAULT_CORPORATE_SETTINGS };
    if (accountType === 3) return { ...DEFAULT_BANK_STAFF_SETTINGS };
    if (accountType === 4) {
      const certifiedSettings = { ...DEFAULT_CERTIFIED_SETTINGS };
      (certifiedSettings as any).accountNumber = null;
      return certifiedSettings;
    }

    return { ...DEFAULT_BANK_STAFF_SETTINGS };
  }
}
