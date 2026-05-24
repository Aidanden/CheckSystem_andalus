'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings as SettingsIcon, Save, RotateCcw, Printer, RefreshCw, Eye } from 'lucide-react';
import { certifiedCheckService } from '@/lib/api';

interface PrintPosition {
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}

interface CertifiedPrintSettings {
  checkWidth: number;
  checkHeight: number;
  encodingNumber: PrintPosition; // رقم الترميز
  date: PrintPosition; // التاريخ
  branchName: PrintPosition; // اسم الفرع
  beneficiaryName?: PrintPosition; // اسم المستفيد (اختياري)
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  printOrientation: 'portrait' | 'landscape'; // اتجاه الطباعة
  defaultCopies: number; // عدد النسخ الافتراضي
  enablePrintPreview: boolean; // معاينة قبل الطباعة
}

const DEFAULT_SETTINGS: CertifiedPrintSettings = {
  checkWidth: 235, // نفس حجم شيك الشركات
  checkHeight: 86,
  encodingNumber: { x: 117.5, y: 75, fontSize: 12, align: 'center' },
  date: { x: 200, y: 10, fontSize: 12, align: 'right' },
  branchName: { x: 20, y: 10, fontSize: 14, align: 'left' },
  beneficiaryName: { x: 20, y: 70, fontSize: 10, align: 'left' },
  margins: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  printOrientation: 'landscape',
  defaultCopies: 1,
  enablePrintPreview: true,
};

export default function CertifiedCheckSettingsPage() {
  const [settings, setSettings] = useState<CertifiedPrintSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setInitialLoading(true);
      const data = await certifiedCheckService.getSettings();
      console.log('📥 Loaded settings from API:', data);
      
      if (data) {
        // تحويل البيانات من API إلى تنسيق Settings
        // API يرجع البيانات في تنسيق { micrLine: { x, y, ... }, branchName: { x, y, ... }, ... }
        const apiData = data as any;
        const settingsData: CertifiedPrintSettings = {
          checkWidth: apiData.checkWidth || DEFAULT_SETTINGS.checkWidth,
          checkHeight: apiData.checkHeight || DEFAULT_SETTINGS.checkHeight,
          encodingNumber: {
            x: apiData.micrLine?.x ?? apiData.micrLineX ?? DEFAULT_SETTINGS.encodingNumber.x,
            y: apiData.micrLine?.y ?? apiData.micrLineY ?? DEFAULT_SETTINGS.encodingNumber.y,
            fontSize: apiData.micrLine?.fontSize ?? apiData.micrLineFontSize ?? DEFAULT_SETTINGS.encodingNumber.fontSize,
            align: (apiData.micrLine?.align ?? apiData.micrLineAlign ?? DEFAULT_SETTINGS.encodingNumber.align) as 'left' | 'center' | 'right',
          },
          date: {
            x: apiData.serialNumber?.x ?? apiData.serialNumberX ?? DEFAULT_SETTINGS.date.x,
            y: apiData.serialNumber?.y ?? apiData.serialNumberY ?? DEFAULT_SETTINGS.date.y,
            fontSize: apiData.serialNumber?.fontSize ?? apiData.serialNumberFontSize ?? DEFAULT_SETTINGS.date.fontSize,
            align: (apiData.serialNumber?.align ?? apiData.serialNumberAlign ?? DEFAULT_SETTINGS.date.align) as 'left' | 'center' | 'right',
          },
          branchName: {
            x: apiData.branchName?.x ?? apiData.branchNameX ?? DEFAULT_SETTINGS.branchName.x,
            y: apiData.branchName?.y ?? apiData.branchNameY ?? DEFAULT_SETTINGS.branchName.y,
            fontSize: apiData.branchName?.fontSize ?? apiData.branchNameFontSize ?? DEFAULT_SETTINGS.branchName.fontSize,
            align: (apiData.branchName?.align ?? apiData.branchNameAlign ?? DEFAULT_SETTINGS.branchName.align) as 'left' | 'center' | 'right',
          },
          beneficiaryName: (() => {
            const nameX = apiData.accountHolderName?.x ?? apiData.accountHolderNameX;
            const nameY = apiData.accountHolderName?.y ?? apiData.accountHolderNameY;
            // إذا كانت القيم سالبة كبيرة (خارج الشيك)، لا نعرضها
            if (nameX !== undefined && nameX !== null && nameX < -500) {
              return undefined;
            }
            return {
              x: nameX ?? DEFAULT_SETTINGS.beneficiaryName?.x ?? 20,
              y: nameY ?? DEFAULT_SETTINGS.beneficiaryName?.y ?? 70,
              fontSize: apiData.accountHolderName?.fontSize ?? apiData.accountHolderNameFontSize ?? DEFAULT_SETTINGS.beneficiaryName?.fontSize ?? 10,
              align: (apiData.accountHolderName?.align ?? apiData.accountHolderNameAlign ?? DEFAULT_SETTINGS.beneficiaryName?.align ?? 'left') as 'left' | 'center' | 'right',
            };
          })(),
          margins: DEFAULT_SETTINGS.margins, // TODO: إضافة دعم للهوامش في API
          printOrientation: DEFAULT_SETTINGS.printOrientation,
          defaultCopies: DEFAULT_SETTINGS.defaultCopies,
          enablePrintPreview: DEFAULT_SETTINGS.enablePrintPreview,
        };
        
        console.log('✅ Converted settings:', settingsData);
        setSettings(settingsData);
      }
    } catch (err) {
      console.error('❌ Error loading settings:', err);
      setError('فشل في تحميل الإعدادات');
    } finally {
      setInitialLoading(false);
    }
  };

  const updatePosition = (field: keyof Omit<CertifiedPrintSettings, 'checkWidth' | 'checkHeight' | 'margins' | 'printOrientation' | 'defaultCopies' | 'enablePrintPreview'>, key: keyof PrintPosition, value: number | string) => {
    setSettings(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value
      }
    }));
  };

  const updateCheckSize = (key: 'checkWidth' | 'checkHeight', value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateMargins = (key: keyof CertifiedPrintSettings['margins'], value: number) => {
    setSettings(prev => ({
      ...prev,
      margins: {
        ...prev.margins,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await certifiedCheckService.updateSettings({
        accountType: 4,
        checkWidth: settings.checkWidth,
        checkHeight: settings.checkHeight,
        branchName: settings.branchName,
        serialNumber: settings.date,
        accountNumber: { x: 117.5, y: 10, fontSize: 14, align: 'center' },
        checkSequence: { x: 20, y: 18, fontSize: 12, align: 'left' },
        accountHolderName: settings.beneficiaryName || { x: 20, y: 70, fontSize: 10, align: 'left' },
        micrLine: settings.encodingNumber,
      });

      setSuccess('تم حفظ الإعدادات بنجاح!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل في حفظ الإعدادات');
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات للقيم الافتراضية؟')) {
      setSettings(DEFAULT_SETTINGS);
      setSuccess('تم إعادة تعيين الإعدادات');
    }
  };

  const handleTestPrint = () => {
    // إنشاء شيك تجريبي للطباعة
    const testCheckHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>اختبار طباعة شيك مصدق</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${settings.checkWidth}mm ${settings.checkHeight}mm;
      margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
    }

    @font-face {
      font-family: 'MICR';
      src: url('/font/micrenc.ttf') format('truetype');
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: 'Cairo', sans-serif;
    }

    .check {
      position: relative;
      width: ${settings.checkWidth}mm;
      height: ${settings.checkHeight}mm;
      background: #fff;
      border: 1px dashed #ccc;
    }

    .element {
      position: absolute;
      direction: rtl;
    }

    .encoding-number {
      font-family: 'MICR', monospace;
      letter-spacing: 0.15em;
      direction: ltr;
    }
  </style>
</head>
<body>
  <div class="check">
    <div class="element encoding-number" style="left:${settings.encodingNumber.x}mm;top:${settings.encodingNumber.y}mm;font-size:${settings.encodingNumber.fontSize}pt;text-align:${settings.encodingNumber.align};">
      C000000001C A11000000A 0010010001C 03
    </div>
    <div class="element" style="left:${settings.date.x}mm;top:${settings.date.y}mm;font-size:${settings.date.fontSize}pt;text-align:${settings.date.align};">
      ${new Date().toLocaleDateString('ar-LY')}
    </div>
    <div class="element" style="left:${settings.branchName.x}mm;top:${settings.branchName.y}mm;font-size:${settings.branchName.fontSize}pt;text-align:${settings.branchName.align};">
      فرع طرابلس
    </div>
    ${settings.beneficiaryName ? `
    <div class="element" style="left:${settings.beneficiaryName.x}mm;top:${settings.beneficiaryName.y}mm;font-size:${settings.beneficiaryName.fontSize}pt;text-align:${settings.beneficiaryName.align};">
      اسم المستفيد
    </div>
    ` : ''}
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(testCheckHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 300);
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

  const currentSettings = settings;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">إعدادات طباعة الشيكات المصدقة</h1>
              <p className="text-gray-600">تخصيص إعدادات الطباعة للشيكات المصدقة</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              إعادة تعيين
            </button>
            <button
              onClick={handleTestPrint}
              className="btn btn-outline flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              اختبار طباعة
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ الإعدادات
                </>
              )}
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
            <h2 className="text-lg font-semibold text-gray-800">إعدادات عامة</h2>

            {/* Check Size */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">حجم الشيك</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">العرض (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.checkWidth}
                    onChange={(e) => updateCheckSize('checkWidth', parseFloat(e.target.value) || 235)}
                    className="input w-full"
                    min="100"
                    max="500"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">الارتفاع (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.checkHeight}
                    onChange={(e) => updateCheckSize('checkHeight', parseFloat(e.target.value) || 86)}
                    className="input w-full"
                    min="50"
                    max="200"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Print Orientation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اتجاه الطباعة</label>
              <select
                value={currentSettings.printOrientation}
                onChange={(e) => setSettings(prev => ({ ...prev, printOrientation: e.target.value as 'portrait' | 'landscape' }))}
                className="input w-full"
              >
                <option value="landscape">عرضي</option>
                <option value="portrait">طولي</option>
              </select>
            </div>

            {/* Default Copies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عدد النسخ الافتراضي</label>
              <input
                type="number"
                value={currentSettings.defaultCopies}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultCopies: parseInt(e.target.value) || 1 }))}
                className="input w-full"
                min="1"
                max="10"
              />
            </div>

            {/* Print Preview */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="printPreview"
                checked={currentSettings.enablePrintPreview}
                onChange={(e) => setSettings(prev => ({ ...prev, enablePrintPreview: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="printPreview" className="text-sm font-medium text-gray-700">
                معاينة قبل الطباعة
              </label>
            </div>

            {/* Margins */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">هوامش الطباعة (mm)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">أعلى</label>
                  <input
                    type="number"
                    value={currentSettings.margins.top}
                    onChange={(e) => updateMargins('top', parseFloat(e.target.value) || 0)}
                    className="input w-full"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">يمين</label>
                  <input
                    type="number"
                    value={currentSettings.margins.right}
                    onChange={(e) => updateMargins('right', parseFloat(e.target.value) || 0)}
                    className="input w-full"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">أسفل</label>
                  <input
                    type="number"
                    value={currentSettings.margins.bottom}
                    onChange={(e) => updateMargins('bottom', parseFloat(e.target.value) || 0)}
                    className="input w-full"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">يسار</label>
                  <input
                    type="number"
                    value={currentSettings.margins.left}
                    onChange={(e) => updateMargins('left', parseFloat(e.target.value) || 0)}
                    className="input w-full"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Position Settings */}
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">إعدادات تموضع البيانات</h2>

            {/* Encoding Number */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-700">رقم الترميز</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من اليمين (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.encodingNumber.x}
                    onChange={(e) => updatePosition('encodingNumber', 'x', parseFloat(e.target.value) || 0)}
                    className="input w-full text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من الأعلى (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.encodingNumber.y}
                    onChange={(e) => updatePosition('encodingNumber', 'y', parseFloat(e.target.value) || 0)}
                    className="input w-full text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">حجم الخط (pt)</label>
                  <input
                    type="number"
                    value={currentSettings.encodingNumber.fontSize}
                    onChange={(e) => updatePosition('encodingNumber', 'fontSize', parseInt(e.target.value) || 12)}
                    className="input w-full text-sm"
                    min="8"
                    max="24"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">محاذاة</label>
                  <select
                    value={currentSettings.encodingNumber.align}
                    onChange={(e) => updatePosition('encodingNumber', 'align', e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-3 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-gray-700">التاريخ</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من اليمين (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.date.x}
                    onChange={(e) => updatePosition('date', 'x', parseFloat(e.target.value) || 0)}
                    className="input w-full text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من الأعلى (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.date.y}
                    onChange={(e) => updatePosition('date', 'y', parseFloat(e.target.value) || 0)}
                    className="input w-full text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">حجم الخط (pt)</label>
                  <input
                    type="number"
                    value={currentSettings.date.fontSize}
                    onChange={(e) => updatePosition('date', 'fontSize', parseInt(e.target.value) || 12)}
                    className="input w-full text-sm"
                    min="8"
                    max="24"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">محاذاة</label>
                  <select
                    value={currentSettings.date.align}
                    onChange={(e) => updatePosition('date', 'align', e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Branch Name */}
            <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-gray-700">اسم الفرع</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من اليمين (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.x}
                    onChange={(e) => updatePosition('branchName', 'x', parseFloat(e.target.value) || 0)}
                    className="input w-full text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من الأعلى (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.y}
                    onChange={(e) => updatePosition('branchName', 'y', parseFloat(e.target.value) || 0)}
                    className="input w-full text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">حجم الخط (pt)</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.fontSize}
                    onChange={(e) => updatePosition('branchName', 'fontSize', parseInt(e.target.value) || 14)}
                    className="input w-full text-sm"
                    min="8"
                    max="24"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">محاذاة</label>
                  <select
                    value={currentSettings.branchName.align}
                    onChange={(e) => updatePosition('branchName', 'align', e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Beneficiary Name */}
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg">
              <h3 className="font-medium text-gray-700">اسم المستفيد (اختياري)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من اليمين (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.beneficiaryName?.x || 20}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      beneficiaryName: {
                        ...prev.beneficiaryName!,
                        x: parseFloat(e.target.value) || 20
                      }
                    }))}
                    className="input w-full text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">من الأعلى (mm)</label>
                  <input
                    type="number"
                    value={currentSettings.beneficiaryName?.y || 70}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      beneficiaryName: {
                        ...prev.beneficiaryName!,
                        y: parseFloat(e.target.value) || 70
                      }
                    }))}
                    className="input w-full text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">حجم الخط (pt)</label>
                  <input
                    type="number"
                    value={currentSettings.beneficiaryName?.fontSize || 10}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      beneficiaryName: {
                        ...prev.beneficiaryName!,
                        fontSize: parseInt(e.target.value) || 10
                      }
                    }))}
                    className="input w-full text-sm"
                    min="8"
                    max="24"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">محاذاة</label>
                  <select
                    value={currentSettings.beneficiaryName?.align || 'left'}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      beneficiaryName: {
                        ...prev.beneficiaryName!,
                        align: e.target.value as 'left' | 'center' | 'right'
                      }
                    }))}
                    className="input w-full text-sm"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">معاينة الإعدادات</h2>
            <button
              onClick={handleTestPrint}
              className="btn btn-outline flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              معاينة الطباعة
            </button>
          </div>
          <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center">
            <div
              className="bg-white border-2 border-dashed border-gray-300 relative"
              style={{
                width: `${(currentSettings.checkWidth / 10) * 3}rem`,
                height: `${(currentSettings.checkHeight / 10) * 3}rem`,
              }}
            >
              {/* Preview elements */}
              <div
                className="absolute text-xs"
                style={{
                  left: `${(currentSettings.branchName.x / currentSettings.checkWidth) * 100}%`,
                  top: `${(currentSettings.branchName.y / currentSettings.checkHeight) * 100}%`,
                  fontSize: `${currentSettings.branchName.fontSize * 0.3}px`,
                }}
              >
                فرع طرابلس
              </div>
              <div
                className="absolute text-xs font-mono"
                style={{
                  left: `${(currentSettings.date.x / currentSettings.checkWidth) * 100}%`,
                  top: `${(currentSettings.date.y / currentSettings.checkHeight) * 100}%`,
                  fontSize: `${currentSettings.date.fontSize * 0.3}px`,
                }}
              >
                {new Date().toLocaleDateString('ar-LY')}
              </div>
              <div
                className="absolute text-xs font-mono"
                style={{
                  left: `${(currentSettings.encodingNumber.x / currentSettings.checkWidth) * 100}%`,
                  top: `${(currentSettings.encodingNumber.y / currentSettings.checkHeight) * 100}%`,
                  fontSize: `${currentSettings.encodingNumber.fontSize * 0.3}px`,
                }}
              >
                03 C0010010001C A11000000A C000000001C
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
