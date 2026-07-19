'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Printer, CheckCircle, RefreshCw } from 'lucide-react';
import renderCheckbookHtml, { type CheckbookData } from '@/lib/utils/printRenderer';
import {
  querySoapCheckbook,
  buildPreviewFromSoap,
  type SoapCheckbookResponse,
} from '@/lib/soap/checkbook';
import { printSettingsAPI, type PrintSettings } from '@/lib/printSettings.api';
import { branchService, soapService, printLogService } from '@/lib/api';
import { useTranslation } from '@/i18n/I18nProvider';

export default function PrintPage() {
  const { t } = useTranslation();
  const [accountNumber, setAccountNumber] = useState('');
  const [firstChequeNumber, setFirstChequeNumber] = useState('');
  const [soapData, setSoapData] = useState<SoapCheckbookResponse | null>(null);
  const [checkbookPreview, setCheckbookPreview] = useState<CheckbookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchInfo, setBranchInfo] = useState<{ name: string; routing: string } | null>(null);
  const [layout, setLayout] = useState<PrintSettings | null>(null);
  const [alreadyPrintedCheques, setAlreadyPrintedCheques] = useState<number[]>([]);

  const resolveAccountType = (data: SoapCheckbookResponse): 1 | 2 | 3 => {
    if (data.chequeLeaves === 10) return 3;
    if (data.chequeLeaves === 25) return 1;
    if (data.chequeLeaves === 50) return 2;
    return data.accountNumber.startsWith('2') ? 2 : 1;
  };


  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountNumber) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    setSoapData(null);
    setCheckbookPreview(null);
    setBranchInfo(null);
    setLayout(null);

    try {
      // الحصول على معلومات المستخدم الحالي
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('print.pleaseSignIn'));
      }

      // فك تشفير الـ token للحصول على معلومات المستخدم
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error(t('print.invalidToken'));
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const currentUser = payload;

      // التحقق من رقم الفرع إذا لم يكن المستخدم مديراً
      if (!currentUser.isAdmin && currentUser.branchNumber) {
        // استخراج أول 3 أرقام من رقم الحساب
        const accountBranchCode = accountNumber.substring(0, 3);

        // التحقق من تطابق رقم الفرع
        if (accountBranchCode !== currentUser.branchNumber) {
          setError(t('print.otherBranchError', {
            accountBranch: accountBranchCode,
            userBranch: currentUser.branchNumber,
          }));
          setLoading(false);
          return;
        }
      }

      // استخدام الخدمة الجديدة التي تمر عبر الخادم
      // رقم الفرع سيتم استخراجه تلقائياً من أول 3 أرقام من رقم الحساب في الخادم
      const soapResponse = await soapService.queryCheckbook({
        accountNumber,
        firstChequeNumber: firstChequeNumber ? parseInt(firstChequeNumber, 10) : undefined,
      }) as SoapCheckbookResponse;

      const accountType = resolveAccountType(soapResponse);

      let resolvedLayout: PrintSettings | null = null;
      try {
        resolvedLayout = await printSettingsAPI.getSettings(accountType);
        setLayout(resolvedLayout);
      } catch (layoutError) {
        console.warn('تعذر تحميل إعدادات الطباعة المخصصة، سيتم استخدام القيم الافتراضية.', layoutError);
      }

      // استخراج رمز الفرع من أول 3 أرقام من رقم الحساب (كما طلب المستخدم)
      // سيتم استخدام الدالة الجديدة في الـ Backend التي تقوم بهذا تلقائياً

      let resolvedBranchName = soapResponse.branchName;
      let resolvedRouting = soapResponse.routingNumber;

      // استخدام الدالة الجديدة من الـ Backend لجلب بيانات الفرع بناءً على رقم الحساب
      if (!resolvedBranchName || !resolvedRouting || resolvedBranchName.startsWith('Branch 0')) {
        try {
          console.log(`🔍 جلب بيانات الفرع من الـ Backend لرقم الحساب: ${accountNumber}`);
          const branch = await branchService.getByAccountNumber(accountNumber);
          if (branch) {
            resolvedBranchName = branch.branchName;
            resolvedRouting = branch.routingNumber;
            console.log('✅ تم العثور على الفرع:', branch);
          } else {
            console.warn('⚠️ لم يتم العثور على الفرع في قاعدة البيانات');
          }
        } catch (branchError) {
          console.warn('تعذر العثور على بيانات الفرع:', branchError);
        }
      }

      // قيم افتراضية في حال الفشل التام
      resolvedBranchName = resolvedBranchName || t('print.branchFallback', { code: soapResponse.accountBranch });
      resolvedRouting = resolvedRouting || soapResponse.accountBranch;

      setBranchInfo({ name: resolvedBranchName, routing: resolvedRouting });

      // تحذير إذا لم يتم العثور على بيانات الفرع الحقيقية
      if (resolvedRouting === soapResponse.accountBranch || resolvedBranchName.startsWith('Branch 0')) {
        setError(t('print.branchDataWarning'));
      }

      // التحقق من الشيكات المطبوعة مسبقاً من قاعدة البيانات المحلية
      const chequeNumbers = soapResponse.chequeStatuses.map(s => s.chequeNumber);
      try {
        const printStatus = await printLogService.checkStatus(accountNumber, chequeNumbers);
        const printed = printStatus
          .filter(s => s.isPrinted && !s.canReprint)
          .map(s => s.chequeNumber);

        if (printed.length > 0) {
          setAlreadyPrintedCheques(printed);
          setError(t('print.alreadyPrintedWarning'));

          // تحديث حالة الشيكات في العرض لتظهر كمطبوعة
          soapResponse.chequeStatuses = soapResponse.chequeStatuses.map(s => {
            if (printed.includes(s.chequeNumber)) {
              return { ...s, status: 'U' };
            }
            return s;
          });
        } else {
          setAlreadyPrintedCheques([]);
        }
      } catch (checkError) {
        console.warn('تعذر التحقق من حالة الطباعة:', checkError);
      }

      const preview = buildPreviewFromSoap(soapResponse, {
        layout: resolvedLayout ?? undefined,
        branchName: resolvedBranchName,
        routingNumber: resolvedRouting,
      });
      setSoapData(soapResponse);
      setCheckbookPreview(preview);
    } catch (err: any) {
      console.error('SOAP query failed:', err);
      setError(err.message || t('print.queryFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!checkbookPreview || !soapData) {
      setError(t('print.noDataReady'));
      return;
    }

    // منع الطباعة إذا كانت هناك شيكات مطبوعة مسبقاً
    if (alreadyPrintedCheques.length > 0) {
      setError(t('print.cannotPrint'));
      return;
    }

    setPrinting(true);
    setError(null);
    setSuccess(false);

    try {
      // تسجيل الطباعة وخصم المخزون أولاً — إن فشل لا تُفتح نافذة الطباعة
      const chequeNumbers = soapData.chequeStatuses.map(s => s.chequeNumber);
      try {
        await printLogService.create({
          accountNumber: soapData.accountNumber,
          accountBranch: soapData.accountBranch,
          branchName: branchInfo?.name,
          firstChequeNumber: Math.min(...chequeNumbers),
          lastChequeNumber: Math.max(...chequeNumbers),
          totalCheques: chequeNumbers.length,
          accountType: checkbookPreview.operation.accountType,
          operationType: 'print',
          chequeNumbers,
        });
      } catch (logError: any) {
        const inventoryMessage =
          logError?.response?.data?.error ||
          logError?.response?.data?.details ||
          logError?.message ||
          t('print.inventoryDeductFailed');
        setError(inventoryMessage);
        return;
      }

      const htmlContent = renderCheckbookHtml(checkbookPreview);
      const printWindow = window.open('', '_blank', 'width=1024,height=768');
      if (!printWindow) {
        throw new Error(t('print.printWindowFailed'));
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);

      // Update local state to show "Printed"
      if (soapData) {
        setSoapData(prev => prev ? ({
          ...prev,
          chequeStatuses: prev.chequeStatuses.map(s => ({
            ...s,
            status: 'U'
          }))
        }) : null);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Print failed:', err);
      setError(err.message || t('print.printPageFailed'));
    } finally {
      setPrinting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">{t('print.title')}</h1>

        {/* Search Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t('print.queryAccount')}
          </h2>

          <form onSubmit={handleQuery} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm text-gray-600 mb-1">{t('print.accountNumber')}</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={t('print.accountNumberPlaceholder')}
                className="input w-full"
                disabled={loading}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm text-gray-600 mb-1">{t('print.firstChequeNumber')}</label>
              <input
                type="number"
                value={firstChequeNumber}
                onChange={(e) => setFirstChequeNumber(e.target.value)}
                placeholder=""
                className="input w-full"
                disabled={loading}
                min={0}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading || !accountNumber}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('print.connecting')}
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    {t('print.query')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">{t('print.printSuccess')}</span>
            </div>
            <p className="text-sm text-green-600">
              {t('print.printSuccessHint')}
            </p>
          </div>
        )}

        {/* Account Details */}
        {soapData && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('print.accountDetails')}
            </h2>

            <div className="space-y-4">
              <div className="space-y-6">
                {/* Account Summary Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Account Number & Name */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('print.account')}</p>
                      <p className="text-2xl font-bold text-gray-800 font-mono tracking-tight">
                        {soapData.accountNumber}
                      </p>
                      <p className="text-sm font-medium text-gray-600">
                        {soapData.customerName || t('print.na')}
                      </p>
                    </div>

                    {/* Branch Info */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('print.branch')}</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {soapData.accountBranch} {branchInfo && `- ${branchInfo.name}`}
                      </p>
                      {branchInfo && (
                        <p className="text-xs text-gray-500 font-mono">
                          {t('print.route')}: {branchInfo.routing}
                        </p>
                      )}
                    </div>

                    {/* Checkbook Status */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('print.bookDetails')}</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium border border-blue-100">
                          {t('print.sheets', { count: soapData.chequeLeaves ?? 0 })}
                        </span>
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium border border-purple-100">
                          {soapData.checkBookType ?? t('print.na')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {t('print.start')}: <span className="font-mono text-gray-600">{soapData.firstChequeNumber ?? t('print.na')}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checks Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700">{t('print.chequeList', { count: soapData.chequeStatuses.length })}</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {soapData.chequeStatuses.map((status) => (
                      <div
                        key={status.chequeNumber}
                        className={`relative p-3 rounded-lg border transition-all hover:shadow-md ${status.status === 'U'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-white border-gray-200'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.status === 'U'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                            }`}>
                            {status.status === 'U' ? t('print.printed') : t('print.newStatus')}
                          </span>
                          <Printer className={`w-3 h-3 ${status.status === 'U' ? 'text-amber-400' : 'text-gray-300'}`} />
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-bold font-mono text-gray-800 tracking-tight">
                            {status.chequeNumber}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {t('print.book')}: {status.chequeBookNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-6">
                  <button
                    onClick={handlePrint}
                    disabled={printing || !checkbookPreview}
                    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3"
                  >
                    {printing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {t('print.printing')}
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        {t('print.printCheckbook')}
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-2">
                    {t('print.flexcubeNote')}
                  </p>
                  <button
                    onClick={() => {
                      if (!soapData) return;
                      const refreshed = buildPreviewFromSoap(soapData, {
                        layout: layout ?? undefined,
                        branchName: branchInfo?.name,
                        routingNumber: branchInfo?.routing,
                      });
                      setCheckbookPreview(refreshed);
                    }}
                    className="mt-3 w-full btn bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
                    disabled={!soapData}
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('print.reloadPreview')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!soapData && !error && (
          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              {t('print.queryInstructions')}
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>{t('print.queryInstructionsText')}</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
