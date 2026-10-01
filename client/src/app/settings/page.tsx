'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings as SettingsIcon, Save, RotateCcw, Printer, RefreshCw } from 'lucide-react';
import { systemSettingsService } from '@/lib/api';
import renderCheckbookHtml from '@/lib/utils/printRenderer';
import { useTranslation } from '@/i18n/I18nProvider';

interface PrintPosition {
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}

interface PrintSettings {
  id?: number;
  accountType: 1 | 2 | 3 | 4;
  checkWidth: number;
  checkHeight: number;
  printMode: 'single' | 'sheet3';
  branchName: PrintPosition;
  serialNumber: PrintPosition;
  accountNumber: PrintPosition | null;
  checkSequence: PrintPosition;
  accountHolderName: PrintPosition;
  micrLine: PrintPosition;
}

const DEFAULT_INDIVIDUAL: PrintSettings = {
  accountType: 1,
  checkWidth: 235,
  checkHeight: 86,
  printMode: 'single',
  branchName: { x: 20, y: 10, fontSize: 14, align: 'left' },
  serialNumber: { x: 200, y: 18, fontSize: 12, align: 'right' },
  accountNumber: { x: 117.5, y: 10, fontSize: 14, align: 'center' },
  checkSequence: { x: 20, y: 18, fontSize: 12, align: 'left' },
  accountHolderName: { x: 20, y: 70, fontSize: 10, align: 'left' },
  micrLine: { x: 117.5, y: 80, fontSize: 12, align: 'center' },
};

const DEFAULT_CORPORATE: PrintSettings = {
  accountType: 2,
  checkWidth: 240,
  checkHeight: 86,
  printMode: 'single',
  branchName: { x: 20, y: 10, fontSize: 14, align: 'left' },
  serialNumber: { x: 205, y: 18, fontSize: 12, align: 'right' },
  accountNumber: { x: 120, y: 10, fontSize: 14, align: 'center' },
  checkSequence: { x: 20, y: 18, fontSize: 12, align: 'left' },
  accountHolderName: { x: 20, y: 70, fontSize: 10, align: 'left' },
  micrLine: { x: 120, y: 80, fontSize: 12, align: 'center' },
};

const DEFAULT_BANK_STAFF: PrintSettings = {
  accountType: 3,
  checkWidth: 235,
  checkHeight: 86,
  printMode: 'single',
  branchName: { ...DEFAULT_INDIVIDUAL.branchName },
  serialNumber: { ...DEFAULT_INDIVIDUAL.serialNumber },
  accountNumber: DEFAULT_INDIVIDUAL.accountNumber ? { ...DEFAULT_INDIVIDUAL.accountNumber } : null,
  checkSequence: { ...DEFAULT_INDIVIDUAL.checkSequence },
  accountHolderName: { ...DEFAULT_INDIVIDUAL.accountHolderName },
  micrLine: { ...DEFAULT_INDIVIDUAL.micrLine },
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [individualSettings, setIndividualSettings] = useState<PrintSettings>(DEFAULT_INDIVIDUAL);
  const [corporateSettings, setCorporateSettings] = useState<PrintSettings>(DEFAULT_CORPORATE);
  const [bankStaffSettings, setBankStaffSettings] = useState<PrintSettings>(DEFAULT_BANK_STAFF);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [soapApiEndpoint, setSoapApiEndpoint] = useState('');
  const [soapApiLoading, setSoapApiLoading] = useState(true);
  const [soapApiSaving, setSoapApiSaving] = useState(false);
  const [soapApiMessage, setSoapApiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [soapIAEndpoint, setSoapIAEndpoint] = useState('');
  const [soapIAApiLoading, setSoapIAApiLoading] = useState(true);
  const [soapIAApiSaving, setSoapIAApiSaving] = useState(false);
  const [soapIAApiMessage, setSoapIAApiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getCurrentSettings = () => {
    if (activeTab === 1) return individualSettings;
    if (activeTab === 2) return corporateSettings;
    return bankStaffSettings;
  };

  const handleSoapEndpointSave = async () => {
    const value = soapApiEndpoint.trim();
    if (!value) {
      setSoapApiMessage({ type: 'error', text: t('settings.enterValidSoapUrl') });
      return;
    }

    setSoapApiSaving(true);
    setSoapApiMessage(null);
    try {
      const { endpoint } = await systemSettingsService.updateSoapEndpoint(value);
      setSoapApiEndpoint(endpoint);
      setSoapApiMessage({ type: 'success', text: t('settings.soapUrlSaved') });
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setSoapApiMessage({ type: 'error', text: apiError || t('settings.failedSaveSoapUrl') });
    } finally {
      setSoapApiSaving(false);
    }
  };

  const handleSoapIAEndpointSave = async () => {
    const value = soapIAEndpoint.trim();
    if (!value) {
      setSoapIAApiMessage({ type: 'error', text: t('settings.enterValidSoapIaUrl') });
      return;
    }

    setSoapIAApiSaving(true);
    setSoapIAApiMessage(null);
    try {
      const { endpoint } = await systemSettingsService.updateSoapIAEndpoint(value);
      setSoapIAEndpoint(endpoint);
      setSoapIAApiMessage({ type: 'success', text: t('settings.soapIaUrlSaved') });
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setSoapIAApiMessage({ type: 'error', text: apiError || t('settings.failedSaveSoapIaUrl') });
    } finally {
      setSoapIAApiSaving(false);
    }
  };

  const setCurrentSettings = (updater: (prev: PrintSettings) => PrintSettings) => {
    if (activeTab === 1) {
      setIndividualSettings(updater);
    } else if (activeTab === 2) {
      setCorporateSettings(updater);
    } else {
      setBankStaffSettings(updater);
    }
  };

  const currentSettings = getCurrentSettings();

  const fetchSoapEndpoint = async () => {
    setSoapApiLoading(true);
    setSoapApiMessage(null);
    try {
      const { endpoint } = await systemSettingsService.getSoapEndpoint();
      setSoapApiEndpoint(endpoint);
    } catch (err) {
      console.error('فشل تحميل رابط SOAP:', err);
      setSoapApiMessage({ type: 'error', text: t('settings.couldNotLoadSoapUrl') });
    } finally {
      setSoapApiLoading(false);
    }
  };

  const fetchSoapIAEndpoint = async () => {
    setSoapIAApiLoading(true);
    setSoapIAApiMessage(null);
    try {
      const { endpoint } = await systemSettingsService.getSoapIAEndpoint();
      setSoapIAEndpoint(endpoint);
    } catch (err) {
      console.error('فشل تحميل رابط SOAP IA:', err);
      setSoapIAApiMessage({ type: 'error', text: t('settings.couldNotLoadSoapIaUrl') });
    } finally {
      setSoapIAApiLoading(false);
    }
  };

  useEffect(() => {
    fetchSoapEndpoint();
    fetchSoapIAEndpoint();
  }, []);

  // Load settings from backend
  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setInitialLoading(true);
      const token = localStorage.getItem('token');

      if (!token) return;

      const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
      const apiBase =
        !configured || /localhost|127\.0\.0\.1/i.test(configured) ? '/api' : configured;
      const response = await fetch(`${apiBase}/print-settings/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = {
          ...data,
          printMode: data.printMode === 'sheet3' ? 'sheet3' : 'single',
        };
        if (activeTab === 1) {
          setIndividualSettings(normalized);
        } else if (activeTab === 2) {
          setCorporateSettings(normalized);
        } else {
          setBankStaffSettings(normalized);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const updatePosition = (field: keyof Omit<PrintSettings, 'id' | 'accountType' | 'checkWidth' | 'checkHeight' | 'printMode'>, key: keyof PrintPosition, value: number | string) => {
    setCurrentSettings(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as PrintPosition),
        [key]: value
      }
    }));
  };

  const updateCheckSize = (key: 'checkWidth' | 'checkHeight', value: number) => {
    setCurrentSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updatePrintMode = (printMode: 'single' | 'sheet3') => {
    // Apply to all account-type tabs so print mode is not lost when printing another type
    setIndividualSettings((prev) => ({ ...prev, printMode }));
    setCorporateSettings((prev) => ({ ...prev, printMode }));
    setBankStaffSettings((prev) => ({ ...prev, printMode }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError(t('settings.pleaseSignIn'));
        return;
      }

      // Never call localhost from the browser in production
      const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
      const apiBase =
        !configured || /localhost|127\.0\.0\.1/i.test(configured) ? '/api' : configured;

      const payload = {
        ...currentSettings,
        printMode: currentSettings.printMode === 'sheet3' ? 'sheet3' : 'single',
        accountNumber: currentSettings.accountNumber ?? {
          x: 117.5,
          y: 10,
          fontSize: 14,
          align: 'center' as const,
        },
      };

      const response = await fetch(`${apiBase}/print-settings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.ok) {
        setSuccess(t('settings.settingsSaved'));
      } else {
        setError(data?.error || `${t('settings.failedSaveSettings')} (${response.status})`);
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(
        err?.message
          ? `${t('settings.failedSaveSettings')}: ${err.message}`
          : t('settings.failedSaveSettings')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm(t('settings.resetConfirm'))) {
      const defaults = activeTab === 1
        ? DEFAULT_INDIVIDUAL
        : activeTab === 2
          ? DEFAULT_CORPORATE
          : DEFAULT_BANK_STAFF;
      setCurrentSettings(() => defaults);
      setSuccess(t('settings.settingsReset'));
    }
  };

  const handleTestPrint = () => {
    // للشيكات المصدقة (Tab 4)، نستخدم معاينة مختلفة
    if ((activeTab as number) === 4) {
      const testSerialNumber = '000000001';
      const testBranchName = 'Tripoli Branch';
      const testAccountingNumber = '0010010001';
      const testRoutingNumber = '11000000';

      // بناء خط MICR للشيك المصدق: C{serial}C A{routing}A {accounting}C 03
      const micrLine = `C${testSerialNumber}C A${testRoutingNumber}A ${testAccountingNumber}C 03`;

      const certifiedCheckHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Certified Check Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${currentSettings.checkWidth}mm ${currentSettings.checkHeight}mm; margin: 0; }
    @page :blank { display: none; }
    @font-face { font-family: 'MICR'; src: url('/font/micrenc.ttf') format('truetype'); }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', sans-serif; }
    .check-wrapper { margin: 0; padding: 0; width: ${currentSettings.checkWidth}mm; height: ${currentSettings.checkHeight}mm; page-break-inside: avoid; overflow: hidden; display: block; }
    .check { position: relative; width: ${currentSettings.checkWidth}mm; height: ${currentSettings.checkHeight}mm; background: #fff; border: 1px dashed #ccc; }
    .branch-name { position: absolute; left: ${currentSettings.branchName.x}mm; top: ${currentSettings.branchName.y}mm; font-size: ${currentSettings.branchName.fontSize}pt; text-align: ${currentSettings.branchName.align}; font-weight: bold; }
    .serial-left { position: absolute; left: ${currentSettings.serialNumber.x}mm; top: ${currentSettings.serialNumber.y}mm; font-size: ${currentSettings.serialNumber.fontSize}pt; text-align: ${currentSettings.serialNumber.align}; font-family: 'Courier New', monospace; font-weight: bold; direction: ltr; }
    .serial-right { position: absolute; left: ${currentSettings.checkSequence.x}mm; top: ${currentSettings.checkSequence.y}mm; font-size: ${currentSettings.checkSequence.fontSize}pt; text-align: ${currentSettings.checkSequence.align}; font-family: 'Courier New', monospace; font-weight: bold; direction: ltr; }
    .micr-line { position: absolute; left: ${currentSettings.micrLine.x}mm; top: ${currentSettings.micrLine.y}mm; font-size: ${currentSettings.micrLine.fontSize}pt; text-align: ${currentSettings.micrLine.align}; font-family: 'MICR', monospace; letter-spacing: 0.15em; direction: ltr; white-space: nowrap; font-weight: bold; }
    @media screen { body { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; background: #f3f4f6; } .check-wrapper { box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; } }
  </style>
</head>
<body>
  <div class="check-wrapper">
    <section class="check">
      <div class="branch-name">${testBranchName}</div>
      <div class="serial-left">${testSerialNumber}</div>
      <div class="serial-right">${testSerialNumber}</div>
      <div class="micr-line">${micrLine}</div>
    </section>
  </div>
</body>
</html>`;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(certifiedCheckHtml);
        printWindow.document.close();
      }
      return;
    }

    // للشيكات العادية (الأفراد، الشركات، الموظفين)
    const makeTestCheck = (index: number) => {
      const serial = String(index).padStart(9, '0');
      return {
        checkNumber: index,
        serialNumber: serial,
        accountHolderName: 'Ahmed Mohamed Ali',
        accountNumber: '001001000811217',
        accountType: activeTab === 1 ? 'Individual' : activeTab === 2 ? 'Corporate' : 'Employee',
        routingNumber: '1100000001',
        branchName: 'Main Branch',
        micrLine: `0${activeTab} 1100000001 001001000811217 ${serial}`,
        checkSize: {
          width: currentSettings.checkWidth,
          height: currentSettings.checkHeight,
          unit: 'mm',
        },
        branchNameX: currentSettings.branchName.x,
        branchNameY: currentSettings.branchName.y,
        branchNameFontSize: currentSettings.branchName.fontSize,
        branchNameAlign: currentSettings.branchName.align,
        serialNumberX: currentSettings.serialNumber.x,
        serialNumberY: currentSettings.serialNumber.y,
        serialNumberFontSize: currentSettings.serialNumber.fontSize,
        serialNumberAlign: currentSettings.serialNumber.align,
        accountNumberX: currentSettings.accountNumber?.x ?? 0,
        accountNumberY: currentSettings.accountNumber?.y ?? 0,
        accountNumberFontSize: currentSettings.accountNumber?.fontSize ?? 0,
        accountNumberAlign: currentSettings.accountNumber?.align ?? 'center',
        checkSequenceX: currentSettings.checkSequence.x,
        checkSequenceY: currentSettings.checkSequence.y,
        checkSequenceFontSize: currentSettings.checkSequence.fontSize,
        checkSequenceAlign: currentSettings.checkSequence.align,
        accountHolderNameX: currentSettings.accountHolderName.x,
        accountHolderNameY: currentSettings.accountHolderName.y,
        accountHolderNameFontSize: currentSettings.accountHolderName.fontSize,
        accountHolderNameAlign: currentSettings.accountHolderName.align,
        micrLineX: currentSettings.micrLine.x,
        micrLineY: currentSettings.micrLine.y,
        micrLineFontSize: currentSettings.micrLine.fontSize,
        micrLineAlign: currentSettings.micrLine.align,
      };
    };

    const sampleCount = currentSettings.printMode === 'sheet3' ? 3 : 1;
    const testChecks = Array.from({ length: sampleCount }, (_, i) => makeTestCheck(i + 1));

    const checkbookData = {
      operation: {
        accountNumber: '001001000811217',
        accountHolderName: 'Ahmed Mohamed Ali',
        accountType: activeTab,
        branchName: 'Main Branch',
        routingNumber: '1100000001',
        serialFrom: 1,
        serialTo: sampleCount,
        sheetsPrinted: sampleCount,
        printDate: new Date().toISOString(),
      },
      checks: testChecks,
    };

    try {
      const htmlContent = renderCheckbookHtml(checkbookData, {
        printMode: currentSettings.printMode,
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError(t('settings.failedOpenPrintWindow'));
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error('Error in test print:', err);
      setError(t('settings.failedCreatePreview'));
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h1>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{t('settings.soapApiUrl')}</h2>
              <p className="text-sm text-gray-600">{t('settings.soapApiUrlDesc')}</p>
            </div>
            {soapApiMessage && (
              <div className={`${soapApiMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border px-3 py-2 rounded`}>
                {soapApiMessage.text}
              </div>
            )}
          </div>

          <label className="block text-sm text-gray-600" htmlFor="soap-endpoint-input">
            {t('settings.currentSoapUrl')}
          </label>
          <input
            id="soap-endpoint-input"
            type="text"
            className="input w-full"
            value={soapApiEndpoint}
            onChange={(e) => setSoapApiEndpoint(e.target.value)}
            disabled={soapApiLoading || soapApiSaving}
            placeholder="http://localhost:5050:8080/FCUBSAccService"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSoapEndpointSave}
              disabled={soapApiSaving || soapApiLoading}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {soapApiSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('settings.saveUrl')}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={fetchSoapEndpoint}
              disabled={soapApiLoading}
              className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={soapApiLoading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
              {t('settings.reloadUrl')}
            </button>

            <div className="text-xs text-gray-500 flex items-center">
              {soapApiLoading ? t('settings.loadingUrl') : t('settings.lastValueLoaded')}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{t('settings.soapApiUrlNames')}</h2>
                <p className="text-sm text-gray-600">{t('settings.soapApiUrlNamesDesc')}</p>
              </div>
              {soapIAApiMessage && (
                <div className={`${soapIAApiMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border px-3 py-2 rounded`}>
                  {soapIAApiMessage.text}
                </div>
              )}
            </div>

            <label className="block text-sm text-gray-600 mt-3" htmlFor="soap-ia-endpoint-input">
              {t('settings.currentSoapIaUrl')}
            </label>
            <input
              id="soap-ia-endpoint-input"
              type="text"
              className="input w-full mt-1"
              value={soapIAEndpoint}
              onChange={(e) => setSoapIAEndpoint(e.target.value)}
              disabled={soapIAApiLoading || soapIAApiSaving}
              placeholder="http://fcubsuatapp1.aiib.ly:9005/FCUBSIAService/FCUBSIAService"
            />

            <div className="flex flex-wrap gap-3 mt-3">
              <button
                type="button"
                onClick={handleSoapIAEndpointSave}
                disabled={soapIAApiSaving || soapIAApiLoading}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {soapIAApiSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('settings.saveUrl')}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={fetchSoapIAEndpoint}
                disabled={soapIAApiLoading}
                className="btn bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={soapIAApiLoading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                {t('settings.reloadUrl')}
              </button>

              <div className="text-xs text-gray-500 flex items-center">
                {soapIAApiLoading ? t('settings.loadingUrl') : t('settings.lastValueLoaded')}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab(1)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 1
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              {t('settings.tabIndividual')}
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 2
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              {t('settings.tabCorporate')}
            </button>
            <button
              onClick={() => setActiveTab(3)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 3
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              {t('settings.tabEmployee')}
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Form */}
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {t('settings.checkSpecifications')}
            </h2>

            {/* Check Dimensions */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">{t('settings.dimensionsMm')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('common.width')}
                  </label>
                  <input
                    type="number"
                    value={currentSettings.checkWidth}
                    onChange={(e) => updateCheckSize('checkWidth', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('common.height')}
                  </label>
                  <input
                    type="number"
                    value={currentSettings.checkHeight}
                    onChange={(e) => updateCheckSize('checkHeight', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Print mode: single check vs sheet of 3 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-medium text-gray-700">{t('settings.printMode')}</h3>
              <p className="text-sm text-gray-500">{t('settings.printModeHint')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentSettings.printMode === 'single'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="printMode"
                    className="mt-1"
                    checked={currentSettings.printMode === 'single'}
                    onChange={() => updatePrintMode('single')}
                  />
                  <span>
                    <span className="block font-medium text-gray-800">{t('settings.printModeSingle')}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{t('settings.printModeSingleDesc')}</span>
                  </span>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentSettings.printMode === 'sheet3'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="printMode"
                    className="mt-1"
                    checked={currentSettings.printMode === 'sheet3'}
                    onChange={() => updatePrintMode('sheet3')}
                  />
                  <span>
                    <span className="block font-medium text-gray-800">{t('settings.printModeSheet')}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{t('settings.printModeSheetDesc')}</span>
                  </span>
                </label>
              </div>
              {currentSettings.printMode === 'sheet3' && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                  {t('settings.printModeSheetPageSize', {
                    width: currentSettings.checkWidth,
                    height: currentSettings.checkHeight * 3,
                  })}
                </p>
              )}
            </div>

            {/* Branch Name Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">{t('settings.branchName')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.xFromLeft')}</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.x}
                    onChange={(e) => updatePosition('branchName', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.yFromTop')}</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.y}
                    onChange={(e) => updatePosition('branchName', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.fontSize')}</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.fontSize}
                    onChange={(e) => updatePosition('branchName', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.alignment')}</label>
                  <select
                    value={currentSettings.branchName.align}
                    onChange={(e) => updatePosition('branchName', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">{t('common.left')}</option>
                    <option value="center">{t('common.center')}</option>
                    <option value="right">{t('common.right')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Number Position */}
            {(activeTab as number) !== 4 && currentSettings.accountNumber && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-700">{t('common.accountNumber')}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('common.xFromLeft')}</label>
                    <input
                      type="number"
                      value={currentSettings.accountNumber.x}
                      onChange={(e) => updatePosition('accountNumber', 'x', parseFloat(e.target.value))}
                      className="input w-full"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('common.yFromTop')}</label>
                    <input
                      type="number"
                      value={currentSettings.accountNumber.y}
                      onChange={(e) => updatePosition('accountNumber', 'y', parseFloat(e.target.value))}
                      className="input w-full"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('common.fontSize')}</label>
                    <input
                      type="number"
                      value={currentSettings.accountNumber.fontSize}
                      onChange={(e) => updatePosition('accountNumber', 'fontSize', parseInt(e.target.value))}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('common.alignment')}</label>
                    <select
                      value={currentSettings.accountNumber.align}
                      onChange={(e) => updatePosition('accountNumber', 'align', e.target.value)}
                      className="input w-full"
                    >
                      <option value="left">{t('common.left')}</option>
                      <option value="center">{t('common.center')}</option>
                      <option value="right">{t('common.right')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            {/* Serial Number Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">{t('settings.serialNumber')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.x')}</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.x}
                    onChange={(e) => updatePosition('serialNumber', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.y')}</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.y}
                    onChange={(e) => updatePosition('serialNumber', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.fontSize')}</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.fontSize}
                    onChange={(e) => updatePosition('serialNumber', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.alignment')}</label>
                  <select
                    value={currentSettings.serialNumber.align}
                    onChange={(e) => updatePosition('serialNumber', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">{t('common.left')}</option>
                    <option value="center">{t('common.center')}</option>
                    <option value="right">{t('common.right')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Check Sequence Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">{t('settings.secondSerialNumber')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.xFromLeft')}</label>
                  <input
                    type="number"
                    value={currentSettings.checkSequence.x}
                    onChange={(e) => updatePosition('checkSequence', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.yFromTop')}</label>
                  <input
                    type="number"
                    value={currentSettings.checkSequence.y}
                    onChange={(e) => updatePosition('checkSequence', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.fontSize')}</label>
                  <input
                    type="number"
                    value={currentSettings.checkSequence.fontSize}
                    onChange={(e) => updatePosition('checkSequence', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.alignment')}</label>
                  <select
                    value={currentSettings.checkSequence.align}
                    onChange={(e) => updatePosition('checkSequence', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">{t('common.left')}</option>
                    <option value="center">{t('common.center')}</option>
                    <option value="right">{t('common.right')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Holder Name Position */}
            {(activeTab as number) !== 4 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-700">{t('settings.accountHolderName')}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('common.x')}</label>
                    <input
                      type="number"
                      value={currentSettings.accountHolderName.x}
                      onChange={(e) => updatePosition('accountHolderName', 'x', parseFloat(e.target.value))}
                      className="input w-full"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('common.y')}</label>
                    <input
                      type="number"
                      value={currentSettings.accountHolderName.y}
                      onChange={(e) => updatePosition('accountHolderName', 'y', parseFloat(e.target.value))}
                      className="input w-full"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('common.fontSize')}</label>
                    <input
                      type="number"
                      value={currentSettings.accountHolderName.fontSize}
                      onChange={(e) => updatePosition('accountHolderName', 'fontSize', parseInt(e.target.value))}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('common.alignment')}</label>
                    <select
                      value={currentSettings.accountHolderName.align}
                      onChange={(e) => updatePosition('accountHolderName', 'align', e.target.value)}
                      className="input w-full"
                    >
                      <option value="left">{t('common.left')}</option>
                      <option value="center">{t('common.center')}</option>
                      <option value="right">{t('common.right')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* MICR Line Position */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">{t('settings.micrLine')}</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">{t('settings.micrOrderTitle')}</p>
                  <p className="font-mono text-xs">
                    {t('settings.micrOrderFormat')}
                  </p>
                  <p className="mt-1 font-mono text-xs text-blue-600">
                    {t('settings.micrOrderExample')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.x')}</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.x}
                    onChange={(e) => updatePosition('micrLine', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.y')}</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.y}
                    onChange={(e) => updatePosition('micrLine', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.fontSize')}</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.fontSize}
                    onChange={(e) => updatePosition('micrLine', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('common.alignment')}</label>
                  <select
                    value={currentSettings.micrLine.align}
                    onChange={(e) => updatePosition('micrLine', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">{t('common.left')}</option>
                    <option value="center">{t('common.center')}</option>
                    <option value="right">{t('common.right')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {t('settings.saveSettings')}
                </button>

                <button
                  onClick={handleReset}
                  className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  {t('settings.resetSettings')}
                </button>
              </div>

              <button
                onClick={handleTestPrint}
                className="w-full btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                {t('settings.testPrint')}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('settings.checkPreview')}
            </h2>

            <div
              className="border-2 border-gray-300 bg-white relative overflow-hidden"
              style={{
                width: `${currentSettings.checkWidth * 2}px`,
                height: `${currentSettings.checkHeight * 2}px`,
              }}
            >
              {/* Branch Name */}
              <div
                className="absolute"
                style={{
                  left: `${currentSettings.branchName.x * 2}px`,
                  top: `${currentSettings.branchName.y * 2}px`,
                  fontSize: `${currentSettings.branchName.fontSize * 1.5}px`,
                  textAlign: currentSettings.branchName.align,
                  transform: currentSettings.branchName.align === 'center' ? 'translateX(-50%)' : 'none',
                }}
              >
                {t('settings.previewMainBranch')}
              </div>

              {/* Account Number */}
              {currentSettings.accountNumber && (
                <div
                  className="absolute"
                  style={{
                    left: `${currentSettings.accountNumber.x * 2}px`,
                    top: `${currentSettings.accountNumber.y * 2}px`,
                    fontSize: `${currentSettings.accountNumber.fontSize * 1.5}px`,
                    textAlign: currentSettings.accountNumber.align,
                    transform: currentSettings.accountNumber.align === 'center' ? 'translateX(-50%)' : 'none',
                    fontFamily: 'monospace',
                  }}
                >
                  001001000811217
                </div>
              )}

              {/* Serial Number */}
              <div
                className="absolute"
                style={{
                  left: currentSettings.serialNumber.align === 'right' ? 'auto' : `${currentSettings.serialNumber.x * 2}px`,
                  right: currentSettings.serialNumber.align === 'right' ? `${(currentSettings.checkWidth - currentSettings.serialNumber.x) * 2}px` : 'auto',
                  top: `${currentSettings.serialNumber.y * 2}px`,
                  fontSize: `${currentSettings.serialNumber.fontSize * 1.5}px`,
                  fontFamily: 'monospace',
                }}
              >
                000000001
              </div>

              {/* Check Sequence */}
              <div
                className="absolute"
                style={{
                  left: `${currentSettings.checkSequence.x * 2}px`,
                  top: `${currentSettings.checkSequence.y * 2}px`,
                  fontSize: `${currentSettings.checkSequence.fontSize * 1.5}px`,
                  fontFamily: 'monospace',
                }}
              >
                000000001
              </div>

              {/* Account Holder Name */}
              <div
                className="absolute"
                style={{
                  left: `${currentSettings.accountHolderName.x * 2}px`,
                  top: `${currentSettings.accountHolderName.y * 2}px`,
                  fontSize: `${currentSettings.accountHolderName.fontSize * 1.5}px`,
                  textAlign: currentSettings.accountHolderName.align,
                }}
              >
                أحمد محمد علي السيد
              </div>

              {/* MICR Line */}
              <div
                className="absolute"
                style={{
                  left: `${currentSettings.micrLine.x * 2}px`,
                  top: `${currentSettings.micrLine.y * 2}px`,
                  fontSize: `${currentSettings.micrLine.fontSize * 1.5}px`,
                  fontFamily: 'MICR, monospace',
                  textAlign: currentSettings.micrLine.align,
                  transform: currentSettings.micrLine.align === 'center' ? 'translateX(-50%)' : 'none',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                01 100012345678901 1100000001 000000001
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-600 space-y-1">
                <p>{t('settings.previewScale')}</p>
                <p>{t('settings.actualDimensions', {
                  width: currentSettings.checkWidth,
                  height: currentSettings.checkHeight,
                })}</p>
                <p>{t('settings.useSettingsHint')}</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                <p className="font-medium text-green-800 mb-1">{t('settings.micrConfigTitle')}</p>
                <div className="font-mono text-xs text-green-700 space-y-1">
                  <p className="text-right">{t('settings.micrConfigType', { code: '01', code2: '02' })}</p>
                  <p className="text-right">{t('settings.micrConfigAccount', { digits: '100012345678901' })}</p>
                  <p className="text-right">{t('settings.micrConfigRouting', { digits: '1100000001' })}</p>
                  <p className="text-right">{t('settings.micrConfigSerial', { digits: '000000001' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

