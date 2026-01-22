'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { certifiedCheckService, branchService, userService } from '@/lib/api';
import { CertifiedPrintRecord, CertifiedBranch, User } from '@/types';
import {
    FileText,
    Download,
    Filter,
    Calendar,
    X,
    Search,
    Printer,
    Building2,
    User as UserIcon,
    ClipboardList,
    ArrowRightLeft
} from 'lucide-react';
import { formatDateShort, formatDateMedium, formatNumber } from '@/utils/locale';
import { RootState } from '@/store';

export default function CertifiedReportsPage() {
    const user = useSelector((state: RootState) => state.auth.user);
    const [records, setRecords] = useState<CertifiedPrintRecord[]>([]);
    const [branches, setBranches] = useState<CertifiedBranch[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [statistics, setStatistics] = useState<{ totalRecords: number; lastRecordDate: string | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        branchId: undefined as number | undefined,
        search: '',
        startDate: '',
        endDate: '',
        limit: 50,
    });

    const [page, setPage] = useState(0);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadReportData();
    }, [filters, page]);

    const loadInitialData = async () => {
        try {
            // Load branches and users for filters
            const [branchesData, usersData] = await Promise.all([
                branchService.getAll(),
                userService.getAll(),
            ]);
            setBranches(branchesData as any);
            setUsers(usersData);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    };

    const loadReportData = async () => {
        try {
            setLoading(true);

            const [res, stats] = await Promise.all([
                certifiedCheckService.getPrintRecords({
                    skip: page * filters.limit,
                    take: filters.limit,
                    branchId: filters.branchId,
                    search: filters.search,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                }),
                certifiedCheckService.getRecordStatistics(filters.branchId),
            ]);

            setRecords(res.records);
            setTotal(res.total);
            setStatistics(stats);
            setError(null);
        } catch (err: any) {
            console.error('Error loading reports:', err);
            setError(err.response?.data?.error || 'فشل في تحميل التقارير');
            setRecords([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({
            branchId: undefined,
            search: '',
            startDate: '',
            endDate: '',
            limit: 50,
        });
        setPage(0);
    };

    const generatePrintReport = () => {
        const printHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الشيكات المصدقة الصادرة</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1e40af; margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .stats-info { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .filters-summary { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
          th { background-color: #f8fafc; color: #475569; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
          .amount { font-weight: bold; color: #1e40af; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
            .header { margin-top: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير عمليات إصدار الصكوك المصدقة</h1>
          <p>تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-LY')}</p>
        </div>

        <div class="stats-info">
          <strong>إجمالي الصكوك المصدرة في النتائج الحالية:</strong> ${total}
        </div>

        <div class="filters-summary">
          <strong>فلاتر البحث المطبقة:</strong>
          <span style="margin-right: 15px;">الفرع: ${filters.branchId ? branches.find(b => b.id === filters.branchId)?.branchName : 'الكل'}</span>
          <span style="margin-right: 15px;">البحث: ${filters.search || 'لا يوجد'}</span>
          <span style="margin-right: 15px;">التاريخ: ${filters.startDate || 'مفتوح'} إلى ${filters.endDate || 'مفتوح'}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>رقم الصك</th>
              <th>رقم الحساب</th>
              <th>صاحب الحساب</th>
              <th>المستفيد</th>
              <th>القيمة</th>
              <th>التاريخ</th>
              <th>بواسطة</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(rec => `
              <tr>
                <td style="font-family: monospace;">${rec.checkNumber}</td>
                <td style="font-family: monospace;">${rec.accountNumber}</td>
                <td>${rec.accountHolderName}</td>
                <td>${rec.beneficiaryName}</td>
                <td class="amount">${rec.amountDinars}.${rec.amountDirhams} د.ل</td>
                <td>${new Date(rec.createdAt || '').toLocaleDateString('ar-LY')}</td>
                <td>${rec.createdByName || '-'}</td>
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
        const headers = ['رقم الصك', 'رقم الحساب', 'صاحب الحساب', 'المستفيد', 'القيمة', 'التاريخ', 'بواسطة'];
        const rows = records.map((rec) => [
            rec.checkNumber,
            rec.accountNumber,
            rec.accountHolderName,
            rec.beneficiaryName,
            `${rec.amountDinars}.${rec.amountDirhams}`,
            rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '',
            rec.createdByName || '-',
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-صكوك-مصدقة-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const activeFiltersCount = [
        filters.branchId,
        filters.search,
        filters.startDate,
        filters.endDate,
    ].filter(Boolean).length;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-xl shadow-lg">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">تقارير الصكوك المصدقة</h1>
                            <p className="text-gray-600 font-medium">عرض وتحليل عمليات إصدار الصكوك المصدقة</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                            disabled={records.length === 0}
                            className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                            <Printer className="w-5 h-5" />
                            طباعة التقرير
                        </button>
                        <button
                            onClick={exportToCSV}
                            disabled={records.length === 0}
                            className="btn bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                            <Download className="w-5 h-5" />
                            تصدير Excel
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-xl flex items-center justify-between shadow-sm animate-shake">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg">
                                <X className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-red-800 font-bold">خطأ في البيانات</p>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase">إجمالي الصكوك المصدقة</p>
                                <p className="text-3xl font-black text-gray-800 mt-1">
                                    {statistics?.totalRecords || 0}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase">آخر عملية إصدار</p>
                                <p className="text-xl font-bold text-gray-800 mt-1">
                                    {statistics?.lastRecordDate ? formatDateMedium(statistics.lastRecordDate) : '--'}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-xl">
                                <Calendar className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card hover:shadow-lg transition-shadow border-r-4 border-r-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase">النتائج الحالية</p>
                                <p className="text-3xl font-black text-gray-800 mt-1">
                                    {total}
                                </p>
                            </div>
                            <div className="bg-indigo-100 p-3 rounded-xl">
                                <Search className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>
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
                            {/* Branch Filter */}
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

                            {/* Search Field */}
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    بحث عام (الاسم، الحساب، رقم الصك)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        placeholder="ابحث عن أي تفاصيل..."
                                        className="input w-full pr-10"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    من تاريخ
                                </label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="input w-full"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    إلى تاريخ
                                </label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="input w-full"
                                />
                            </div>

                            {/* Limit */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    عدد السجلات
                                </label>
                                <select
                                    value={filters.limit}
                                    onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                                    className="input w-full"
                                >
                                    <option value={25}>25 سجل</option>
                                    <option value={50}>50 سجل</option>
                                    <option value={100}>100 سجل</option>
                                    <option value={200}>200 سجل</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Table */}
                <div className="card shadow-md">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-bold text-gray-800">سجل الشيكات الصادرة</h2>
                        </div>
                        <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            عدد النتائج: {total}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-100 text-right bg-gray-50">
                                    <th className="py-4 px-4 text-sm font-bold text-gray-700">رقم الصك</th>
                                    <th className="py-4 px-4 text-sm font-bold text-gray-700">صاحب الحساب</th>
                                    <th className="py-4 px-4 text-sm font-bold text-gray-700">المستفيد</th>
                                    <th className="py-4 px-4 text-sm font-bold text-gray-700">القيمة</th>
                                    <th className="py-4 px-4 text-sm font-bold text-gray-700">التاريخ والوقت</th>
                                    <th className="py-4 px-4 text-sm font-bold text-gray-700">الفرع / المستخدم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-gray-500">
                                            <FileText className="w-20 h-20 mx-auto mb-4 text-gray-200" />
                                            <p className="text-xl font-bold">لا توجد شيكات مطابقة للبحث</p>
                                            <p className="text-sm mt-2">جرب تغيير إعدادات الفلترة أو تفريغ الفلاتر.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((rec) => (
                                        <tr key={rec.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                                                    {rec.checkNumber}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-gray-800">{rec.accountHolderName}</div>
                                                <div className="text-xs text-gray-500 font-mono">{rec.accountNumber}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-medium text-gray-700">{rec.beneficiaryName}</div>
                                                <div className="text-xs text-blue-500">{rec.checkType}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-indigo-700">
                                                    {rec.amountDinars}.{rec.amountDirhams} <span className="text-[10px] text-gray-400">د.ل</span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 truncate max-w-[150px]" title={rec.amountInWords}>
                                                    {rec.amountInWords}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-600 font-medium">
                                                {rec.createdAt ? formatDateMedium(rec.createdAt) : '--'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="text-sm font-bold text-gray-700">{rec.branchName || '-'}</div>
                                                <div className="text-xs text-gray-400">{rec.createdByName || '-'}</div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {total > filters.limit && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <p className="text-sm text-gray-600">
                                عرض {page * filters.limit + 1} إلى {Math.min((page + 1) * filters.limit, total)} من {total}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="btn btn-outline btn-sm disabled:opacity-50"
                                >
                                    السابق
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, Math.ceil(total / filters.limit)) }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${page === i ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={(page + 1) * filters.limit >= total}
                                    className="btn btn-outline btn-sm disabled:opacity-50"
                                >
                                    التالي
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
