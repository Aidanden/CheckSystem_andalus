import apiClient from '@/lib/api/client';

export type PrintMode = 'single' | 'sheet3';

export interface PrintPosition {
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}

export interface PrintSettings {
  id?: number;
  accountType: 1 | 2 | 3;
  checkWidth: number;
  checkHeight: number;
  printMode?: PrintMode;
  branchName: PrintPosition;
  serialNumber: PrintPosition;
  accountNumber: PrintPosition;
  checkSequence: PrintPosition;
  accountHolderName: PrintPosition;
  micrLine: PrintPosition;
}

class PrintSettingsAPI {
  async getSettings(accountType: 1 | 2 | 3): Promise<PrintSettings> {
    const { data } = await apiClient.get<PrintSettings>(`/print-settings/${accountType}`);
    return {
      ...data,
      printMode: data.printMode === 'sheet3' ? 'sheet3' : 'single',
    };
  }

  async saveSettings(settings: PrintSettings): Promise<any> {
    const { data } = await apiClient.post('/print-settings', settings);
    return data;
  }
}

export const printSettingsAPI = new PrintSettingsAPI();
