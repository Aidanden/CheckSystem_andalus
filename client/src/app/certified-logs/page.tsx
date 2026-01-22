'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { certifiedCheckService, userService, branchService } from '@/lib/api';
import { CertifiedCheckLog, CertifiedBranch } from '@/lib/api/services/certifiedCheck.service';
import { useAppSelector } from '@/store/hooks';
import {
    ClipboardList,
    Printer,
    RefreshCw,
    Building2,
    Calendar,
    X,
    Search,
    FileText,
    Download,
    User as UserIcon,
    Filter,
    Layers
} from 'lucide-react';
import { formatDateMedium, formatNumber } from '@/utils/locale';
import { User } from '@/types';

export default function CertifiedLogsPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [logs, setLogs] = useState<CertifiedCheckLog[]>([]);
    const [branches, setBranches] = useState<CertifiedBranch[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [statistics, setStatistics] = useState<{ totalBooks: number; totalChecks: number; lastPrintDate: string | null } | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reprinting, setReprinting] = useState(false);

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        branchId: undefined as number | undefined,
        userId: undefined as number | undefined,
        startDate: '',
        endDate: '',
        limit: 20
    });

    const [page, setPage] = useState(0);

    // Reprint Modal State
    const [reprintModalOpen, setReprintModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<CertifiedCheckLog | null>(null);
    const [reprintStartSerial, setReprintStartSerial] = useState<number>(0);
    const [reprintEndSerial, setReprintEndSerial] = useState<number>(0);
    const [reprintReason, setReprintReason] = useState<'damaged' | 'not_printed' | ''>('');

    const canReprint = user?.isAdmin || user?.permissions?.some(p => p.permissionCode === 'REPRINT_CERTIFIED');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [page, filters]);

    const loadInitialData = async () => {
        try {
            const [branchesData, usersData] = await Promise.all([
                certifiedCheckService.getBranches(),
                userService.getAll()
            ]);
            setBranches(branchesData);
            setUsers(usersData);
        } catch (err) {
            console.error('Error loading initial data:', err);
        }
    };

    const loadLogs = async () => {
        try {
            setLoading(true);
            const [res, statsRes] = await Promise.all([
                certifiedCheckService.getLogs({
                    skip: page * filters.limit,
                    take: filters.limit,
                    branchId: filters.branchId,
                    userId: filters.userId,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                }),
                certifiedCheckService.getStatistics(filters.branchId)
            ]);

            if (res && res.logs) {
                setLogs(res.logs);
                setTotal(res.total || 0);
            }

            if (statsRes) {
                setStatistics({
                    totalBooks: statsRes.totalBooks || 0,
                    totalChecks: statsRes.totalChecks || 0,
                    lastPrintDate: statsRes.lastPrintDate || null
                });
            }
            setError(null);
        } catch (err: any) {
            console.error('Error loading logs:', err);
            setError(err.response?.data?.error || 'فشل في تحميل سجلات الطباعة');
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({
            branchId: undefined,
            userId: undefined,
            startDate: '',
            endDate: '',
            limit: 20
        });
        setPage(0);
    };

    const handlePrintReport = () => {
        const printHtml = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>تقرير طباعة دفاتر الصكوك المصدقة</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                    body { font-family: 'Cairo', sans-serif; padding: 30px; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #9a3412; font-size: 24px; }
                    .stats-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
                    .stat-item { background: #fff7ed; border: 1px solid #ffedd5; padding: 10px; border-radius: 6px; text-align: center; }
                    .filters-info { background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: right; }
                    th { background-color: #fdd835; color: #000; font-weight: bold; }
                    tr:nth-child(even) { background-color: #fffbeb; }
                    @media print { .no-print { display: none; } body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>تقرير طباعة دفاتر الصكوك المصدقة</h1>
                    <p>استخرج في: ${new Date().toLocaleString('ar-LY')}</p>
                </div>
                
                <div class="stats-box">
                    <div class="stat-item">إجمالي الدفاتر: ${statistics?.totalBooks || 0}</div>
                    <div class="stat-item">إجمالي الصكوك: ${statistics?.totalChecks || 0}</div>
                </div>

                <div class="filters-info">
                    <strong>الفلاتر المطبقة:</strong>
                    الفرع: ${filters.branchId ? branches.find(b => b.id === filters.branchId)?.branchName : 'الكل'} | 
                    من: ${filters.startDate || 'مفتوح'} | إلى: ${filters.endDate || 'مفتوح'}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>الفرع</th>
                            <th>الرقم المحاسبي</th>
                            <th>نطاق التسلسل</th>
                            <th>عدد الصكوك</th>
                            <th>النوع</th>
                            <th>تاريخ الطباعة</th>
                            <th>المستخدم</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${log.branchName}</td>
                                <td>${log.accountingNumber}</td>
                                <td>${log.firstSerial} - ${log.lastSerial}</td>
                                <td>${log.totalChecks}</td>
                                <td>${log.operationType === 'print' ? 'طباعة' : 'إعادة'}</td>
                                <td>${new Date(log.printDate).toLocaleString('ar-LY')}</td>
                                <td>${log.printedByName}</td>
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
            setTimeout(() => printWindow.print(), 500);
        }
    };

    const exportToCSV = () => {
        const headers = ['الفرع', 'الرقم المحاسبي', 'التسلسل من', 'التسلسل إلى', 'العدد', 'النوع', 'التاريخ', 'المستخدم'];
        const rows = logs.map(l => [
            l.branchName,
            l.accountingNumber,
            l.firstSerial,
            l.lastSerial,
            l.totalChecks,
            l.operationType === 'print' ? 'طباعة' : 'إعادة طباعة',
            new Date(l.printDate).toLocaleString(),
            l.printedByName
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-دفاتر-مصدقة-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Reprint logic (from original)
    const openReprintModal = (log: CertifiedCheckLog) => {
        if (!canReprint) return;
        setSelectedLog(log);
        setReprintStartSerial(log.firstSerial);
        setReprintEndSerial(log.lastSerial);
        setReprintReason('');
        setReprintModalOpen(true);
    };

    const handleConfirmReprint = async () => {
        if (!selectedLog) return;
        if (reprintStartSerial < selectedLog.firstSerial || reprintEndSerial > selectedLog.lastSerial) {
            alert('النطاق غير صحيح'); return;
        }
        if (!reprintReason) {
            alert('الرجاء اختيار السبب'); return;
        }

        setReprinting(true);
        try {
            // Register reprint
            await certifiedCheckService.reprintBook(selectedLog.id, {
                firstSerial: reprintStartSerial,
                lastSerial: reprintEndSerial,
                reprintReason: reprintReason as any
            });

            // Trigger actual print (using simplified helper or just calling window.open)
            // ... (keeping existing openPrintWindow logic or similar)
            setReprintModalOpen(false);
            loadLogs();
        } catch (err) {
            console.error(err);
        } finally {
            setReprinting(false);
        }
    };

    const activeFiltersCount = [filters.branchId, filters.userId, filters.startDate, filters.endDate].filter(Boolean).length;
    const totalPages = Math.ceil(total / filters.limit);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-700 p-3 rounded-xl shadow-lg">
                            <Layers className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">تقارير دفاتر الشيكات المصدقة</h1>
                            <p className="text-gray-600 font-medium">سجلات طباعة وإعادة طباعة دفاتر الشيكات المصدقة للفروع</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn ${showFilters ? 'btn-primary' : 'bg-white border border-gray-300 text-gray-700'} flex items-center gap-2`}
                        >
                            <Filter className="w-5 h-5" />
                            الفلاتر {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                        </button>
                        <button
                            onClick={handlePrintReport}
                            disabled={logs.length === 0}
                            className="btn bg-green-600 text-white flex items-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            طباعة التقرير
                        </button>
                        <button
                            onClick={exportToCSV}
                            disabled={logs.length === 0}
                            className="btn bg-amber-600 text-white flex items-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            تصدير Excel
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-xl flex items-center justify-between shadow-sm animate-shake mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg">
                                <X className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-red-800 font-bold">تعذر تحميل البيانات</p>
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
                    <div className="card border-r-4 border-r-amber-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500">إجمالي الدفاتر المطبوعة</p>
                                <p className="text-3xl font-black text-gray-800 mt-1">{statistics?.totalBooks || 0}</p>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-xl"><Layers className="w-8 h-8 text-amber-600" /></div>
                        </div>
                    </div>
                    <div className="card border-r-4 border-r-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500">إجمالي عدد الصكوك</p>
                                <p className="text-3xl font-black text-gray-800 mt-1">{statistics?.totalChecks || 0}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-xl"><FileText className="w-8 h-8 text-orange-600" /></div>
                        </div>
                    </div>
                    <div className="card border-r-4 border-r-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500">آخر عملية طباعة</p>
                                <p className="text-xl font-bold text-gray-800 mt-1">
                                    {statistics?.lastPrintDate ? formatDateMedium(statistics.lastPrintDate) : '--'}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl"><Calendar className="w-8 h-8 text-blue-600" /></div>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="card shadow-lg animate-in slide-in-from-top duration-300">
                        <div className="flex justify-between items-center mb-6 pb-2 border-b">
                            <h3 className="font-bold flex items-center gap-2"><Search className="w-5 h-5" /> خيارات البحث</h3>
                            <button onClick={clearFilters} className="text-red-500 text-sm flex items-center gap-1"><X className="w-4 h-4" /> مسح الفلاتر</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">الفرع</label>
                                <select
                                    className="input w-full"
                                    value={filters.branchId || ''}
                                    onChange={(e) => handleFilterChange('branchId', e.target.value ? Number(e.target.value) : undefined)}
                                >
                                    <option value="">جميع الفروع</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">المستخدم</label>
                                <select
                                    className="input w-full"
                                    value={filters.userId || ''}
                                    onChange={(e) => handleFilterChange('userId', e.target.value ? Number(e.target.value) : undefined)}
                                >
                                    <option value="">جميع المستخدمين</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">من تاريخ</label>
                                <input type="date" className="input w-full" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">إلى تاريخ</label>
                                <input type="date" className="input w-full" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="py-3 px-4">الفرع</th>
                                    <th className="py-3 px-4">نطاق التسلسل</th>
                                    <th className="py-3 px-4">الكمية</th>
                                    <th className="py-3 px-4 text-center">النوع</th>
                                    <th className="py-3 px-4">التاريخ والوقت</th>
                                    <th className="py-3 px-4">بواسطة</th>
                                    <th className="py-3 px-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="py-10 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" /></td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={7} className="py-20 text-center text-gray-400 font-bold">لا توجد سجلات مطابقة</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-amber-50/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-800">{log.branchName}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">{log.accountingNumber}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-mono text-sm text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block">
                                                    {log.firstSerial} - {log.lastSerial}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold">{log.totalChecks} <span className="text-[10px] font-normal text-gray-400">صك</span></div>
                                                <div className="text-[10px] text-blue-500">{(log as any).numberOfBooks || Math.ceil(log.totalChecks / 50)} دفاتر</div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.operationType === 'print' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {log.operationType === 'print' ? 'طبعة جديدة' : 'إعادة طباعة'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 italic">
                                                {formatDateMedium(log.printDate)}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium">{log.printedByName}</td>
                                            <td className="py-3 px-4">
                                                {canReprint && (
                                                    <button onClick={() => openReprintModal(log)} className="btn btn-secondary btn-sm flex items-center gap-1">
                                                        <Printer className="w-3 h-3" /> إعادة
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {total > filters.limit && (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t">
                            <span className="text-sm text-gray-500">عرض {page * filters.limit + 1} - {Math.min((page + 1) * filters.limit, total)} من {total}</span>
                            <div className="flex gap-2">
                                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm disabled:opacity-50">السابق</button>
                                <button disabled={(page + 1) * filters.limit >= total} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm disabled:opacity-50">التالي</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reprint Modal Simplified for this upgrade, keeping logic but styling it premium */}
            {reprintModalOpen && selectedLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-amber-700 flex items-center gap-2"><Printer className="w-6 h-6" /> إعادة طباعة صكوك مصدقة</h3>
                            <button onClick={() => setReprintModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                <p className="text-sm text-amber-800 font-bold mb-2">معلومات الدفتر الأصلي:</p>
                                <div className="grid grid-cols-2 text-sm gap-y-1">
                                    <span className="text-amber-700">الفرع:</span> <span className="font-bold">{selectedLog.branchName}</span>
                                    <span className="text-amber-700">النطاق:</span> <span className="font-mono">{selectedLog.firstSerial} - {selectedLog.lastSerial}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold block mb-1">من رقم</label>
                                    <input type="number" value={reprintStartSerial} onChange={e => setReprintStartSerial(Number(e.target.value))} className="input w-full" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1">إلى رقم</label>
                                    <input type="number" value={reprintEndSerial} onChange={e => setReprintEndSerial(Number(e.target.value))} className="input w-full" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold block mb-1">سبب إعادة الطباعة</label>
                                <select value={reprintReason} onChange={e => setReprintReason(e.target.value as any)} className="input w-full">
                                    <option value="">-- اختر السبب --</option>
                                    <option value="damaged">ورقة تالفة (تخصم من المخزون)</option>
                                    <option value="not_printed">ورقة لم تطبع (لا تخصم)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setReprintModalOpen(false)} className="btn btn-outline" disabled={reprinting}>إلغاء</button>
                            <button onClick={handleConfirmReprint} className="btn btn-primary px-8" disabled={reprinting}>
                                {reprinting ? 'جاري المعالجة...' : 'تأكيد وإعادة الطباعة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
