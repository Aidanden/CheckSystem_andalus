'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printingService } from '@/lib/api';
import { PrintStatistics, PrintOperation } from '@/types';
import { FileText, TrendingUp, Clock } from 'lucide-react';
import { formatDateShort, formatNumber } from '@/utils/locale';

export default function DashboardPage() {
  const [statistics, setStatistics] = useState<PrintStatistics | null>(null);
  const [recentOperations, setRecentOperations] = useState<PrintOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load data in parallel but handle failures independently
      const [statsResult, opsResult] = await Promise.allSettled([
        printingService.getStatistics(),
        printingService.getHistory({ limit: 5 }),
      ]);

      // Process Statistics Result
      if (statsResult.status === 'fulfilled') {
        setStatistics(statsResult.value);
      } else {
        console.error('Failed to load statistics:', statsResult.reason);
      }

      // Process Recent Operations Result
      if (opsResult.status === 'fulfilled') {
        setRecentOperations(opsResult.value);
      } else {
        console.error('Failed to load recent operations:', opsResult.reason);
      }
    } catch (error) {
      console.error('Unexpected error loading dashboard data:', error);
    } finally {
      setLoading(false);
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">لوحة التحكم</h1>
            <p className="text-gray-600">نظرة عامة على نظام طباعة الشيكات</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-primary-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي العمليات</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.total_operations || 0}
                </p>
              </div>
              <div className="bg-primary-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-emerald-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">أوراق مطبوعة</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.total_sheets_printed || 0}
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-blue-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">شركات (50)</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.corporate_50 || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-amber-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">أفراد (25)</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.individual_25 || 0}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-purple-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">موظفين (10)</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.employees_10 || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Operations */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">آخر العمليات</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    رقم الحساب
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    النوع
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    الأوراق
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    التاريخ
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOperations.length > 0 ? (
                  recentOperations.map((op) => (
                    <tr key={op.id} className="border-b border-gray-100 hover:bg-primary-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-gray-800">{op.accountNumber}</td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`px-3 py-1 rounded-lg font-semibold ${op.accountType === 1
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                          }`}>
                          {op.accountType === 1 ? 'فردي' : 'شركة'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-primary-600">{op.sheetsPrinted}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDateShort(op.printDate)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="badge badge-success">
                          {op.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-semibold">لا توجد عمليات حتى الآن</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

