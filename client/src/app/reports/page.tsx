'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printingService, branchService, userService } from '@/lib/api';
import { PrintOperation, PrintStatistics, Branch, User } from '@/types';
import { FileText, Download, Filter, Calendar, X, Search, Printer, RefreshCw, ClipboardList, User as UserIcon } from 'lucide-react';
import { formatDateShort, formatDateMedium, formatNumber } from '@/utils/locale';
import { RootState } from '@/store';

export default function ReportsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [operations, setOperations] = useState<PrintOperation[]>([]);
  const [statistics, setStatistics] = useState<PrintStatistics | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    branchId: undefined as number | undefined,
    userId: undefined as number | undefined,
    accountNumber: '',
    accountHolderName: '',
    accountType: undefined as number | undefined,
    status: '' as string,
    dateFrom: '',
    dateTo: '',
    limit: 50,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      // Load branches and users for filters (only if admin)
      if (user?.isAdmin) {
        const [branchesData, usersData] = await Promise.all([
          branchService.getAll(),
          userService.getAll(),
        ]);
        setBranches(branchesData);
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Build filters object
      const apiFilters: any = {
        limit: filters.limit,
      };

      if (filters.branchId) apiFilters.branchId = filters.branchId;
      if (filters.userId) apiFilters.userId = filters.userId;
      if (filters.accountNumber) apiFilters.accountNumber = filters.accountNumber;
      if (filters.accountHolderName) apiFilters.accountHolderName = filters.accountHolderName;
      if (filters.accountType) apiFilters.accountType = filters.accountType;
      if (filters.status) apiFilters.status = filters.status;
      if (filters.dateFrom) apiFilters.dateFrom = filters.dateFrom;
      if (filters.dateTo) apiFilters.dateTo = filters.dateTo;

      const [ops, stats] = await Promise.all([
        printingService.getHistory(apiFilters),
        printingService.getStatistics(filters.branchId),
      ]);

      setOperations(ops);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      branchId: undefined,
      userId: undefined,
      accountNumber: '',
      accountHolderName: '',
      accountType: undefined,
      status: '',
      dateFrom: '',
      dateTo: '',
      limit: 50,
    });
  };

  const generatePrintReport = () => {
    const printHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير سجل عمليات الطباعة</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1e40af; margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .stats-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-label { font-size: 12px; color: #64748b; margin-bottom: 5px; }
          .stat-value { font-size: 18px; font-weight: bold; color: #1e293b; }
          .filters-summary { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
          th { background-color: #f8fafc; color: #475569; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
          .status { padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; }
          .status-completed { color: #15803d; }
          .status-pending { color: #a16207; }
          .status-failed { color: #b91c1c; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
            .header { margin-top: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير سجل عمليات الطباعة</h1>
          <p>تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-LY')}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">إجمالي العمليات</div>
            <div class="stat-value">${statistics?.total_operations || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">أوراق مطبوعة</div>
            <div class="stat-value">${statistics?.total_sheets_printed || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">إعادة طباعة (عمليات)</div>
            <div class="stat-value">${statistics?.reprint_operations || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">إعادة طباعة (أوراق)</div>
            <div class="stat-value">${statistics?.reprint_sheets || 0}</div>
          </div>
        </div>

        <div class="filters-summary">
          <strong>فلاتر البحث المطبقة:</strong>
          <span style="margin-right: 15px;">الفرع: ${filters.branchId ? branches.find(b => b.id === filters.branchId)?.branchName : 'الكل'}</span>
          <span style="margin-right: 15px;">المتخدم: ${filters.userId ? users.find(u => u.id === filters.userId)?.username : 'الكل'}</span>
          <span style="margin-right: 15px;">نوع الحساب: ${filters.accountType === 1 ? 'فردي' : filters.accountType === 2 ? 'شركة' : 'الكل'}</span>
          <span style="margin-right: 15px;">رقم الحساب: ${filters.accountNumber || 'الكل'}</span>
          <span style="margin-right: 15px;">الاسم: ${filters.accountHolderName || 'الكل'}</span>
          <span style="margin-right: 15px;">التاريخ: ${filters.dateFrom || 'مفتوح'} إلى ${filters.dateTo || 'مفتوح'}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>رقم الحساب</th>
              <th>اسم صاحب الحساب</th>
              <th>النوع</th>
              <th>من - إلى</th>
              <th>الأوراق</th>
              <th>التاريخ</th>
              <th>المستخدم</th>
              <th>الفرع</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${operations.map(op => `
              <tr>
                <td>${op.id}</td>
                <td style="font-family: monospace;">${op.accountNumber}</td>
                <td>${(op as any).account?.accountHolderName || '-'}</td>
                <td>${op.accountType === 1 ? 'فردي' : op.accountType === 2 ? 'شركة' : 'موظف'}</td>
                <td style="font-family: monospace;">${op.serialFrom} - ${op.serialTo}</td>
                <td>${op.sheetsPrinted}</td>
                <td>${new Date(op.printDate).toLocaleString('ar-LY')}</td>
                <td>${(op as any).user?.username || '-'}</td>
                <td>${(op as any).branch?.branchName || '-'}</td>
                <td>
                  <span class="status ${op.status === 'COMPLETED' ? 'status-completed' : op.status === 'PENDING' ? 'status-pending' : 'status-failed'}">
                    ${op.status === 'COMPLETED' ? 'مكتمل' : op.status === 'PENDING' ? 'قيد الانتظار' : 'فشل'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'رقم الحساب', 'الاسم', 'النوع', 'الأوراق', 'من', 'إلى', 'التاريخ', 'الحالة', 'المستخدم', 'الفرع'];
    const rows = operations.map((op: any) => [
      op.id,
      op.accountNumber,
      op.account?.accountHolderName || '',
      op.accountType === 1 ? 'فردي' : 'شركة',
      op.sheetsPrinted,
      op.serialFrom,
      op.serialTo,
      formatDateShort(op.printDate),
      op.status,
      op.user?.username || '-',
      op.branch?.branchName || '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير-عمليات-الطباعة-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && operations.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const activeFiltersCount = [
    filters.branchId,
    filters.userId,
    filters.accountNumber,
    filters.accountHolderName,
    filters.accountType,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h1>
              <p className="text-gray-600 font-medium">عرض وتحليل عمليات طباعة الشيكات</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'} flex items-center gap-2 transition-all`}
            >
              <Filter className={`w-5 h-5 ${showFilters ? 'text-white' : 'text-gray-500'}`} />
              الفلاتر
              {activeFiltersCount > 0 && (
                <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center ${showFilters ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}`}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={generatePrintReport}
              disabled={operations.length === 0}
              className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Printer className="w-5 h-5" />
              طباعة التقرير
            </button>
            <button
              onClick={exportToCSV}
              disabled={operations.length === 0}
              className="btn bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              تصدير Excel
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-800">خيارات البحث المتقدم</h3>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="btn btn-outline-danger btn-sm flex items-center gap-1 py-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                  تفريغ جميع الفلاتر
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Branch Filter - Only for Admin */}
              {user?.isAdmin && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الفرع
                  </label>
                  <select
                    value={filters.branchId || ''}
                    onChange={(e) => handleFilterChange('branchId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input w-full"
                  >
                    <option value="">جميع الفروع</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* User Filter - Only for Admin */}
              {user?.isAdmin && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    المستخدم
                  </label>
                  <select
                    value={filters.userId || ''}
                    onChange={(e) => handleFilterChange('userId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input w-full"
                  >
                    <option value="">جميع المستخدمين</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Account Type Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  نوع الحساب
                </label>
                <select
                  value={filters.accountType || ''}
                  onChange={(e) => handleFilterChange('accountType', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="input w-full"
                >
                  <option value="">الكل (فردي / شركة / موظف)</option>
                  <option value={1}>فردي (25 ورقة)</option>
                  <option value={2}>شركات (50 ورقة)</option>
                  <option value={3}>موظفين (10 أوراق)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  حالة العملية
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input w-full"
                >
                  <option value="">جميع الحالات</option>
                  <option value="COMPLETED">مكتمل بنجاح</option>
                  <option value="PENDING">قيد الانتظار</option>
                  <option value="FAILED">فشلت العملية</option>
                </select>
              </div>

              {/* Account Number Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  رقم الحساب
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.accountNumber}
                    onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
                    placeholder="ابحث برقم الحساب..."
                    className="input w-full pr-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Account Holder Name Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم صاحب الحساب
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.accountHolderName}
                    onChange={(e) => handleFilterChange('accountHolderName', e.target.value)}
                    placeholder="ابحث بالاسم..."
                    className="input w-full pr-10"
                  />
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Date From Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Date To Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Limit Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  عدد السجلات المراد عرضها
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                  className="input w-full"
                >
                  <option value={25}>آخر 25 عملية</option>
                  <option value={50}>آخر 50 عملية</option>
                  <option value={100}>آخر 100 عملية</option>
                  <option value={200}>آخر 200 عملية</option>
                  <option value={500}>آخر 500 عملية</option>
                  <option value={1000}>آخر 1000 عملية</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">إجمالي العمليات</p>
                <p className="text-3xl font-black text-gray-800 mt-1">
                  {statistics?.total_operations || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">أوراق مطبوعة</p>
                <p className="text-3xl font-black text-gray-800 mt-1">
                  {statistics?.total_sheets_printed || 0}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Printer className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-amber-500">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">تصنيف حسب النوع</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-semibold">شركات (50):</span>
                  <span className="font-bold">{statistics?.corporate_50 || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-semibold">أفراد (25):</span>
                  <span className="font-bold">{statistics?.individual_25 || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-semibold">موظفين (10):</span>
                  <span className="font-bold">{statistics?.employees_10 || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">إعادة طباعة (عمليات)</p>
                <p className="text-3xl font-black text-gray-800 mt-1">
                  {statistics?.reprint_operations || 0}
                </p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <RefreshCw className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">إعادة طباعة (أوراق)</p>
                <p className="text-3xl font-black text-gray-800 mt-1">
                  {statistics?.reprint_sheets || 0}
                </p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <Printer className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Operations List */}
        <div className="card shadow-md">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-800">سجل عمليات الطباعة</h2>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
              {loading ? (
                <span className="flex items-center gap-2 text-primary-600 animate-pulse">
                  جاري التحميل...
                </span>
              ) : (
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  إجمالي النتائج: {operations.length}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100 text-right bg-gray-50">
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">#</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">رقم الحساب</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">اسم صاحب الحساب</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">النوع</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">نطاق التسلسل</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700 text-center">الأوراق</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">التاريخ والوقت</th>
                  {user?.isAdmin && (
                    <>
                      <th className="py-4 px-4 text-sm font-bold text-gray-700">المستخدم</th>
                      <th className="py-4 px-4 text-sm font-bold text-gray-700">الفرع</th>
                    </>
                  )}
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {operations.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={user?.isAdmin ? 10 : 8} className="py-20 text-center text-gray-500">
                      <FileText className="w-20 h-20 mx-auto mb-4 text-gray-200" />
                      <p className="text-xl font-bold">لا توجد عمليات طباعة مطابقة للبحث</p>
                      <p className="text-sm mt-2">جرب تغيير إعدادات الفلترة أو تفريغ الفلاتر.</p>
                    </td>
                  </tr>
                ) : (
                  operations.map((op: any) => (
                    <tr key={op.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-bold text-gray-400">{op.id}</td>
                      <td className="py-4 px-4 text-sm">
                        <div className="font-mono font-bold text-gray-700">{op.accountNumber}</div>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-gray-900">
                        {op.account?.accountHolderName || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`px-2 py-1 rounded font-bold text-[10px] ${op.accountType === 2 ? 'bg-indigo-100 text-indigo-700' :
                          op.accountType === 3 ? 'bg-purple-100 text-purple-700' :
                            'bg-primary-100 text-primary-700'
                          }`}>
                          {op.accountType === 1 ? 'فردي' : op.accountType === 2 ? 'شركة' : 'موظف'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="flex items-center gap-1 font-mono text-sm text-primary-600 font-bold">
                          <span>{op.serialFrom}</span>
                          <span className="text-gray-300">-</span>
                          <span>{op.serialTo}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-center font-black text-gray-800">
                        {op.sheetsPrinted}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 font-medium">
                        {formatDateMedium(op.printDate)}
                      </td>
                      {user?.isAdmin && (
                        <>
                          <td className="py-4 px-4 text-sm font-bold text-gray-700">
                            {op.user?.username || '-'}
                          </td>
                          <td className="py-4 px-4 text-sm font-bold text-gray-500">
                            {op.branch?.branchName || '-'}
                          </td>
                        </>
                      )}
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm ${op.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : op.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                            }`}
                        >
                          {op.status === 'COMPLETED' ? 'مكتمل' : op.status === 'PENDING' ? 'قيد الانتظار' : 'فشل'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
