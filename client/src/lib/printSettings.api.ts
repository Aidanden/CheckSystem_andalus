import axios from 'axios';

const API_URL = 'http://localhost:5050/api/print-settings';

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
  /** single = 1 check/page; sheet3 = 3 checks per sheet */
  printMode?: PrintMode;
  branchName: PrintPosition;
  serialNumber: PrintPosition;
  accountNumber: PrintPosition;
  checkSequence: PrintPosition;
  accountHolderName: PrintPosition;
  micrLine: PrintPosition;
}

class PrintSettingsAPI {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  async getSettings(accountType: 1 | 2 | 3): Promise<PrintSettings> {
    const response = await axios.get(`${API_URL}/${accountType}`, {
      headers: this.getAuthHeader(),
    });
    const data = response.data as PrintSettings;
    return {
      ...data,
      printMode: data.printMode === 'sheet3' ? 'sheet3' : 'single',
    };
  }

  async saveSettings(settings: PrintSettings): Promise<any> {
    const response = await axios.post(API_URL, settings, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }
}

export const printSettingsAPI = new PrintSettingsAPI();
