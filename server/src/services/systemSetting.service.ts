import { SystemSettingModel } from '../models/SystemSetting.model';

const SOAP_ENDPOINT_KEY = 'soap_api_url';
const SOAP_IA_ENDPOINT_KEY = 'soap_ia_api_url';

export class SystemSettingService {
  static async getValue(key: string): Promise<string | null> {
    return SystemSettingModel.getValue(key);
  }

  static async setValue(key: string, value: string) {
    return SystemSettingModel.setValue(key, value);
  }

  static async delete(key: string): Promise<void> {
    await SystemSettingModel.deleteByKey(key);
  }

  static async getSoapEndpoint(): Promise<string> {
    const stored = await this.getValue(SOAP_ENDPOINT_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
    return process.env.BANK_API_URL || 'http://localhost:8080/FCUBSAccService';
  }

  static async updateSoapEndpoint(url: string) {
    return this.setValue(SOAP_ENDPOINT_KEY, url.trim());
  }

  static async getSoapIAEndpoint(): Promise<string> {
    const stored = await this.getValue(SOAP_IA_ENDPOINT_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
    return process.env.BANK_IA_API_URL || 'http://localhost:8080/FCUBSIAService';
  }

  static async updateSoapIAEndpoint(url: string) {
    return this.setValue(SOAP_IA_ENDPOINT_KEY, url.trim());
  }
}
