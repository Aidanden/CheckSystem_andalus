import prisma from '../lib/prisma';
import { PrintSettings } from '@prisma/client';
import {
  DEFAULT_BANK_STAFF_SETTINGS,
  DEFAULT_CERTIFIED_SETTINGS,
  DEFAULT_CORPORATE_SETTINGS,
  DEFAULT_INDIVIDUAL_SETTINGS,
} from '../types/printSettings.types';

export class PrintSettingsModel {
  static async findByAccountType(accountType: number): Promise<PrintSettings | null> {
    return prisma.printSettings.findUnique({
      where: { accountType },
    });
  }

  static async upsert(data: {
    accountType: number;
    checkWidth: number;
    checkHeight: number;
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
  }): Promise<PrintSettings> {
    return prisma.printSettings.upsert({
      where: { accountType: data.accountType },
      update: {
        checkWidth: data.checkWidth,
        checkHeight: data.checkHeight,
        branchNameX: data.branchNameX,
        branchNameY: data.branchNameY,
        branchNameFontSize: data.branchNameFontSize,
        branchNameAlign: data.branchNameAlign,
        serialNumberX: data.serialNumberX,
        serialNumberY: data.serialNumberY,
        serialNumberFontSize: data.serialNumberFontSize,
        serialNumberAlign: data.serialNumberAlign,
        accountNumberX: data.accountNumberX,
        accountNumberY: data.accountNumberY,
        accountNumberFontSize: data.accountNumberFontSize,
        accountNumberAlign: data.accountNumberAlign,
        checkSequenceX: data.checkSequenceX,
        checkSequenceY: data.checkSequenceY,
        checkSequenceFontSize: data.checkSequenceFontSize,
        checkSequenceAlign: data.checkSequenceAlign,
        accountHolderNameX: data.accountHolderNameX,
        accountHolderNameY: data.accountHolderNameY,
        accountHolderNameFontSize: data.accountHolderNameFontSize,
        accountHolderNameAlign: data.accountHolderNameAlign,
        micrLineX: data.micrLineX,
        micrLineY: data.micrLineY,
        micrLineFontSize: data.micrLineFontSize,
        micrLineAlign: data.micrLineAlign,

        // Specialized fields
        beneficiaryNameX: data.beneficiaryNameX,
        beneficiaryNameY: data.beneficiaryNameY,
        beneficiaryNameFontSize: data.beneficiaryNameFontSize,
        beneficiaryNameAlign: data.beneficiaryNameAlign,
        amountNumbersX: data.amountNumbersX,
        amountNumbersY: data.amountNumbersY,
        amountNumbersFontSize: data.amountNumbersFontSize,
        amountNumbersAlign: data.amountNumbersAlign,
        amountWordsX: data.amountWordsX,
        amountWordsY: data.amountWordsY,
        amountWordsFontSize: data.amountWordsFontSize,
        amountWordsAlign: data.amountWordsAlign,
        issueDateX: data.issueDateX,
        issueDateY: data.issueDateY,
        issueDateFontSize: data.issueDateFontSize,
        issueDateAlign: data.issueDateAlign,
        checkTypeX: data.checkTypeX,
        checkTypeY: data.checkTypeY,
        checkTypeFontSize: data.checkTypeFontSize,
        checkTypeAlign: data.checkTypeAlign,
        checkNumberX: data.checkNumberX,
        checkNumberY: data.checkNumberY,
        checkNumberFontSize: data.checkNumberFontSize,
        checkNumberAlign: data.checkNumberAlign,
      },
      create: data,
    });
  }

  static async getOrDefault(accountType: number): Promise<any> {
    const settings = await this.findByAccountType(accountType);

    if (settings) {
      // للشيكات المصدقة (accountType: 4)، لا نعرض رقم الحساب
      const isCertified = settings.accountType === 4;

      return {
        id: settings.id,
        accountType: settings.accountType,
        checkWidth: settings.checkWidth,
        checkHeight: settings.checkHeight,
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
        accountNumber: isCertified ? null : {
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

        // Specialized fields
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

    // Return defaults if not found
    if (accountType === 1) {
      return { ...DEFAULT_INDIVIDUAL_SETTINGS };
    }

    if (accountType === 2) {
      return { ...DEFAULT_CORPORATE_SETTINGS };
    }

    if (accountType === 3) {
      return { ...DEFAULT_BANK_STAFF_SETTINGS };
    }

    if (accountType === 4) {
      const certifiedSettings = { ...DEFAULT_CERTIFIED_SETTINGS };
      // للشيكات المصدقة، لا نعرض رقم الحساب
      (certifiedSettings as any).accountNumber = null;
      return certifiedSettings;
    }

    return { ...DEFAULT_BANK_STAFF_SETTINGS };
  }
}

