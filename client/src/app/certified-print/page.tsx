'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Stamp, Printer, Eye, Save, AlertCircle, CheckCircle, Calculator, PlusCircle } from 'lucide-react';
import { certifiedCheckService } from '@/lib/api';

interface CertifiedCheckData {
    id?: number;
    accountHolderName: string;
    beneficiaryName: string;
    accountNumber: string;
    amountDinars: string;
    amountDirhams: string;
    amountInWords: string;
    issueDate: string;
    checkType: string;
    checkNumber: string;
    branchId: number | null;
}

interface PrintSettings {
    checkWidth: number;
    checkHeight: number;
    beneficiaryName: { x: number; y: number; fontSize: number; align: string };
    accountHolderName: { x: number; y: number; fontSize: number; align: string };
    accountNumber: { x: number; y: number; fontSize: number; align: string };
    amountNumbers: { x: number; y: number; fontSize: number; align: string };
    amountWords: { x: number; y: number; fontSize: number; align: string };
    issueDate: { x: number; y: number; fontSize: number; align: string };
    checkType: { x: number; y: number; fontSize: number; align: string };
    checkNumber: { x: number; y: number; fontSize: number; align: string };
}

const DEFAULT_SETTINGS: PrintSettings = {
    checkWidth: 235,
    checkHeight: 86,
    beneficiaryName: { x: 30, y: 30, fontSize: 12, align: 'right' },
    accountHolderName: { x: 30, y: 25, fontSize: 11, align: 'right' },
    accountNumber: { x: 30, y: 40, fontSize: 11, align: 'right' },
    amountNumbers: { x: 180, y: 50, fontSize: 14, align: 'left' },
    amountWords: { x: 30, y: 55, fontSize: 11, align: 'right' },
    issueDate: { x: 30, y: 20, fontSize: 10, align: 'right' },
    checkType: { x: 120, y: 10, fontSize: 12, align: 'center' },
    checkNumber: { x: 200, y: 20, fontSize: 11, align: 'left' },
};

// دالة تحويل الأرقام إلى كلمات بالعربية
const numberToArabicWords = (num: number): string => {
    if (num === 0) return 'صفر';

    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

    const convertGroup = (n: number): string => {
        if (n === 0) return '';

        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const o = n % 10;

        let result = '';

        if (h > 0) result += hundreds[h];

        if (t === 1) {
            if (result) result += ' و';
            result += teens[o];
        } else {
            if (t > 0) {
                if (result) result += ' و';
                result += tens[t];
            }
            if (o > 0) {
                if (result) result += ' و';
                result += ones[o];
            }
        }

        return result;
    };

    if (num < 1000) {
        return convertGroup(num);
    } else if (num < 1000000) {
        const thousands = Math.floor(num / 1000);
        const remainder = num % 1000;

        let result = '';
        if (thousands === 1) {
            result = 'ألف';
        } else if (thousands === 2) {
            result = 'ألفان';
        } else if (thousands <= 10) {
            result = convertGroup(thousands) + ' آلاف';
        } else {
            result = convertGroup(thousands) + ' ألفاً';
        }

        if (remainder > 0) {
            result += ' و' + convertGroup(remainder);
        }

        return result;
    } else {
        const millions = Math.floor(num / 1000000);
        const remainder = num % 1000000;

        let result = '';
        if (millions === 1) {
            result = 'مليون';
        } else if (millions === 2) {
            result = 'مليونان';
        } else if (millions <= 10) {
            result = convertGroup(millions) + ' ملايين';
        } else {
            result = convertGroup(millions) + ' مليوناً';
        }

        if (remainder > 0) {
            const thousands = Math.floor(remainder / 1000);
            const ones = remainder % 1000;

            if (thousands > 0) {
                result += ' و';
                if (thousands === 1) {
                    result += 'ألف';
                } else if (thousands === 2) {
                    result += 'ألفان';
                } else {
                    result += convertGroup(thousands) + ' ألفاً';
                }
            }

            if (ones > 0) {
                result += ' و' + convertGroup(ones);
            }
        }

        return result;
    }
};

export default function CertifiedPrintPage() {
    const [formData, setFormData] = useState<CertifiedCheckData>({
        accountHolderName: '',
        beneficiaryName: '',
        accountNumber: '',
        amountDinars: '',
        amountDirhams: '',
        amountInWords: '',
        issueDate: new Date().toISOString().split('T')[0],
        checkType: 'شيك مصدق',
        checkNumber: '',
        branchId: null,
    });

    const [branches, setBranches] = useState<any[]>([]);
    const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(false);

    const [lastAutoAmountWords, setLastAutoAmountWords] = useState('');

    useEffect(() => {
        loadBranches();
        loadSettings();
        loadRecords();
    }, []);

    // تحديث المبلغ بالحروف تلقائياً
    useEffect(() => {
        if (formData.amountDinars) {
            const dinars = parseInt(formData.amountDinars) || 0;
            const dirhams = parseInt(formData.amountDirhams) || 0;

            let words = '';
            if (dinars > 0) {
                words = numberToArabicWords(dinars) + ' دينار ليبي';
            }

            if (dirhams > 0) {
                if (words) words += ' و';
                words += numberToArabicWords(dirhams) + ' درهم';
            }

            if (words) {
                words += ' لا غير';
            }

            setFormData(prev => ({ ...prev, amountInWords: words }));
        }
    }, [formData.amountDinars, formData.amountDirhams]);



    const loadBranches = async () => {
        try {
            const data = await certifiedCheckService.getBranches();
            setBranches(data);
        } catch (err: any) {
            console.error('Error loading branches:', err);
            setError(err.response?.data?.error || 'فشل في تحميل قائمة الفروع');
        }
    };

    const loadRecords = async () => {
        try {
            setRecordsLoading(true);
            const data = await certifiedCheckService.getPrintRecords({ take: 10 });
            setRecords(data.records);
        } catch (err: any) {
            console.error('Error loading records:', err);
            setError(err.response?.data?.error || 'فشل في تحميل سجل العمليات');
        } finally {
            setRecordsLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await certifiedCheckService.getSettings();
            if (data) {
                setSettings({
                    checkWidth: data.checkWidth ?? DEFAULT_SETTINGS.checkWidth,
                    checkHeight: data.checkHeight ?? DEFAULT_SETTINGS.checkHeight,
                    beneficiaryName: {
                        x: data.beneficiaryNameX ?? DEFAULT_SETTINGS.beneficiaryName.x,
                        y: data.beneficiaryNameY ?? DEFAULT_SETTINGS.beneficiaryName.y,
                        fontSize: data.beneficiaryNameFontSize ?? DEFAULT_SETTINGS.beneficiaryName.fontSize,
                        align: data.beneficiaryNameAlign ?? DEFAULT_SETTINGS.beneficiaryName.align,
                    },
                    accountHolderName: {
                        x: data.accountHolderNameX ?? DEFAULT_SETTINGS.accountHolderName.x,
                        y: data.accountHolderNameY ?? DEFAULT_SETTINGS.accountHolderName.y,
                        fontSize: data.accountHolderNameFontSize ?? DEFAULT_SETTINGS.accountHolderName.fontSize,
                        align: data.accountHolderNameAlign ?? DEFAULT_SETTINGS.accountHolderName.align,
                    },
                    accountNumber: {
                        x: data.accountNumberX ?? DEFAULT_SETTINGS.accountNumber.x,
                        y: data.accountNumberY ?? DEFAULT_SETTINGS.accountNumber.y,
                        fontSize: data.accountNumberFontSize ?? DEFAULT_SETTINGS.accountNumber.fontSize,
                        align: data.accountNumberAlign ?? DEFAULT_SETTINGS.accountNumber.align,
                    },
                    amountNumbers: {
                        x: data.amountNumbersX ?? DEFAULT_SETTINGS.amountNumbers.x,
                        y: data.amountNumbersY ?? DEFAULT_SETTINGS.amountNumbers.y,
                        fontSize: data.amountNumbersFontSize ?? DEFAULT_SETTINGS.amountNumbers.fontSize,
                        align: data.amountNumbersAlign ?? DEFAULT_SETTINGS.amountNumbers.align,
                    },
                    amountWords: {
                        x: data.amountWordsX ?? DEFAULT_SETTINGS.amountWords.x,
                        y: data.amountWordsY ?? DEFAULT_SETTINGS.amountWords.y,
                        fontSize: data.amountWordsFontSize ?? DEFAULT_SETTINGS.amountWords.fontSize,
                        align: data.amountWordsAlign ?? DEFAULT_SETTINGS.amountWords.align,
                    },
                    issueDate: {
                        x: data.issueDateX ?? DEFAULT_SETTINGS.issueDate.x,
                        y: data.issueDateY ?? DEFAULT_SETTINGS.issueDate.y,
                        fontSize: data.issueDateFontSize ?? DEFAULT_SETTINGS.issueDate.fontSize,
                        align: data.issueDateAlign ?? DEFAULT_SETTINGS.issueDate.align,
                    },
                    checkType: {
                        x: data.checkTypeX ?? DEFAULT_SETTINGS.checkType.x,
                        y: data.checkTypeY ?? DEFAULT_SETTINGS.checkType.y,
                        fontSize: data.checkTypeFontSize ?? DEFAULT_SETTINGS.checkType.fontSize,
                        align: data.checkTypeAlign ?? DEFAULT_SETTINGS.checkType.align,
                    },
                    checkNumber: {
                        x: data.checkNumberX ?? DEFAULT_SETTINGS.checkNumber.x,
                        y: data.checkNumberY ?? DEFAULT_SETTINGS.checkNumber.y,
                        fontSize: data.checkNumberFontSize ?? DEFAULT_SETTINGS.checkNumber.fontSize,
                        align: data.checkNumberAlign ?? DEFAULT_SETTINGS.checkNumber.align,
                    },
                });
            }
        } catch (err: any) {
            console.error('Error loading settings:', err);
            setError(err.response?.data?.error || 'فشل في تحميل إعدادات الطباعة');
        }
    };

    const handleInputChange = (field: keyof CertifiedCheckData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.checkNumber.trim()) {
            setError('يرجى إدخال رقم الشيك المرمز');
            return false;
        }
        if (!formData.accountHolderName.trim()) {
            setError('يرجى إدخال اسم صاحب الحساب');
            return false;
        }
        if (!formData.beneficiaryName.trim()) {
            setError('يرجى إدخال اسم المستفيد');
            return false;
        }
        if (!formData.accountNumber.trim()) {
            setError('يرجى إدخال رقم الحساب');
            return false;
        }
        if (!formData.amountDinars || parseInt(formData.amountDinars) <= 0) {
            setError('يرجى إدخال مبلغ صحيح');
            return false;
        }
        if (!formData.branchId) {
            setError('يرجى اختيار الفرع');
            return false;
        }
        return true;
    };

    const resetForm = () => {
        setFormData({
            accountHolderName: '',
            beneficiaryName: '',
            accountNumber: '',
            amountDinars: '',
            amountDirhams: '',
            amountInWords: '',
            issueDate: new Date().toISOString().split('T')[0],
            checkType: 'شيك مصدق',
            checkNumber: '',
            branchId: formData.branchId, // Keep current branch for convenience
        });
        setShowPreview(false);
        setError(null);
        setSuccess(null);
    };

    const handleSave = async () => {
        setError(null);
        setSuccess(null);

        if (!validateForm()) return;

        try {
            setLoading(true);
            const dataToSave = {
                ...formData,
                amountDirhams: formData.amountDirhams.padStart(3, '0'),
                branchId: formData.branchId!
            };

            if (formData.id) {
                // تعديل عملية سابقة
                await certifiedCheckService.updatePrintRecord(formData.id, dataToSave as any);
                setSuccess('تم تحديث بيانات الشيك بنجاح');
            } else {
                // حفظ عملية جديدة
                await certifiedCheckService.savePrintRecord(dataToSave as any);
                setSuccess('تم حفظ بيانات الشيك بنجاح');
            }

            loadRecords(); // تحديث السجل في الشاشة
            setShowPreview(true); // معاينة تلقائية بعد الحفظ
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'فشل في حفظ البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        setError(null);
        if (!validateForm()) return;
        setShowPreview(true);
    };

    const handlePrint = async () => {
        if (!validateForm()) return;

        // فتح نافذة جديدة فوراً للحفاظ على "إجراء المستخدم" (User Gesture) لتجنب حظر النوافذ المنبثقة
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            setError('فشل في فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
            return;
        }

        // عرض رسالة انتظار مؤقتة في النافذة الجديدة
        printWindow.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;direction:rtl;"><p>جاري تجهيز الطباعة... يرجى الانتظار</p></body></html>');

        try {
            setLoading(true);
            // محاولة حفظ العملية في السجل، مع تجاهل أخطاء التكرار للسماح بإعادة الطباعة
            if (!formData.id) {
                try {
                    await certifiedCheckService.savePrintRecord({
                        ...formData,
                        amountDirhams: formData.amountDirhams.padStart(3, '0'),
                        branchId: formData.branchId!
                    } as any);
                    loadRecords(); // تحديث السجل
                } catch (saveErr) {
                    console.log('Skipping save (possibly duplicate):', saveErr);
                }
            }

            const selectedBranch = branches.find(b => b.id === formData.branchId);
            const dirhamsFormatted = formData.amountDirhams.padStart(3, '0');
            const amountFormatted = `${formData.amountDinars}.${dirhamsFormatted}`;

            const printHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>طباعة شيك مصدق - ${formData.checkNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${settings.checkWidth}mm ${settings.checkHeight}mm; margin: 0; }
    @font-face { font-family: 'MICR'; src: url('/font/micrenc.ttf') format('truetype'); }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', sans-serif; }
    .check-wrapper { margin: 0; padding: 0; width: ${settings.checkWidth}mm; height: ${settings.checkHeight}mm; page-break-inside: avoid; overflow: hidden; }
    .check { position: relative; width: ${settings.checkWidth}mm; height: ${settings.checkHeight}mm; background: #fff; border: 1px dashed #ccc; }
    .field { position: absolute; }
    .account-holder-name { left: ${settings.accountHolderName.x}mm; top: ${settings.accountHolderName.y}mm; font-size: ${settings.accountHolderName.fontSize}pt; text-align: ${settings.accountHolderName.align}; }
    .beneficiary-name { left: ${settings.beneficiaryName.x}mm; top: ${settings.beneficiaryName.y}mm; font-size: ${settings.beneficiaryName.fontSize}pt; text-align: ${settings.beneficiaryName.align}; font-weight: 600; }
    .account-number { left: ${settings.accountNumber.x}mm; top: ${settings.accountNumber.y}mm; font-size: ${settings.accountNumber.fontSize}pt; text-align: ${settings.accountNumber.align}; font-family: 'Courier New', monospace; }
    .amount-numbers { left: ${settings.amountNumbers.x}mm; top: ${settings.amountNumbers.y}mm; font-size: ${settings.amountNumbers.fontSize}pt; text-align: ${settings.amountNumbers.align}; font-weight: bold; font-family: 'Courier New', monospace; direction: ltr; }
    .amount-words { left: ${settings.amountWords.x}mm; top: ${settings.amountWords.y}mm; font-size: ${settings.amountWords.fontSize}pt; text-align: ${settings.amountWords.align}; max-width: 180mm; }
    .issue-date { left: ${settings.issueDate.x}mm; top: ${settings.issueDate.y}mm; font-size: ${settings.issueDate.fontSize}pt; text-align: ${settings.issueDate.align}; }
    .check-type { left: ${settings.checkType.x}mm; top: ${settings.checkType.y}mm; font-size: ${settings.checkType.fontSize}pt; text-align: ${settings.checkType.align}; font-weight: bold; color: #000; }
    .check-number { left: ${settings.checkNumber.x}mm; top: ${settings.checkNumber.y}mm; font-size: ${settings.checkNumber.fontSize}pt; text-align: ${settings.checkNumber.align}; font-family: 'Courier New', monospace; font-weight: bold; direction: ltr; }
    @media print { .check { border: none; } }
    @media screen { body { display: flex; align-items: center; justify-content: center; padding: 20px; background: #f3f4f6; } .check-wrapper { box-shadow: 0 4px 6px rgba(0,0,0,0.1); } }
  </style>
</head>
<body>
  <div class="check-wrapper">
    <section class="check">
      <div class="field issue-date">${new Date(formData.issueDate).toLocaleDateString('ar-LY')}</div>
      <div class="field account-holder-name">${formData.accountHolderName}</div>
      <div class="field beneficiary-name">${formData.beneficiaryName}</div>
      <div class="field account-number">${formData.accountNumber}</div>
      <div class="field amount-numbers">${amountFormatted}</div>
      <div class="field amount-words">${formData.amountInWords}</div>
    </section>
  </div>
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

            printWindow.document.open();
            printWindow.document.write(printHtml);
            printWindow.document.close();

        } catch (err: any) {
            if (printWindow) printWindow.close();
            setError(err.response?.data?.error || err.message || 'فشل في عملية الطباعة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                            <Stamp className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {formData.id ? 'تعديل بيانات شيك مصدق' : 'طباعة شيك مصدق'}
                            </h1>
                            <p className="text-gray-600">إدخال بيانات ومعاينة وطباعة الشيكات المصدقة</p>
                        </div>
                    </div>
                    {formData.id && (
                        <button
                            onClick={resetForm}
                            className="btn bg-gray-50 text-gray-700 border border-gray-200 hover:bg-white flex items-center gap-2"
                        >
                            <PlusCircle className="w-5 h-5 text-green-600" />
                            شيك جديد
                        </button>
                    )}
                </div>

                {/* Messages */}
                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        {success}
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form Section */}
                    <div className="card space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-3">بيانات الشيك المصدق</h2>

                        {/* Branch Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                الفرع <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.branchId || ''}
                                onChange={(e) => handleInputChange('branchId', e.target.value ? Number(e.target.value) : null)}
                                className="input"
                            >
                                <option value="">-- اختر الفرع --</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branchName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Check Number (Pre-printed) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم الشيك المرمز (المطبوع مسبقاً) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.checkNumber}
                                onChange={(e) => handleInputChange('checkNumber', e.target.value)}
                                className="input font-mono"
                                placeholder="أدخل رقم الشيك المطبوع على الورقة"
                                dir="ltr"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                ⚠️ هذا الرقم مطبوع مسبقاً على الشيك ولا يمكن تكراره
                            </p>
                        </div>

                        {/* Account Holder Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                اسم صاحب الحساب <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.accountHolderName}
                                onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                                className="input"
                                placeholder="أدخل اسم صاحب الحساب الكامل"
                            />
                        </div>

                        {/* Beneficiary Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                اسم المستفيد / حامل الشيك <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.beneficiaryName}
                                onChange={(e) => handleInputChange('beneficiaryName', e.target.value)}
                                className="input"
                                placeholder="أدخل اسم المستفيد الكامل"
                            />
                        </div>

                        {/* Account Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم حساب صاحب الحساب <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                className="input font-mono"
                                placeholder="001001000811217"
                                dir="ltr"
                            />
                        </div>

                        {/* Amount */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    المبلغ (دينار) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.amountDinars}
                                    onChange={(e) => handleInputChange('amountDinars', e.target.value)}
                                    className="input font-mono text-lg"
                                    placeholder="37500"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    درهم
                                </label>
                                <input
                                    type="number"
                                    value={formData.amountDirhams}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 999)) {
                                            handleInputChange('amountDirhams', value);
                                        }
                                    }}
                                    className="input font-mono text-lg"
                                    placeholder="000"
                                    min="0"
                                    max="999"
                                />
                            </div>
                        </div>

                        {/* Amount Preview */}
                        {formData.amountDinars && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-600 font-semibold mb-1">المبلغ بالأرقام:</p>
                                        <p className="text-lg font-bold font-mono text-blue-800 direction-ltr text-left">
                                            {formData.amountDinars}.{formData.amountDirhams.padStart(3, '0')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Amount in Words */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                المبلغ بالحروف
                            </label>
                            <textarea
                                value={formData.amountInWords}
                                className="input min-h-[80px] bg-gray-50 cursor-not-allowed"
                                placeholder="المبلغ بالحروف"
                                rows={3}
                                readOnly
                            />
                        </div>

                        {/* Issue Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                تاريخ الإصدار <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                                className="input"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className={`btn ${formData.id ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'btn-secondary'} flex items-center gap-2 flex-1`}
                            >
                                <Save className="w-5 h-5" />
                                {formData.id ? 'حفظ التعديلات' : 'حفظ'}
                            </button>
                            <button
                                onClick={handlePreview}
                                className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 flex-1"
                            >
                                <Eye className="w-5 h-5" />
                                معاينة
                            </button>
                            <button
                                onClick={handlePrint}
                                className="btn btn-primary flex items-center gap-2 flex-1"
                            >
                                <Printer className="w-5 h-5" />
                                طباعة
                            </button>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="card">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-3 mb-6">معاينة الشيك</h2>

                        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                            {showPreview && formData.beneficiaryName && formData.amountDinars ? (
                                <div
                                    className="bg-white shadow-lg mx-auto relative border border-gray-200"
                                    style={{
                                        width: `${settings.checkWidth * 2}px`,
                                        height: `${settings.checkHeight * 2}px`,
                                        transform: 'scale(0.8)',
                                        transformOrigin: 'top center',
                                    }}
                                >


                                    {/* Issue Date */}
                                    <div
                                        className="absolute"
                                        style={{
                                            left: `${settings.issueDate.x * 2}px`,
                                            top: `${settings.issueDate.y * 2}px`,
                                            fontSize: `${settings.issueDate.fontSize * 1.5}px`,
                                            textAlign: settings.issueDate.align as any,
                                        }}
                                    >
                                        {new Date(formData.issueDate).toLocaleDateString('ar-LY')}
                                    </div>

                                    {/* Account Holder Name */}
                                    <div
                                        className="absolute"
                                        style={{
                                            left: `${settings.accountHolderName.x * 2}px`,
                                            top: `${settings.accountHolderName.y * 2}px`,
                                            fontSize: `${settings.accountHolderName.fontSize * 1.5}px`,
                                            textAlign: settings.accountHolderName.align as any,
                                        }}
                                    >
                                        {formData.accountHolderName}
                                    </div>

                                    {/* Beneficiary Name */}
                                    <div
                                        className="absolute font-semibold"
                                        style={{
                                            left: `${settings.beneficiaryName.x * 2}px`,
                                            top: `${settings.beneficiaryName.y * 2}px`,
                                            fontSize: `${settings.beneficiaryName.fontSize * 1.5}px`,
                                            textAlign: settings.beneficiaryName.align as any,
                                        }}
                                    >
                                        {formData.beneficiaryName}
                                    </div>

                                    {/* Account Number */}
                                    <div
                                        className="absolute font-mono"
                                        style={{
                                            left: `${settings.accountNumber.x * 2}px`,
                                            top: `${settings.accountNumber.y * 2}px`,
                                            fontSize: `${settings.accountNumber.fontSize * 1.5}px`,
                                            textAlign: settings.accountNumber.align as any,
                                        }}
                                    >
                                        {formData.accountNumber}
                                    </div>

                                    {/* Amount Numbers */}
                                    <div
                                        className="absolute font-mono font-bold"
                                        style={{
                                            left: `${settings.amountNumbers.x * 2}px`,
                                            top: `${settings.amountNumbers.y * 2}px`,
                                            fontSize: `${settings.amountNumbers.fontSize * 1.5}px`,
                                            textAlign: settings.amountNumbers.align as any,
                                            direction: 'ltr',
                                        }}
                                    >
                                        {formData.amountDinars}.{formData.amountDirhams.padStart(3, '0')}
                                    </div>

                                    {/* Amount Words */}
                                    <div
                                        className="absolute"
                                        style={{
                                            left: `${settings.amountWords.x * 2}px`,
                                            top: `${settings.amountWords.y * 2}px`,
                                            fontSize: `${settings.amountWords.fontSize * 1.5}px`,
                                            textAlign: settings.amountWords.align as any,
                                            maxWidth: '360px',
                                        }}
                                    >
                                        {formData.amountInWords}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">املأ البيانات واضغط "معاينة" لعرض الشيك</p>
                                </div>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h3 className="font-semibold text-amber-800 mb-2">ملاحظات مهمة:</h3>
                            <ul className="text-sm text-amber-700 space-y-1">
                                <li>• أدخل رقم الشيك المطبوع مسبقاً على الورقة (لا يمكن تكراره)</li>
                                <li>• تأكد من صحة جميع البيانات قبل الطباعة</li>
                                <li>• المبلغ بالحروف يتم توليده تلقائياً ولا يمكن تعديله</li>
                                <li>• استخدم "معاينة" للتحقق من موضع الحقول</li>
                                <li>• الطباعة تكون بمقاس 1:1 مطابق للشيك الحقيقي</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Operations History Section */}
                <div className="card mt-8">
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Printer className="w-6 h-6 text-amber-600" />
                            <h2 className="text-xl font-bold text-gray-800">سجل العمليات الأخير</h2>
                        </div>
                        <button
                            onClick={loadRecords}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            تحديث السجل
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {recordsLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">جاري تحميل السجل...</p>
                            </div>
                        ) : records.length > 0 ? (
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3 text-sm font-semibold text-gray-700">رقم الشيك</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">اسم صاحب الحساب</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">اسم المستفيد</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">المبلغ</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">التاريخ</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">بواسطة</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record) => (
                                        <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-3 text-sm font-mono font-bold text-gray-800">{record.checkNumber}</td>
                                            <td className="p-3 text-sm text-gray-800">{record.accountHolderName}</td>
                                            <td className="p-3 text-sm text-gray-800">{record.beneficiaryName}</td>
                                            <td className="p-3 text-sm font-mono font-bold text-amber-700">
                                                {record.amountDinars}.{record.amountDirhams}
                                            </td>
                                            <td className="p-3 text-sm text-gray-600">
                                                {new Date(record.createdAt!).toLocaleDateString('ar-LY')}
                                            </td>
                                            <td className="p-3 text-sm text-gray-600">{record.createdByName || '—'}</td>
                                            <td className="p-3 text-sm">
                                                <button
                                                    onClick={() => {
                                                        setFormData({
                                                            id: record.id,
                                                            accountHolderName: record.accountHolderName,
                                                            beneficiaryName: record.beneficiaryName,
                                                            accountNumber: record.accountNumber,
                                                            amountDinars: record.amountDinars,
                                                            amountDirhams: record.amountDirhams,
                                                            amountInWords: record.amountInWords,
                                                            issueDate: record.issueDate,
                                                            checkType: record.checkType,
                                                            checkNumber: record.checkNumber,
                                                            branchId: record.branchId,
                                                        });
                                                        setShowPreview(true);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    عرض
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <Printer className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>لا يوجد سجلات طباعة سابقة</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
