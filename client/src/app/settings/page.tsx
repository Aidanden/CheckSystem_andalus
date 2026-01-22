'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings as SettingsIcon, Save, RotateCcw, Printer, RefreshCw } from 'lucide-react';
import { systemSettingsService } from '@/lib/api';
import renderCheckbookHtml from '@/lib/utils/printRenderer';

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
  branchName: { ...DEFAULT_INDIVIDUAL.branchName },
  serialNumber: { ...DEFAULT_INDIVIDUAL.serialNumber },
  accountNumber: { ...DEFAULT_INDIVIDUAL.accountNumber },
  checkSequence: { ...DEFAULT_INDIVIDUAL.checkSequence },
  accountHolderName: { ...DEFAULT_INDIVIDUAL.accountHolderName },
  micrLine: { ...DEFAULT_INDIVIDUAL.micrLine },
};

export default function SettingsPage() {
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
      setSoapApiMessage({ type: 'error', text: 'الرجاء إدخال رابط SOAP صالح.' });
      return;
    }

    setSoapApiSaving(true);
    setSoapApiMessage(null);
    try {
      const { endpoint } = await systemSettingsService.updateSoapEndpoint(value);
      setSoapApiEndpoint(endpoint);
      setSoapApiMessage({ type: 'success', text: 'تم حفظ رابط SOAP بنجاح.' });
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setSoapApiMessage({ type: 'error', text: apiError || 'فشل في حفظ رابط SOAP.' });
    } finally {
      setSoapApiSaving(false);
    }
  };

  const handleSoapIAEndpointSave = async () => {
    const value = soapIAEndpoint.trim();
    if (!value) {
      setSoapIAApiMessage({ type: 'error', text: 'الرجاء إدخال رابط SOAP IA صالح.' });
      return;
    }

    setSoapIAApiSaving(true);
    setSoapIAApiMessage(null);
    try {
      const { endpoint } = await systemSettingsService.updateSoapIAEndpoint(value);
      setSoapIAEndpoint(endpoint);
      setSoapIAApiMessage({ type: 'success', text: 'تم حفظ رابط SOAP IA بنجاح.' });
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setSoapIAApiMessage({ type: 'error', text: apiError || 'فشل في حفظ رابط SOAP IA.' });
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
      setSoapApiMessage({ type: 'error', text: 'تعذر تحميل رابط SOAP الحالي، سيتم استخدام القيمة الافتراضية.' });
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
      setSoapIAApiMessage({ type: 'error', text: 'تعذر تحميل رابط SOAP IA الحالي، سيتم استخدام القيمة الافتراضية.' });
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

      const response = await fetch(`http://localhost:5050/api/print-settings/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (activeTab === 1) {
          setIndividualSettings(data);
        } else if (activeTab === 2) {
          setCorporateSettings(data);
        } else {
          setBankStaffSettings(data);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const updatePosition = (field: keyof Omit<PrintSettings, 'id' | 'accountType' | 'checkWidth' | 'checkHeight'>, key: keyof PrintPosition, value: number | string) => {
    setCurrentSettings(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
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

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('الرجاء تسجيل الدخول');
        return;
      }

      const response = await fetch('http://localhost:5050/api/print-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentSettings),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('تم حفظ الإعدادات بنجاح!');
      } else {
        setError(data.error || 'فشل في حفظ الإعدادات');
      }
    } catch (err) {
      setError('فشل في حفظ الإعدادات');
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات للقيم الافتراضية؟')) {
      const defaults = activeTab === 1
        ? DEFAULT_INDIVIDUAL
        : activeTab === 2
          ? DEFAULT_CORPORATE
          : DEFAULT_BANK_STAFF;
      setCurrentSettings(() => defaults);
      setSuccess('تم إعادة تعيين الإعدادات');
    }
  };

  const handleTestPrint = () => {
    // للشيكات المصدقة (Tab 4)، نستخدم معاينة مختلفة
    if (activeTab === 4) {
      const testSerialNumber = '000000001';
      const testBranchName = 'فرع طرابلس';
      const testAccountingNumber = '0010010001';
      const testRoutingNumber = '11000000';

      // بناء خط MICR للشيك المصدق: C{serial}C A{routing}A {accounting}C 03
      const micrLine = `C${testSerialNumber}C A${testRoutingNumber}A ${testAccountingNumber}C 03`;

      const certifiedCheckHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>معاينة شيك مصدق</title>
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
    const testCheckData = {
      checkNumber: 1,
      serialNumber: '000000001',
      accountHolderName: 'أحمد محمد علي السيد',
      accountNumber: '001001000811217',
      accountType: activeTab === 1 ? 'فردي' : activeTab === 2 ? 'شركة' : 'موظف',
      routingNumber: '1100000001',
      branchName: 'الفرع الرئيسي',
      micrLine: `0${activeTab} 1100000001 001001000811217 000000001`,
      checkSize: {
        width: currentSettings.checkWidth,
        height: currentSettings.checkHeight,
        unit: 'mm'
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

    const checkbookData = {
      operation: {
        accountNumber: '001001000811217',
        accountHolderName: 'أحمد محمد علي السيد',
        accountType: activeTab,
        branchName: 'الفرع الرئيسي',
        routingNumber: '1100000001',
        serialFrom: 1,
        serialTo: 1,
        sheetsPrinted: 1,
        printDate: new Date().toISOString(),
      },
      checks: [testCheckData],
    };

    try {
      // استخدام renderCheckbookHtml من printRenderer
      const htmlContent = renderCheckbookHtml(checkbookData);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error('Error in test print:', err);
      setError('فشل في إنشاء معاينة الطباعة');
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
            <h1 className="text-2xl font-bold text-gray-800">إعدادات الطباعة</h1>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">رابط SOAP API</h2>
              <p className="text-sm text-gray-600">يمكنك تغيير رابط خدمة SOAP لاختبار بيئات مختلفة دون الحاجة لإعادة نشر النظام.</p>
            </div>
            {soapApiMessage && (
              <div className={`${soapApiMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border px-3 py-2 rounded`}>
                {soapApiMessage.text}
              </div>
            )}
          </div>

          <label className="block text-sm text-gray-600" htmlFor="soap-endpoint-input">
            رابط SOAP الحالي
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
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ الرابط
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
              إعادة تحميل الرابط
            </button>

            <div className="text-xs text-gray-500 flex items-center">
              {soapApiLoading ? 'جاري تحميل الرابط من الخادم...' : 'آخر قيمة محمّلة من الخادم'}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">رابط SOAP API (الأسماء)</h2>
                <p className="text-sm text-gray-600">رابط خدمة SOAP الخاصة بجلب أسماء أصحاب الحسابات (FCUBSIAService).</p>
              </div>
              {soapIAApiMessage && (
                <div className={`${soapIAApiMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border px-3 py-2 rounded`}>
                  {soapIAApiMessage.text}
                </div>
              )}
            </div>

            <label className="block text-sm text-gray-600 mt-3" htmlFor="soap-ia-endpoint-input">
              رابط SOAP IA الحالي
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
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ الرابط
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
                إعادة تحميل الرابط
              </button>

              <div className="text-xs text-gray-500 flex items-center">
                {soapIAApiLoading ? 'جاري تحميل الرابط من الخادم...' : 'آخر قيمة محمّلة من الخادم'}
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
              شيكات الأفراد (25 ورقة)
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 2
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              شيكات الشركات (50 ورقة)
            </button>
            <button
              onClick={() => setActiveTab(3)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 3
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              شيكات موظفين (10 ورقة)
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
              مواصفات الشيك
            </h2>

            {/* Check Dimensions */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">المقاسات (ملم)</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    العرض (الطول)
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
                    الارتفاع
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

            {/* Branch Name Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">اسم الفرع</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">X (من اليسار)</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.x}
                    onChange={(e) => updatePosition('branchName', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Y (من الأعلى)</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.y}
                    onChange={(e) => updatePosition('branchName', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.fontSize}
                    onChange={(e) => updatePosition('branchName', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                  <select
                    value={currentSettings.branchName.align}
                    onChange={(e) => updatePosition('branchName', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Number Position */}
            {activeTab !== 4 && currentSettings.accountNumber && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-700">رقم الحساب</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">X (من اليسار)</label>
                    <input
                      type="number"
                      value={currentSettings.accountNumber.x}
                      onChange={(e) => updatePosition('accountNumber', 'x', parseFloat(e.target.value))}
                      className="input w-full"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Y (من الأعلى)</label>
                    <input
                      type="number"
                      value={currentSettings.accountNumber.y}
                      onChange={(e) => updatePosition('accountNumber', 'y', parseFloat(e.target.value))}
                      className="input w-full"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                    <input
                      type="number"
                      value={currentSettings.accountNumber.fontSize}
                      onChange={(e) => updatePosition('accountNumber', 'fontSize', parseInt(e.target.value))}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                    <select
                      value={currentSettings.accountNumber.align}
                      onChange={(e) => updatePosition('accountNumber', 'align', e.target.value)}
                      className="input w-full"
                    >
                      <option value="left">يسار</option>
                      <option value="center">وسط</option>
                      <option value="right">يمين</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            {/* Serial Number Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">الرقم التسلسلي</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">X</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.x}
                    onChange={(e) => updatePosition('serialNumber', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Y</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.y}
                    onChange={(e) => updatePosition('serialNumber', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.fontSize}
                    onChange={(e) => updatePosition('serialNumber', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                  <select
                    value={currentSettings.serialNumber.align}
                    onChange={(e) => updatePosition('serialNumber', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Check Sequence Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">رقم التسلسل الثاني</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">X (من اليسار)</label>
                  <input
                    type="number"
                    value={currentSettings.checkSequence.x}
                    onChange={(e) => updatePosition('checkSequence', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Y (من الأعلى)</label>
                  <input
                    type="number"
                    value={currentSettings.checkSequence.y}
                    onChange={(e) => updatePosition('checkSequence', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                  <input
                    type="number"
                    value={currentSettings.checkSequence.fontSize}
                    onChange={(e) => updatePosition('checkSequence', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                  <select
                    value={currentSettings.checkSequence.align}
                    onChange={(e) => updatePosition('checkSequence', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Holder Name Position */}
            {activeTab !== 4 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-700">اسم صاحب الحساب</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">X</label>
                    <input
                      type="number"
                      value={currentSettings.accountHolderName.x}
                      onChange={(e) => updatePosition('accountHolderName', 'x', parseFloat(e.target.value))}
                      className="input w-full"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                    <input
                      type="number"
                      value={currentSettings.accountHolderName.y}
                      onChange={(e) => updatePosition('accountHolderName', 'y', parseFloat(e.target.value))}
                      className="input w-full"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                    <input
                      type="number"
                      value={currentSettings.accountHolderName.fontSize}
                      onChange={(e) => updatePosition('accountHolderName', 'fontSize', parseInt(e.target.value))}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                    <select
                      value={currentSettings.accountHolderName.align}
                      onChange={(e) => updatePosition('accountHolderName', 'align', e.target.value)}
                      className="input w-full"
                    >
                      <option value="left">يسار</option>
                      <option value="center">وسط</option>
                      <option value="right">يمين</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* MICR Line Position */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">خط MICR</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">ترتيب البيانات (من اليمين لليسار - RTL):</p>
                  <p className="font-mono text-xs">
                    [نوع الصك: 01 أفراد / 02 شركات] [رقم الحساب 15 رقم] [الرقم التوجيهي] [رقم التسلسل 9 أرقام]
                  </p>
                  <p className="mt-1 font-mono text-xs text-blue-600">
                    مثال: 01 100012345678901 1100000001 000000001
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">X</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.x}
                    onChange={(e) => updatePosition('micrLine', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Y</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.y}
                    onChange={(e) => updatePosition('micrLine', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.fontSize}
                    onChange={(e) => updatePosition('micrLine', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                  <select
                    value={currentSettings.micrLine.align}
                    onChange={(e) => updatePosition('micrLine', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
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
                  حفظ الإعدادات
                </button>

                <button
                  onClick={handleReset}
                  className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  إعادة تعيين
                </button>
              </div>

              <button
                onClick={handleTestPrint}
                className="w-full btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                تجربة الطباعة
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              معاينة الشيك
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
                الفرع الرئيسي
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
                <p>• المعاينة بمقياس 2:1 للوضوح</p>
                <p>• المقاسات الفعلية: {currentSettings.checkWidth} × {currentSettings.checkHeight} ملم</p>
                <p>• استخدم الإعدادات لضبط مواضع البيانات بدقة</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                <p className="font-medium text-green-800 mb-1">📋 تكوين خط MICR (من اليمين لليسار):</p>
                <div className="font-mono text-xs text-green-700 space-y-1">
                  <p className="text-right">• <span className="text-green-900 font-bold">01</span> (أفراد) أو <span className="text-green-900 font-bold">02</span> (شركات) - النوع (يمين)</p>
                  <p className="text-right">• <span className="text-green-900 font-bold">100012345678901</span> (15 رقم) - رقم الحساب</p>
                  <p className="text-right">• <span className="text-green-900 font-bold">1100000001</span> - الرقم التوجيهي (رقم الفرع)</p>
                  <p className="text-right">• <span className="text-green-900 font-bold">000000001</span> (9 أرقام) - التسلسل (يسار)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

