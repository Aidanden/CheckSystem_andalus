import { PrintSettingsModel } from '../models/PrintSettings.model';

export class PrintSettingsService {
  static async getSettings(accountType: number) {
    return PrintSettingsModel.getOrDefault(accountType);
  }

  static async saveSettings(data: {
    accountType: number;
    checkWidth: number;
    checkHeight: number;
    printMode?: string;
    branchName?: { x: number; y: number; fontSize?: number; align?: string } | null;
    serialNumber?: { x: number; y: number; fontSize?: number; align?: string } | null;
    accountNumber?: { x: number; y: number; fontSize?: number; align?: string } | null;
    checkSequence?: { x: number; y: number; fontSize?: number; align?: string } | null;
    accountHolderName?: { x: number; y: number; fontSize?: number; align?: string } | null;
    micrLine?: { x: number; y: number; fontSize?: number; align?: string } | null;
  }) {
    const pos = (
      value: { x: number; y: number; fontSize?: number; align?: string } | null | undefined,
      fallback: { x: number; y: number; fontSize: number; align: string }
    ) => ({
      x: Number(value?.x ?? fallback.x),
      y: Number(value?.y ?? fallback.y),
      fontSize: Number(value?.fontSize ?? fallback.fontSize),
      align: String(value?.align ?? fallback.align),
    });

    const branchName = pos(data.branchName, { x: 20, y: 10, fontSize: 14, align: 'left' });
    const serialNumber = pos(data.serialNumber, { x: 200, y: 18, fontSize: 12, align: 'right' });
    const accountNumber = pos(data.accountNumber, { x: 117.5, y: 10, fontSize: 14, align: 'center' });
    const checkSequence = pos(data.checkSequence, { x: 20, y: 18, fontSize: 12, align: 'left' });
    const accountHolderName = pos(data.accountHolderName, { x: 20, y: 70, fontSize: 10, align: 'left' });
    const micrLine = pos(data.micrLine, { x: 117.5, y: 80, fontSize: 12, align: 'center' });

    const printMode = data.printMode === 'sheet3' ? 'sheet3' : 'single';
    const flatData = {
      accountType: Number(data.accountType),
      checkWidth: Number(data.checkWidth),
      checkHeight: Number(data.checkHeight),
      printMode,
      branchNameX: branchName.x,
      branchNameY: branchName.y,
      branchNameFontSize: branchName.fontSize,
      branchNameAlign: branchName.align,
      serialNumberX: serialNumber.x,
      serialNumberY: serialNumber.y,
      serialNumberFontSize: serialNumber.fontSize,
      serialNumberAlign: serialNumber.align,
      accountNumberX: accountNumber.x,
      accountNumberY: accountNumber.y,
      accountNumberFontSize: accountNumber.fontSize,
      accountNumberAlign: accountNumber.align,
      checkSequenceX: checkSequence.x,
      checkSequenceY: checkSequence.y,
      checkSequenceFontSize: checkSequence.fontSize,
      checkSequenceAlign: checkSequence.align,
      accountHolderNameX: accountHolderName.x,
      accountHolderNameY: accountHolderName.y,
      accountHolderNameFontSize: accountHolderName.fontSize,
      accountHolderNameAlign: accountHolderName.align,
      micrLineX: micrLine.x,
      micrLineY: micrLine.y,
      micrLineFontSize: micrLine.fontSize,
      micrLineAlign: micrLine.align,
    };

    if (!Number.isFinite(flatData.checkWidth) || !Number.isFinite(flatData.checkHeight)) {
      throw new Error('Invalid check dimensions');
    }

    const saved = await PrintSettingsModel.upsert(flatData);

    try {
      await PrintSettingsModel.syncPrintModeForRegularTypes(printMode);
    } catch (syncError) {
      console.warn('Failed to sync printMode across account types:', syncError);
    }

    return saved;
  }
}

