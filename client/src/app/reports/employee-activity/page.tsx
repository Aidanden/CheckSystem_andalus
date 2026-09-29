'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printLogService, inventoryService, userService } from '@/lib/api';
import { User } from '@/types';
import { FileText, Download, Filter, Calendar, X, User as UserIcon, Printer, Package, RefreshCw } from 'lucide-react';
import { formatDateShort, formatDateMedium } from '@/utils/locale';
import { RootState } from '@/store';
import { useTranslation } from '@/i18n/I18nProvider';

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
  userId?: number;
  user?: { username: string };
  notes?: string;
  createdAt: string;
}

export default function EmployeeActivityReportPage() {
  const { t, locale } = useTranslation();
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

  const accountTypeLabel = (type: number) => {
    if (type === 1) return t('dashboard.individual');
    if (type === 2) return t('dashboard.corporate');
    return t('common.employee');
  };

  const exportToCSV = () => {
    if (!selectedUserId) return;

    const selectedUser = users.find(u => u.id === selectedUserId);
    const userName = selectedUser?.username || t('employeeActivity.userFallback');
    const timeLocale = locale === 'ar' ? 'ar-LY' : 'en-GB';

    const col = {
      type: t('employeeActivity.csvType'),
      operation: t('employeeActivity.csvOperation'),
      reprintReason: t('employeeActivity.csvReprintReason'),
      accountNumber: t('employeeActivity.csvAccountNumber'),
      branch: t('employeeActivity.csvBranch'),
      fromCheque: t('employeeActivity.csvFromCheque'),
      toCheque: t('employeeActivity.csvToCheque'),
      chequeCount: t('employeeActivity.csvChequeCount'),
      accountType: t('employeeActivity.csvAccountType'),
      date: t('employeeActivity.csvDate'),
      time: t('employeeActivity.csvTime'),
      notes: t('employeeActivity.csvNotes'),
    };

    // تجميع البيانات
    const allData: Record<string, string | number>[] = [];

    // إضافة سجلات الطباعة
    printLogs.forEach((log) => {
      allData.push({
        [col.type]: t('employeeActivity.typePrint'),
        [col.operation]: log.operationType === 'print' ? t('printLogs.opPrint') : t('printLogs.opReprint'),
        [col.reprintReason]:
          log.reprintReason === 'damaged'
            ? t('employeeActivity.reasonDamaged')
            : log.reprintReason === 'not_printed'
              ? t('employeeActivity.reasonNotPrinted')
              : '-',
        [col.accountNumber]: log.accountNumber,
        [col.branch]: log.branchName || t('employeeActivity.branchFallback', { code: log.accountBranch }),
        [col.fromCheque]: log.firstChequeNumber,
        [col.toCheque]: log.lastChequeNumber,
        [col.chequeCount]: log.totalCheques,
        [col.accountType]: accountTypeLabel(log.accountType),
        [col.date]: formatDateShort(log.printDate),
        [col.time]: new Date(log.printDate).toLocaleTimeString(timeLocale),
        [col.notes]: log.notes || '-',
      });
    });

    // إضافة معاملات المخزون
    inventoryTransactions.forEach((transaction) => {
      allData.push({
        [col.type]: t('employeeActivity.typeInventory'),
        [col.operation]:
          transaction.transactionType === 'ADD' ? t('common.add') : t('employeeActivity.deduct'),
        [col.reprintReason]: '-',
        [col.accountNumber]: '-',
        [col.branch]: '-',
        [col.fromCheque]: transaction.serialFrom || '-',
        [col.toCheque]: transaction.serialTo || '-',
        [col.chequeCount]: transaction.quantity,
        [col.accountType]:
          transaction.stockType === 1 ? t('dashboard.individual') : t('dashboard.corporate'),
        [col.date]: formatDateShort(transaction.createdAt),
        [col.time]: new Date(transaction.createdAt).toLocaleTimeString(timeLocale),
        [col.notes]: transaction.notes || '-',
      });
    });

    // ترتيب حسب التاريخ
    allData.sort((a, b) => {
      const dateA = new Date(`${a[col.date]} ${a[col.time]}`).getTime();
      const dateB = new Date(`${b[col.date]} ${b[col.time]}`).getTime();
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
    a.download = `employee-activity-${userName}-${new Date().toISOString().split('T')[0]}.csv`;
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
    totalInventoryQuantity: inventoryTransactions.reduce((sum, tx) => 
      sum + (tx.transactionType === 'ADD' ? tx.quantity : -tx.quantity), 0
    ),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('reports.employeeActivity')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('employeeActivity.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-secondary' : 'btn-outline'} flex items-center gap-2`}
            >
              <Filter className="w-5 h-5" />
              {t('common.filters')}
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
                {t('employeeActivity.exportCsv')}
              </button>
            )}
          </div>
        </div>

        {/* User Selection */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('employeeActivity.selectEmployee')}
          </label>
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="input w-full"
            disabled={!currentUser?.isAdmin}
          >
            <option value="">{t('employeeActivity.selectEmployeePlaceholder')}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} {user.isAdmin ? t('employeeActivity.adminSuffix') : ''}
              </option>
            ))}
          </select>
          {!currentUser?.isAdmin && (
            <p className="text-xs text-gray-500 mt-1">
              {t('employeeActivity.viewOwnOnly')}
            </p>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{t('employeeActivity.filterOptions')}</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  {t('common.clearFilters')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date From Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.fromDate')}
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
                  {t('common.toDate')}
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
                  {t('employeeActivity.operationType')}
                </label>
                <select
                  value={filters.operationType}
                  onChange={(e) => handleFilterChange('operationType', e.target.value)}
                  className="input w-full"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="print">{t('printLogs.opPrint')}</option>
                  <option value="reprint">{t('printLogs.opReprint')}</option>
                </select>
              </div>

              {/* Limit Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('employeeActivity.recordCount')}
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                  className="input w-full"
                >
                  <option value={50}>{t('employeeActivity.lastNRecords', { count: 50 })}</option>
                  <option value={100}>{t('employeeActivity.lastNRecords', { count: 100 })}</option>
                  <option value={200}>{t('employeeActivity.lastNRecords', { count: 200 })}</option>
                  <option value={500}>{t('employeeActivity.lastNRecords', { count: 500 })}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {!selectedUserId ? (
          <div className="card text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('employeeActivity.selectToView')}</h3>
            <p className="text-gray-600">{t('employeeActivity.selectToViewHint')}</p>
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
                    <p className="text-sm text-gray-600">{t('employeeActivity.printOperations')}</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalPrintOperations}</p>
                  </div>
                  <Printer className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('employeeActivity.reprintOperations')}</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalReprintOperations}</p>
                  </div>
                  <RefreshCw className="w-10 h-10 text-orange-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('employeeActivity.totalSheetsPrinted')}</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalSheetsPrinted}</p>
                  </div>
                  <FileText className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('employeeActivity.stockAdditions')}</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalInventoryAdditions}</p>
                  </div>
                  <Package className="w-10 h-10 text-purple-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('employeeActivity.stockDeductions')}</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalInventoryDeductions}</p>
                  </div>
                  <Package className="w-10 h-10 text-red-600 opacity-20" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('employeeActivity.netStock')}</p>
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
                  {t('employeeActivity.printReprintLogs', { count: totalPrintLogs })}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('printLogs.operationType')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('common.accountNumber')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('common.branch')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('employeeActivity.fromTo')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('employeeActivity.chequeCount')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('reports.accountType')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('employeeActivity.dateTime')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('common.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>{t('employeeActivity.noPrintLogs')}</p>
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
                              {log.operationType === 'print' ? t('printLogs.opPrint') : t('printLogs.opReprint')}
                              {log.reprintReason && (
                                <span className="mr-1">({log.reprintReason === 'damaged' ? t('employeeActivity.damaged') : t('employeeActivity.notPrinted')})</span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-mono">{log.accountNumber}</td>
                          <td className="py-3 px-4 text-sm">{log.branchName || t('employeeActivity.branchFallback', { code: log.accountBranch })}</td>
                          <td className="py-3 px-4 text-sm font-mono">
                            {log.firstChequeNumber} - {log.lastChequeNumber}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold">{log.totalCheques}</td>
                          <td className="py-3 px-4 text-sm">
                            {accountTypeLabel(log.accountType)}
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
                  {t('employeeActivity.inventoryTransactions', { count: totalInventoryTransactions })}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('printLogs.operationType')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('employeeActivity.stockType')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('inventory.quantity')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('employeeActivity.fromTo')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('employeeActivity.dateTime')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">{t('common.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>{t('employeeActivity.noInventoryTx')}</p>
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
                              {transaction.transactionType === 'ADD' ? t('common.add') : t('employeeActivity.deduct')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {transaction.stockType === 1 ? t('dashboard.individual') : t('dashboard.corporate')}
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
