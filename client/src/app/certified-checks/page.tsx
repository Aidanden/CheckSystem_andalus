'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { certifiedCheckService, branchService, inventoryService } from '@/lib/api';
import { CertifiedBranch, CertifiedSerialRange, CertifiedStatistics } from '@/lib/api/services/certifiedCheck.service';
import { Stamp, Printer, RefreshCw, CheckCircle, AlertCircle, Building2, Package } from 'lucide-react';

export default function CertifiedChecksPage() {
    const [branches, setBranches] = useState<CertifiedBranch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [serialRange, setSerialRange] = useState<CertifiedSerialRange | null>(null);
    const [statistics, setStatistics] = useState<CertifiedStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [printing, setPrinting] = useState(false);
    const [notes, setNotes] = useState('');
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [customStartSerial, setCustomStartSerial] = useState<string>('');
    const [numberOfBooks, setNumberOfBooks] = useState<number>(1);
    const [availableStock, setAvailableStock] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            loadSerialRange(selectedBranch);
        } else {
            setSerialRange(null);
        }
    }, [selectedBranch, customStartSerial, numberOfBooks]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [branchesData, statsData, stockData] = await Promise.all([
                certifiedCheckService.getBranches(),
                certifiedCheckService.getStatistics(),
                inventoryService.getByStockType(3).catch(() => ({ quantity: 0 })),
            ]);
            setBranches(branchesData);
            setStatistics(statsData);
            setAvailableStock((stockData as any).quantity);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const loadSerialRange = async (branchId: number) => {
        try {
            const params: any = {};
            if (customStartSerial && parseInt(customStartSerial) > 0) {
                params.customStartSerial = parseInt(customStartSerial);
            }
            if (numberOfBooks > 0) {
                params.numberOfBooks = numberOfBooks;
            }
            const range = await certifiedCheckService.getNextSerialRange(branchId, params);
            setSerialRange(range);
        } catch (err) {
            console.error('Error loading serial range:', err);
        }
    };

    useEffect(() => {
        if (selectedBranch) {
            loadSerialRange(selectedBranch);
        }
    }, [selectedBranch, customStartSerial, numberOfBooks]);

    const handlePrint = async () => {
        if (!selectedBranch) {
            setError('يرجى اختيار الفرع أولاً');
            return;
        }

        // Find selected branch
        const branch = branches.find(b => b.id === selectedBranch);
        if (!branch) {
            setError('الفرع غير موجود');
            return;
        }

        if (!branch.accountingNumber) {
            setError('الفرع ليس لديه رقم محاسبي. يرجى تحديثه في إدارة الفروع أولاً.');
            return;
        }

        if (!branch.routingNumber) {
            setError('الفرع ليس لديه رقم توجيهي. يرجى تحديثه في إدارة الفروع أولاً.');
            return;
        }

        if (!serialRange) {
            setError('يرجى الانتظار حتى يتم تحميل نطاق الأرقام التسلسلية');
            return;
        }

        try {
            setPrinting(true);
            setError(null);
            setSuccess(null);

            console.log('🖨️ Starting print with:', {
                branchId: selectedBranch,
                notes,
                customStartSerial: customStartSerial ? parseInt(customStartSerial) : undefined,
                numberOfBooks
            });

            const result = await certifiedCheckService.printBook(
                selectedBranch,
                notes,
                customStartSerial ? parseInt(customStartSerial) : undefined,
                numberOfBooks
            );

            console.log('✅ Print result:', result);

            if (result && result.success) {
                // Generate print HTML and open print dialog
                const printData = result.printData;
                if (!printData) {
                    throw new Error('لم يتم إرجاع بيانات الطباعة');
                }

                console.log('📄 Opening print window with data:', printData);
                openPrintWindow(printData);

                const booksCount = printData.numberOfBooks || 1;
                setSuccess(`تم إصدار ${booksCount} ${booksCount === 1 ? 'دفتر' : 'دفاتر'} بنجاح! (${printData.firstSerial} - ${printData.lastSerial})`);
                setNotes('');
                setCustomStartSerial(''); // إعادة تعيين بداية التسلسل
                loadData(); // Reload statistics
                loadSerialRange(selectedBranch); // Reload serial range
            } else {
                throw new Error('فشل في إصدار دفتر الصكوك: لم يتم إرجاع نتيجة ناجحة');
            }
        } catch (err: any) {
            console.error('❌ Error printing:', err);
            const errorMessage = err.response?.data?.error || err.message || 'فشل في إصدار دفتر الصكوك';
            setError(errorMessage);
        } finally {
            setPrinting(false);
        }
    };

    const openPrintWindow = (printData: CertifiedSerialRange) => {
        // رقم الترميز: من اليمين لليسار = 03 + محاسبي + توجيهي + تسلسلي
        // في MICR (من اليسار لليمين): C{serial}C A{routing}A {accounting}C 03
        const buildMicrLine = (serial: number) => {
            const serialStr = String(serial).padStart(9, '0');
            const accountingStr = String(printData.accountingNumber || '').padStart(10, '0');
            const routingStr = String(printData.routingNumber || '').padStart(8, '0');
            return `C${serialStr}C A${routingStr}A ${accountingStr}C 03`;
        };

        const checksHtml = [];
        for (let i = printData.firstSerial; i <= printData.lastSerial; i++) {
            const micrLine = buildMicrLine(i);
            checksHtml.push(`
        <div class="check-wrapper">
          <section class="check">
            <div class="branch-name">${printData.branchName}</div>
            <div class="serial-left">${String(i).padStart(9, '0')}</div>
            <div class="serial-right">${String(i).padStart(9, '0')}</div>
            <div class="micr-line">${micrLine}</div>
          </section>
        </div>
      `);
        }

        const printHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>طباعة دفتر الصكوك المصدقة - ${printData.branchName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: 235mm 86mm; margin: 0; }
    @page :blank { display: none; }
    @font-face { font-family: 'MICR'; src: url('/font/micrenc.ttf') format('truetype'); }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', sans-serif; }
    .check-wrapper { margin: 0; padding: 0; width: 235mm; height: 86mm; page-break-inside: avoid; overflow: hidden; display: block; }
    .check-wrapper:not(:last-child) { page-break-after: always; }
    .check-wrapper:last-child { page-break-after: avoid !important; page-break-inside: avoid; }
    .check { position: relative; width: 235mm; height: 86mm; background: #fff; }
    .branch-name { position: absolute; top: 20mm; left: 50%; transform: translateX(-50%); font-size: 14pt; font-weight: bold; text-align: center; }
    .serial-left { position: absolute; top: 18mm; left: 15mm; font-size: 12pt; font-family: 'Courier New', monospace; font-weight: bold; direction: ltr; }
    .serial-right { position: absolute; top: 18mm; right: 15mm; font-size: 12pt; font-family: 'Courier New', monospace; font-weight: bold; direction: ltr; }
    .micr-line { position: absolute; bottom: 10mm; left: 50%; transform: translateX(-50%); font-family: 'MICR', monospace; font-size: 12pt; font-weight: bold; letter-spacing: 0.15em; direction: ltr; white-space: nowrap; }
    @media screen { body { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; background: #f3f4f6; } .check-wrapper { box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; } }
  </style>
</head>
<body>
  ${checksHtml.join('\n')}
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printHtml);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                            <Stamp className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">إصدار دفاتر الصكوك المصدقة</h1>
                            <p className="text-gray-600">طباعة دفاتر صكوك مصدقة للفروع (50 ورقة)</p>
                        </div>
                    </div>
                    <button
                        onClick={loadData}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        تحديث
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card bg-gradient-to-br from-amber-50 to-white border-2 border-amber-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">إجمالي الدفاتر المطبوعة</p>
                                <p className="text-3xl font-bold text-amber-600">{statistics?.totalBooks || 0}</p>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-xl">
                                <Stamp className="w-8 h-8 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">إجمالي الصكوك</p>
                                <p className="text-3xl font-bold text-blue-600">{statistics?.totalChecks || 0}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-green-50 to-white border-2 border-green-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">المخزون المتاح</p>
                                <p className="text-3xl font-bold text-green-600">{availableStock ?? 0}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-xl">
                                <Package className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">آخر طباعة</p>
                                <p className="text-lg font-bold text-purple-600">
                                    {statistics?.lastPrintDate
                                        ? new Date(statistics.lastPrintDate).toLocaleDateString('ar-LY')
                                        : 'لا يوجد'}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <Printer className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branch Serials */}
                {statistics?.branchSerials && statistics.branchSerials.length > 0 && (
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary-600" />
                            آخر تسلسل لكل فرع
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {statistics.branchSerials.map((bs) => (
                                <div key={bs.branchId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <span className="font-semibold text-gray-700">{bs.branchName}</span>
                                    <span className="text-lg font-bold text-primary-600 font-mono">{bs.lastSerial}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Print Form */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">إصدار دفتر جديد</h3>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            {success}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                اختر الفرع <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedBranch || ''}
                                onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : null)}
                                className="input"
                            >
                                <option value="">-- اختر الفرع --</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branchName} (آخر تسلسل: {branch.lastSerial})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                بداية التسلسل
                            </label>
                            <input
                                type="number"
                                value={customStartSerial}
                                onChange={(e) => setCustomStartSerial(e.target.value)}
                                className="input"
                                placeholder="مثال: 000000001"
                                min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                اتركه فارغاً للاستمرار من آخر تسلسل
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                عدد الدفاتر <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={numberOfBooks}
                                onChange={(e) => setNumberOfBooks(Math.max(1, parseInt(e.target.value) || 1))}
                                className="input"
                                min="1"
                                max="100"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                كل دفتر = 50 ورقة
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ملاحظات (اختياري)
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="input"
                                placeholder="أدخل ملاحظات إن وجدت..."
                            />
                        </div>
                    </div>

                    {/* Serial Range Preview */}
                    {serialRange && (
                        <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                            <h4 className="font-bold text-gray-800 mb-4">معاينة الدفتر</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">الفرع</p>
                                    <p className="font-bold text-gray-800">{serialRange.branchName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">الرقم المحاسبي</p>
                                    <p className="font-bold font-mono text-gray-800">{serialRange.accountingNumber || 'غير محدد'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">من رقم</p>
                                    <p className="font-bold font-mono text-primary-600">{serialRange.firstSerial}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">إلى رقم</p>
                                    <p className="font-bold font-mono text-primary-600">{serialRange.lastSerial}</p>
                                </div>
                                {serialRange.numberOfBooks && (
                                    <div>
                                        <p className="text-sm text-gray-600">عدد الدفاتر</p>
                                        <p className="font-bold text-primary-600">{serialRange.numberOfBooks}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">إجمالي الأوراق</p>
                                    <p className="font-bold text-primary-600">{serialRange.totalChecks || (serialRange.lastSerial - serialRange.firstSerial + 1)}</p>
                                </div>
                            </div>


                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handlePrint}
                            disabled={!selectedBranch || printing}
                            className="btn btn-primary flex items-center gap-2 px-8 py-3 text-lg"
                        >
                            {printing ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    جاري الطباعة...
                                </>
                            ) : (
                                <>
                                    <Printer className="w-5 h-5" />
                                    طباعة {numberOfBooks} {numberOfBooks === 1 ? 'دفتر' : 'دفاتر'} ({numberOfBooks * 50} ورقة)
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
