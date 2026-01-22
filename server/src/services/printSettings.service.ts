import { PrintSettingsModel } from '../models/PrintSettings.model';

export class PrintSettingsService {
  static async getSettings(accountType: number) {
    return PrintSettingsModel.getOrDefault(accountType);
  }

  static async saveSettings(data: {
    accountType: number;
    checkWidth: number;
    checkHeight: number;
    branchName: { x: number; y: number; fontSize: number; align: string };
    serialNumber: { x: number; y: number; fontSize: number; align: string };
    accountNumber: { x: number; y: number; fontSize: number; align: string };
    checkSequence: { x: number; y: number; fontSize: number; align: string };
    accountHolderName: { x: number; y: number; fontSize: number; align: string };
    micrLine: { x: number; y: number; fontSize: number; align: string };
  }) {
    const flatData = {
      accountType: data.accountType,
      checkWidth: data.checkWidth,
      checkHeight: data.checkHeight,
      branchNameX: data.branchName.x,
      branchNameY: data.branchName.y,
      branchNameFontSize: data.branchName.fontSize,
      branchNameAlign: data.branchName.align,
      serialNumberX: data.serialNumber.x,
      serialNumberY: data.serialNumber.y,
      serialNumberFontSize: data.serialNumber.fontSize,
      serialNumberAlign: data.serialNumber.align,
      accountNumberX: data.accountNumber.x,
      accountNumberY: data.accountNumber.y,
      accountNumberFontSize: data.accountNumber.fontSize,
      accountNumberAlign: data.accountNumber.align,
      checkSequenceX: data.checkSequence.x,
      checkSequenceY: data.checkSequence.y,
      checkSequenceFontSize: data.checkSequence.fontSize,
      checkSequenceAlign: data.checkSequence.align,
      accountHolderNameX: data.accountHolderName.x,
      accountHolderNameY: data.accountHolderName.y,
      accountHolderNameFontSize: data.accountHolderName.fontSize,
      accountHolderNameAlign: data.accountHolderName.align,
      micrLineX: data.micrLine.x,
      micrLineY: data.micrLine.y,
      micrLineFontSize: data.micrLine.fontSize,
      micrLineAlign: data.micrLine.align,
    };

    return PrintSettingsModel.upsert(flatData);
  }
}

