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
      <html lang="en" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <title>Print Operations Report</title>
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
          <h1>Print Operations Report</h1>
          <p>Report date: ${new Date().toLocaleString('en-GB')}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Operations</div>
            <div class="stat-value">${statistics?.total_operations || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Sheets Printed</div>
            <div class="stat-value">${statistics?.total_sheets_printed || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Reprint (operations)</div>
            <div class="stat-value">${statistics?.reprint_operations || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Reprint (sheets)</div>
            <div class="stat-value">${statistics?.reprint_sheets || 0}</div>
          </div>
        </div>

        <div class="filters-summary">
          <strong>Applied filters:</strong>
          <span style="margin-right: 15px;">Branch: ${filters.branchId ? branches.find(b => b.id === filters.branchId)?.branchName : 'All'}</span>
          <span style="margin-right: 15px;">User: ${filters.userId ? users.find(u => u.id === filters.userId)?.username : 'All'}</span>
          <span style="margin-right: 15px;">Account type: ${filters.accountType === 1 ? 'Individual' : filters.accountType === 2 ? 'Corporate' : 'All'}</span>
          <span style="margin-right: 15px;">Account: ${filters.accountNumber || 'All'}</span>
          <span style="margin-right: 15px;">Name: ${filters.accountHolderName || 'All'}</span>
          <span style="margin-right: 15px;">Date: ${filters.dateFrom || 'Any'} to ${filters.dateTo || 'Any'}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Account Number</th>
              <th>Account Holder</th>
              <th>Type</th>
              <th>From - To</th>
              <th>Sheets</th>
              <th>Date</th>
              <th>User</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${operations.map(op => `
              <tr>
                <td>${op.id}</td>
                <td style="font-family: monospace;">${op.accountNumber}</td>
                <td>${(op as any).account?.accountHolderName || '-'}</td>
                <td>${op.accountType === 1 ? 'Individual' : op.accountType === 2 ? 'Corporate' : 'Employee'}</td>
                <td style="font-family: monospace;">${op.serialFrom} - ${op.serialTo}</td>
                <td>${op.sheetsPrinted}</td>
                <td>${new Date(op.printDate).toLocaleString('en-GB')}</td>
                <td>${(op as any).user?.username || '-'}</td>
                <td>${(op as any).branch?.branchName || '-'}</td>
                <td>
                  <span class="status ${op.status === 'COMPLETED' ? 'status-completed' : op.status === 'PENDING' ? 'status-pending' : 'status-failed'}">
                    ${op.status === 'COMPLETED' ? 'Completed' : op.status === 'PENDING' ? 'Pending' : 'Failed'}
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
    const headers = ['ID', 'Account Number', 'Name', 'Type', 'Sheets', 'From', 'To', 'Date', 'Status', 'User', 'Branch'];
    const rows = operations.map((op: any) => [
      op.id,
      op.accountNumber,
      op.account?.accountHolderName || '',
      op.accountType === 1 ? 'Individual' : 'Corporate',
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
    a.download = `print-operations-report-${new Date().toISOString().split('T')[0]}.csv`;
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
              <h1 className="text-2xl font-bold text-gray-800">Reports & Statistics</h1>
              <p className="text-gray-600 font-medium">View and analyze check printing operations</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'} flex items-center gap-2 transition-all`}
            >
              <Filter className={`w-5 h-5 ${showFilters ? 'text-white' : 'text-gray-500'}`} />
              Filters
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
              Print Report
            </button>
            <button
              onClick={exportToCSV}
              disabled={operations.length === 0}
              className="btn bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-800">Advanced Search Options</h3>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="btn btn-outline-danger btn-sm flex items-center gap-1 py-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Branch Filter - Only for Admin */}
              {user?.isAdmin && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Branch
                  </label>
                  <select
                    value={filters.branchId || ''}
                    onChange={(e) => handleFilterChange('branchId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input w-full"
                  >
                    <option value="">All branches</option>
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
                    User
                  </label>
                  <select
                    value={filters.userId || ''}
                    onChange={(e) => handleFilterChange('userId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input w-full"
                  >
                    <option value="">All users</option>
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
                  Account Type
                </label>
                <select
                  value={filters.accountType || ''}
                  onChange={(e) => handleFilterChange('accountType', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="input w-full"
                >
                  <option value="">All (Individual / Corporate / Employee)</option>
                  <option value={1}>Individual (25 sheets)</option>
                  <option value={2}>Corporate (50 sheets)</option>
                  <option value={3}>Employee (10 sheets)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Operation Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input w-full"
                >
                  <option value="">All statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Account Number Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Account Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.accountNumber}
                    onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
                    placeholder="Search by account number..."
                    className="input w-full pr-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Account Holder Name Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.accountHolderName}
                    onChange={(e) => handleFilterChange('accountHolderName', e.target.value)}
                    placeholder="Search by name..."
                    className="input w-full pr-10"
                  />
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Date From Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  From date
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
                  To date
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
                  Number of records to show
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                  className="input w-full"
                >
                  <option value={25}>Last 25 operations</option>
                  <option value={50}>Last 50 operations</option>
                  <option value={100}>Last 100 operations</option>
                  <option value={200}>Last 200 operations</option>
                  <option value={500}>Last 500 operations</option>
                  <option value={1000}>Last 1000 operations</option>
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
                <p className="text-sm font-bold text-gray-500 uppercase">Total Operations</p>
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
                <p className="text-sm font-bold text-gray-500 uppercase">Sheets Printed</p>
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
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">By Type</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-semibold">Corporate (50):</span>
                  <span className="font-bold">{statistics?.corporate_50 || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-semibold">Individual (25):</span>
                  <span className="font-bold">{statistics?.individual_25 || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-semibold">Employee (10):</span>
                  <span className="font-bold">{statistics?.employees_10 || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Reprint (operations)</p>
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
                <p className="text-sm font-bold text-gray-500 uppercase">Reprint (sheets)</p>
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
              <h2 className="text-xl font-bold text-gray-800">Print Operations Log</h2>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
              {loading ? (
                <span className="flex items-center gap-2 text-primary-600 animate-pulse">
                  Loading...
                </span>
              ) : (
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  Total results: {operations.length}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100 text-right bg-gray-50">
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">#</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">Account Number</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">Account Holder</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">Type</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">Serial Range</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700 text-center">Sheets</th>
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">Date & Time</th>
                  {user?.isAdmin && (
                    <>
                      <th className="py-4 px-4 text-sm font-bold text-gray-700">User</th>
                      <th className="py-4 px-4 text-sm font-bold text-gray-700">Branch</th>
                    </>
                  )}
                  <th className="py-4 px-4 text-sm font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {operations.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={user?.isAdmin ? 10 : 8} className="py-20 text-center text-gray-500">
                      <FileText className="w-20 h-20 mx-auto mb-4 text-gray-200" />
                      <p className="text-xl font-bold">No print operations match the search</p>
                      <p className="text-sm mt-2">Try changing filter settings or clearing filters.</p>
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
                          {op.accountType === 1 ? 'Individual' : op.accountType === 2 ? 'Corporate' : 'Employee'}
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
                          {op.status === 'COMPLETED' ? 'Completed' : op.status === 'PENDING' ? 'Pending' : 'Failed'}
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
