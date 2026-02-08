'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printLogService, inventoryService, userService } from '@/lib/api';
import { User } from '@/types';
import { FileText, Download, Filter, Calendar, X, Search, User as UserIcon, Printer, Package, RefreshCw } from 'lucide-react';
import { formatDateShort, formatDateMedium } from '@/utils/locale';
import { RootState } from '@/store';

interface PrintLogActivity {
  id: number;
  accountNumber: string;
  accountBranch: string;
  branchName?: string;
  firstChequeNumber: number;
  lastChequeNumber: number;
  totalCheques: number;
  accountType: number;
  operationType: string;
  reprintReason?: string;
  printedBy: number;
  printedByName: string;
  printDate: string;
  notes?: string;
}

interface InventoryTransactionActivity {
  id: number;
  stockType: number;
  transactionType: 'ADD' | 'DEDUCT';
  quantity: number;
  serialFrom?: string;
  serialTo?: string;
  userId: number;
  user?: { username: string };
  notes?: string;
  createdAt: string;
}

export default function EmployeeActivityReportPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Activity data
  const [printLogs, setPrintLogs] = useState<PrintLogActivity[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransactionActivity[]>([]);
  const [totalPrintLogs, setTotalPrintLogs] = useState(0);
  const [totalInventoryTransactions, setTotalInventoryTransactions] = useState(0);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    operationType: '',
    limit: 100,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId !== undefined) {
      loadActivityData();
    }
  }, [selectedUserId, filters]);

  const loadUsers = async () => {
    try {
      const usersData = await userService.getAll();
      setUsers(usersData);
      
      // إذا كان المستخدم الحالي ليس مديراً، حدد نفسه فقط
      if (!currentUser?.isAdmin && currentUser) {
        setSelectedUserId(currentUser.id);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadActivityData = async () => {
    if (selectedUserId === undefined) return;

    try {
      setLoading(true);

      // جلب سجلات الطباعة
      const printLogsParams: any = {
        page: 1,
        limit: filters.limit,
      };

      if (filters.dateFrom) printLogsParams.startDate = filters.dateFrom;
      if (filters.dateTo) printLogsParams.endDate = filters.dateTo;
      if (filters.operationType) printLogsParams.operationType = filters.operationType;

      // إضافة userId إلى المعاملات
      printLogsParams.userId = selectedUserId;
      
      const printLogsResult = await printLogService.getAll(printLogsParams);
      
      setPrintLogs(printLogsResult.logs);
      setTotalPrintLogs(printLogsResult.total);

      // جلب معاملات المخزون
      const inventoryTransactionsData = await inventoryService.getTransactionHistory(undefined, filters.limit);
      
      // فلترة حسب المستخدم المحدد
      const filteredInventoryTransactions = inventoryTransactionsData.filter(
        (transaction: any) => transaction.userId === selectedUserId
      );

      setInventoryTransactions(filteredInventoryTransactions);
      setTotalInventoryTransactions(filteredInventoryTransactions.length);
    } catch (error) {
      console.error('Failed to load activity data:', error);
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
      dateFrom: '',
      dateTo: '',
      operationType: '',
      limit: 100,
    });
  };

  const exportToCSV = () => {
    if (!selectedUserId) return;

    const selectedUser = users.find(u => u.id === selectedUserId);
    const userName = selectedUser?.username || 'مستخدم';

    // تجميع البيانات
    const allData: any[] = [];

    // إضافة سجلات الطباعة
    printLogs.forEach((log) => {
      allData.push({
        النوع: 'طباعة',
        العملية: log.operationType === 'print' ? 'طباعة' : 'إعادة طباعة',
        'سبب إعادة الطباعة': log.reprintReason === 'damaged' ? 'ورقة تالفة' : log.reprintReason === 'not_printed' ? 'ورقة لم تطبع' : '-',
        'رقم الحساب': log.accountNumber,
        'الفرع': log.branchName || `فرع ${log.accountBranch}`,
        'من شيك': log.firstChequeNumber,
        'إلى شيك': log.lastChequeNumber,
        'عدد الشيكات': log.totalCheques,
        'نوع الحساب': log.accountType === 1 ? 'فردي' : log.accountType === 2 ? 'شركة' : 'موظف',
        'التاريخ': formatDateShort(log.printDate),
        'الوقت': new Date(log.printDate).toLocaleTimeString('ar-LY'),
        'ملاحظات': log.notes || '-',
      });
    });

    // إضافة معاملات المخزون
    inventoryTransactions.forEach((transaction) => {
      allData.push({
        النوع: 'مخزون',
        العملية: transaction.transactionType === 'ADD' ? 'إضافة' : 'خصم',
        'سبب إعادة الطباعة': '-',
        'رقم الحساب': '-',
        'الفرع': '-',
        'من شيك': transaction.serialFrom || '-',
        'إلى شيك': transaction.serialTo || '-',
        'عدد الشيكات': transaction.quantity,
        'نوع الحساب': transaction.stockType === 1 ? 'فردي' : 'شركة',
        'التاريخ': formatDateShort(transaction.createdAt),
        'الوقت': new Date(transaction.createdAt).toLocaleTimeString('ar-LY'),
        'ملاحظات': transaction.notes || '-',
      });
    });

    // ترتيب حسب التاريخ
    allData.sort((a, b) => {
      const dateA = new Date(a.التاريخ + ' ' + a.الوقت).getTime();
      const dateB = new Date(b.التاريخ + ' ' + b.الوقت).getTime();
      return dateB - dateA;
    });

    // إنشاء CSV
    const headers = Object.keys(allData[0] || {});
    const rows = allData.map((row) => headers.map((header) => row[header] || ''));
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير-عمل-${userName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const activeFiltersCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.operationType,
  ].filter(Boolean).length;

  // إحصائيات
  const stats = {
    totalPrintOperations: printLogs.filter(l => l.operationType === 'print').length,
    totalReprintOperations: printLogs.filter(l => l.operationType === 'reprint').length,
    totalSheetsPrinted: printLogs.reduce((sum, log) => sum + log.totalCheques, 0),
    totalInventoryAdditions: inventoryTransactions.filter(t => t.transactionType === 'ADD').length,
    totalInventoryDeductions: inventoryTransactions.filter(t => t.transactionType === 'DEDUCT').length,
    totalInventoryQuantity: inventoryTransactions.reduce((sum, t) => 
      sum + (t.transactionType === 'ADD' ? t.quantity : -t.quantity), 0
    ),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">تقرير عمل الموظفين</h1>
            <p className="text-sm text-gray-600 mt-1">عرض تفصيلي لجميع أنشطة المستخدمين في النظام</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-secondary' : 'btn-outline'} flex items-center gap-2`}
            >
              <Filter className="w-5 h-5" />
              فلترة
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {selectedUserId && (
              <button
                onClick={exportToCSV}
                className="btn btn-primary flex items-center gap-2"
                disabled={loading}
              >
                <Download className="w-5 h-5" />
                تصدير CSV
              </button>
            )}
          </div>
        </div>

        {/* User Selection */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر الموظف
          </label>
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="input w-full"
            disabled={!currentUser?.isAdmin}
          >
            <option value="">-- اختر الموظف --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} {user.isAdmin ? '(مدير)' : ''}
              </option>
            ))}
          </select>
          {!currentUser?.isAdmin && (
            <p className="text-xs text-gray-500 mt-1">
              يمكنك فقط عرض تقريرك الخاص
            </p>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">خيارات الفلترة</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date From Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  من تاريخ
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="input w-full"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Date To Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إلى تاريخ
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="input w-full"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Operation Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع العملية
                </label>
                <select
                  value={filters.operationType}
                  onChange={(e) => handleFilterChange('operationType', e.target.value)}
                  className="input w-full"
                >
                  <option value="">الكل</option>
                  <option value="print">طباعة</option>
                  <option value="reprint">إعادة طباعة</option>
                </select>
              </div>

              {/* Limit Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عدد السجلات
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                  className="input w-full"
                >
                  <option value={50}>آخر 50 سجل</option>
                  <option value={100}>آخر 100 سجل</option>
                  <option value={200}>آخر 200 سجل</option>
                  <option value={500}>آخر 500 سجل</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {!selectedUserId ? (
          <div className="card text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">اختر موظفاً لعرض تقريره</h3>
            <p className="text-gray-600">يرجى اختيار موظف من القائمة أعلاه لعرض تقرير أنشطته</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">عمليات الطباعة</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalPrintOperations}</p>
                  </div>
                  <Printer className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">عمليات إعادة الطباعة</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalReprintOperations}</p>
                  </div>
                  <RefreshCw className="w-10 h-10 text-orange-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الأوراق المطبوعة</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalSheetsPrinted}</p>
                  </div>
                  <FileText className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">عمليات إضافة المخزون</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalInventoryAdditions}</p>
                  </div>
                  <Package className="w-10 h-10 text-purple-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">عمليات خصم المخزون</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalInventoryDeductions}</p>
                  </div>
                  <Package className="w-10 h-10 text-red-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">صافي المخزون</p>
                    <p className={`text-3xl font-bold mt-2 ${stats.totalInventoryQuantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.totalInventoryQuantity >= 0 ? '+' : ''}{stats.totalInventoryQuantity}
                    </p>
                  </div>
                  <Package className="w-10 h-10 text-gray-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Print Logs Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  سجلات الطباعة وإعادة الطباعة ({totalPrintLogs})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">نوع العملية</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">رقم الحساب</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الفرع</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">من - إلى</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">عدد الشيكات</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">نوع الحساب</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">التاريخ والوقت</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>لا توجد سجلات طباعة</p>
                        </td>
                      </tr>
                    ) : (
                      printLogs.map((log, index) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{index + 1}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.operationType === 'print'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {log.operationType === 'print' ? 'طباعة' : 'إعادة طباعة'}
                              {log.reprintReason && (
                                <span className="mr-1">({log.reprintReason === 'damaged' ? 'تالفة' : 'لم تطبع'})</span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-mono">{log.accountNumber}</td>
                          <td className="py-3 px-4 text-sm">{log.branchName || `فرع ${log.accountBranch}`}</td>
                          <td className="py-3 px-4 text-sm font-mono">
                            {log.firstChequeNumber} - {log.lastChequeNumber}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold">{log.totalCheques}</td>
                          <td className="py-3 px-4 text-sm">
                            {log.accountType === 1 ? 'فردي' : log.accountType === 2 ? 'شركة' : 'موظف'}
                          </td>
                          <td className="py-3 px-4 text-sm">{formatDateMedium(log.printDate)}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{log.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Transactions Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  معاملات المخزون ({totalInventoryTransactions})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">نوع العملية</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">نوع المخزون</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الكمية</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">من - إلى</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">التاريخ والوقت</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>لا توجد معاملات مخزون</p>
                        </td>
                      </tr>
                    ) : (
                      inventoryTransactions.map((transaction, index) => (
                        <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{index + 1}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.transactionType === 'ADD'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {transaction.transactionType === 'ADD' ? 'إضافة' : 'خصم'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {transaction.stockType === 1 ? 'فردي' : 'شركة'}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold">
                            {transaction.transactionType === 'ADD' ? '+' : '-'}{transaction.quantity}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono">
                            {transaction.serialFrom && transaction.serialTo
                              ? `${transaction.serialFrom} - ${transaction.serialTo}`
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm">{formatDateMedium(transaction.createdAt)}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{transaction.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
