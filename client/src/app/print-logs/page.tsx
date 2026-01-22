'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printLogService, soapService, branchService } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { FileText, Printer, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import renderCheckbookHtml, { type CheckbookData } from '@/lib/utils/printRenderer';
import { buildPreviewFromSoap, type SoapCheckbookResponse } from '@/lib/soap/checkbook';
import { printSettingsAPI, type PrintSettings } from '@/lib/printSettings.api';

interface PrintLog {
  id: number;
  accountNumber: string;
  accountBranch: string;
  branchName?: string;
  firstChequeNumber: number;
  lastChequeNumber: number;
  totalCheques: number;
  accountType: number;
  operationType: string;
  printedBy: number;
  printedByName: string;
  printDate: string;
  notes?: string;
}

export default function PrintLogsPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [logs, setLogs] = useState<PrintLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [reprinting, setReprinting] = useState(false);

  // Filters
  const [operationType, setOperationType] = useState<'all' | 'print' | 'reprint'>('all');
  const [accountNumber, setAccountNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reprint Modal State
  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PrintLog | null>(null);
  const [reprintStartSerial, setReprintStartSerial] = useState<number>(0);
  const [reprintEndSerial, setReprintEndSerial] = useState<number>(0);
  const [reprintReason, setReprintReason] = useState<'damaged' | 'not_printed' | ''>('');

  // التحقق من صلاحية إعادة الطباعة
  const canReprint = currentUser?.isAdmin || currentUser?.permissions?.some(p => p.permissionCode === 'REPRINT');

  useEffect(() => {
    loadLogs();
  }, [page, operationType, searchTerm]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };

      if (operationType !== 'all') {
        params.operationType = operationType;
      }

      if (searchTerm) {
        params.accountNumber = searchTerm;
      }

      const result = await printLogService.getAll(params);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load print logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchTerm(accountNumber);
    setPage(1);
  };

  const handleClearSearch = () => {
    setAccountNumber('');
    setSearchTerm('');
    setPage(1);
  };

  const resolveAccountType = (data: SoapCheckbookResponse): 1 | 2 | 3 => {
    if (data.chequeLeaves === 10) return 3;
    if (data.chequeLeaves === 25) return 1;
    if (data.chequeLeaves === 50) return 2;
    return data.accountNumber.startsWith('2') ? 2 : 1;
  };

  const openReprintModal = (log: PrintLog) => {
    if (!canReprint) {
      alert('ليس لديك صلاحية إعادة الطباعة. يرجى التواصل مع المسؤول.');
      return;
    }
    setSelectedLog(log);
    setReprintStartSerial(log.firstChequeNumber);
    setReprintEndSerial(log.lastChequeNumber);
    setReprintReason(''); // إعادة تعيين السبب
    setReprintModalOpen(true);
  };

  const handleConfirmReprint = async () => {
    if (!selectedLog) return;

    // Validation
    if (reprintStartSerial < selectedLog.firstChequeNumber || reprintEndSerial > selectedLog.lastChequeNumber) {
      alert(`الرجاء اختيار نطاق ضمن النطاق الأصلي (${selectedLog.firstChequeNumber} - ${selectedLog.lastChequeNumber})`);
      return;
    }

    if (reprintStartSerial > reprintEndSerial) {
      alert('رقم البداية يجب أن يكون أصغر من أو يساوي رقم النهاية');
      return;
    }

    // التحقق من اختيار سبب إعادة الطباعة
    if (!reprintReason || (reprintReason !== 'damaged' && reprintReason !== 'not_printed')) {
      alert('الرجاء اختيار سبب إعادة الطباعة: ورقة تالفة أو ورقة لم تطبع');
      return;
    }

    setReprinting(true);

    try {
      // جلب البيانات من SOAP
      const soapResponse = await soapService.queryCheckbook({
        accountNumber: selectedLog.accountNumber,
        firstChequeNumber: selectedLog.firstChequeNumber,
      }) as SoapCheckbookResponse;

      // تصفية الشيكات بناءً على النطاق المحدد
      const filteredStatuses = soapResponse.chequeStatuses.filter(
        c => c.chequeNumber >= reprintStartSerial && c.chequeNumber <= reprintEndSerial && c.chequeNumber > 0
      );

      if (filteredStatuses.length === 0) {
        throw new Error('لم يتم العثور على شيكات في النطاق المحدد');
      }

      // إنشاء استجابة SOAP مصفاة مع الحفاظ على chequeLeaves الأصلي لتحديد نوع الحساب بشكل صحيح
      const filteredSoapResponse: SoapCheckbookResponse = {
        ...soapResponse,
        chequeStatuses: filteredStatuses
        // نترك chequeLeaves كما هو من الاستجابة الأصلية لتحديد نوع الحساب (Corporate = 50, Individual = 25, Employee = 10)
      };

      const accountType = resolveAccountType(soapResponse);

      // جلب إعدادات الطباعة
      let resolvedLayout: PrintSettings | null = null;
      try {
        resolvedLayout = await printSettingsAPI.getSettings(accountType);
      } catch (layoutError) {
        console.warn('تعذر تحميل إعدادات الطباعة المخصصة، سيتم استخدام القيم الافتراضية.', layoutError);
      }

      // تحديد الفرع
      let resolvedBranchName = soapResponse.branchName || selectedLog.branchName;
      let resolvedRouting = soapResponse.routingNumber;

      if (!resolvedBranchName || !resolvedRouting || resolvedBranchName.startsWith('فرع 0')) {
        try {
          const branch = await branchService.getByAccountNumber(selectedLog.accountNumber);
          if (branch) {
            resolvedBranchName = branch.branchName;
            resolvedRouting = branch.routingNumber;
          }
        } catch (branchError) {
          console.warn('تعذر العثور على بيانات الفرع:', branchError);
        }
      }

      resolvedBranchName = resolvedBranchName || `فرع ${soapResponse.accountBranch}`;
      resolvedRouting = resolvedRouting || soapResponse.accountBranch;

      // بناء معاينة الطباعة
      const preview = buildPreviewFromSoap(filteredSoapResponse, {
        layout: resolvedLayout ?? undefined,
        branchName: resolvedBranchName,
        routingNumber: resolvedRouting,
      });

      // طباعة
      const htmlContent = renderCheckbookHtml(preview);
      const printWindow = window.open('', '_blank', 'width=1024,height=768');
      if (!printWindow) {
        throw new Error('تعذّر فتح نافذة الطباعة');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);

      // تسجيل عملية إعادة الطباعة
      try {
        const chequeNumbers = filteredStatuses.map(s => s.chequeNumber);
        await printLogService.create({
          accountNumber: soapResponse.accountNumber,
          accountBranch: soapResponse.accountBranch,
          branchName: resolvedBranchName,
          firstChequeNumber: Math.min(...chequeNumbers),
          lastChequeNumber: Math.max(...chequeNumbers),
          totalCheques: chequeNumbers.length,
          accountType: preview.operation.accountType,
          operationType: 'reprint',
          reprintReason: reprintReason as 'damaged' | 'not_printed',
          chequeNumbers,
        });
        console.log('✅ تم تسجيل عملية إعادة الطباعة بنجاح');
        loadLogs();
      } catch (logError: any) {
        console.error('فشل تسجيل عملية إعادة الطباعة:', logError);
        alert(logError.response?.data?.error || logError.message || 'فشل تسجيل عملية إعادة الطباعة');
        return;
      }

      setReprintModalOpen(false);
      setReprintReason(''); // إعادة تعيين السبب
      // alert('✅ تمت إعادة الطباعة بنجاح!'); // Removed alert to be less intrusive
    } catch (error: any) {
      console.error('Reprint failed:', error);
      alert(`فشل في إعادة الطباعة: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setReprinting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-LY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOperationTypeLabel = (type: string) => {
    return type === 'print' ? 'طباعة' : 'إعادة طباعة';
  };

  const getOperationTypeBadge = (type: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium';
    if (type === 'print') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-blue-100 text-blue-800`;
  };

  if (loading && logs.length === 0) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">سجلات الطباعة</h1>
              <p className="text-sm text-gray-600">عرض ومراقبة جميع عمليات الطباعة وإعادة الطباعة</p>
            </div>
          </div>
        </div>

        {/* Permission Notice */}
        {!canReprint && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">
              ⚠️ ليس لديك صلاحية إعادة الطباعة. يمكنك فقط عرض السجلات.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search by Account Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث برقم الحساب
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="أدخل رقم الحساب..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  بحث
                </button>
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-2"
                    title="إلغاء البحث"
                  >
                    <X className="w-5 h-5" />
                    <span className="hidden sm:inline">إلغاء</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter by Operation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع العملية
              </label>
              <select
                value={operationType}
                onChange={(e) => {
                  setOperationType(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">الكل</option>
                <option value="print">طباعة</option>
                <option value="reprint">إعادة طباعة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي السجلات</p>
                <p className="text-2xl font-bold text-gray-800">{total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الحساب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفرع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نطاق الشيكات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العدد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع العملية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.accountNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.branchName || `فرع ${log.accountBranch}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.firstChequeNumber} - {log.lastChequeNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.totalCheques}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getOperationTypeBadge(log.operationType)}>
                        {getOperationTypeLabel(log.operationType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.printedByName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(log.printDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {canReprint && (
                        <button
                          onClick={() => openReprintModal(log)}
                          disabled={reprinting}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="إعادة الطباعة"
                        >
                          <Printer className="w-4 h-4" />
                          {reprinting ? 'جاري...' : 'إعادة طباعة'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Page Info */}
                <div className="text-sm text-gray-700">
                  عرض <span className="font-medium">{(page - 1) * limit + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(page * limit, total)}</span> من{' '}
                  <span className="font-medium">{total}</span> سجل
                  {totalPages > 0 && (
                    <span className="text-gray-500 mr-2">
                      (صفحة {page} من {totalPages})
                    </span>
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {/* First Page */}
                    {page > 3 && totalPages > 5 && (
                      <>
                        <button
                          onClick={() => setPage(1)}
                          disabled={loading}
                          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          1
                        </button>
                        {page > 4 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                      </>
                    )}

                    {/* Pages around current page */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(pageNum => {
                        // Show current page and 2 pages before and after
                        if (totalPages <= 7) return true; // Show all if 7 or less pages
                        return pageNum >= Math.max(1, page - 2) && pageNum <= Math.min(totalPages, page + 2);
                      })
                      .map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          disabled={loading}
                          className={`px-3 py-2 border rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                            page === pageNum
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                    {/* Last Page */}
                    {page < totalPages - 2 && totalPages > 5 && (
                      <>
                        {page < totalPages - 3 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setPage(totalPages)}
                          disabled={loading}
                          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {logs.length === 0 && !loading && (
          <div className="card text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سجلات</h3>
            <p className="text-gray-600">لم يتم العثور على أي سجلات طباعة</p>
          </div>
        )}
      </div>
      {/* Reprint Modal */}
      {reprintModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                إعادة طباعة شيكات
              </h3>
              <button
                onClick={() => setReprintModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">تفاصيل الدفتر الأصلي:</p>
                <p>رقم الحساب: <span className="font-mono font-bold">{selectedLog.accountNumber}</span></p>
                <p>النطاق: <span className="font-mono font-bold">{selectedLog.firstChequeNumber} - {selectedLog.lastChequeNumber}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    من شيك رقم
                  </label>
                  <input
                    type="number"
                    value={reprintStartSerial}
                    onChange={(e) => setReprintStartSerial(parseInt(e.target.value) || 0)}
                    className="input w-full"
                    min={selectedLog.firstChequeNumber}
                    max={selectedLog.lastChequeNumber}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    إلى شيك رقم
                  </label>
                  <input
                    type="number"
                    value={reprintEndSerial}
                    onChange={(e) => setReprintEndSerial(parseInt(e.target.value) || 0)}
                    className="input w-full"
                    min={selectedLog.firstChequeNumber}
                    max={selectedLog.lastChequeNumber}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                عدد الشيكات المحدد: <span className="font-bold text-gray-900">{Math.max(0, reprintEndSerial - reprintStartSerial + 1)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب إعادة الطباعة <span className="text-red-500">*</span>
                </label>
                <select
                  value={reprintReason}
                  onChange={(e) => setReprintReason(e.target.value as 'damaged' | 'not_printed' | '')}
                  className="input w-full"
                  required
                >
                  <option value="">-- اختر السبب --</option>
                  <option value="damaged">ورقة تالفة (سيتم خصم من المخزون)</option>
                  <option value="not_printed">ورقة لم تطبع (لن يتم خصم من المخزون)</option>
                </select>
                {reprintReason === 'damaged' && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ سيتم خصم {Math.max(0, reprintEndSerial - reprintStartSerial + 1)} ورقة من المخزون
                  </p>
                )}
                {reprintReason === 'not_printed' && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ لن يتم خصم من المخزون لأن الورقة لم تطبع أصلاً
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setReprintModalOpen(false)}
                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={reprinting}
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmReprint}
                className="btn btn-primary flex items-center gap-2"
                disabled={reprinting}
              >
                {reprinting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الطباعة...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    تأكيد الطباعة
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
