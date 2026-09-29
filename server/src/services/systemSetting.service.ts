import { SystemSettingModel } from '../models/SystemSetting.model';

const SOAP_ENDPOINT_KEY = 'soap_api_url';
const SOAP_IA_ENDPOINT_KEY = 'soap_ia_api_url';

const DEFAULT_SOAP_ACC = 'http://localhost:8080/FCUBSAccService';
const DEFAULT_SOAP_IA = 'http://localhost:8080/FCUBSIAService';

/** Known bad values from old docs / misconfiguration */
function isInvalidStoredSoapUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (/localhost:8000\/api/.test(u)) return true;
  if (/localhost:\d+:\d+/.test(u)) return true;
  if (u.endsWith('/api') && !u.includes('fcubs')) return true;
  return false;
}

function resolveSoapUrl(
  stored: string | null,
  envUrl: string | undefined,
  defaultUrl: string
): string {
  if (stored?.trim()) {
    if (isInvalidStoredSoapUrl(stored)) {
      console.warn(
        `Ignoring invalid SOAP URL in system settings (${stored.trim()}); using ${defaultUrl}`
      );
      return envUrl?.trim() || defaultUrl;
    }
    return stored.trim();
  }
  return envUrl?.trim() || defaultUrl;
}

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
    return resolveSoapUrl(stored, process.env.BANK_API_URL, DEFAULT_SOAP_ACC);
  }

  static async updateSoapEndpoint(url: string) {
    return this.setValue(SOAP_ENDPOINT_KEY, url.trim());
  }

  static async getSoapIAEndpoint(): Promise<string> {
    const stored = await this.getValue(SOAP_IA_ENDPOINT_KEY);
    return resolveSoapUrl(stored, process.env.BANK_IA_API_URL, DEFAULT_SOAP_IA);
  }

  static async updateSoapIAEndpoint(url: string) {
    return this.setValue(SOAP_IA_ENDPOINT_KEY, url.trim());
  }
}
