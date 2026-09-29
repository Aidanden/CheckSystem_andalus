'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printingService, inventoryService } from '@/lib/api';
import { PrintStatistics, PrintOperation, Inventory } from '@/types';
import { FileText, TrendingUp, Clock, AlertTriangle, Package, CheckCircle2 } from 'lucide-react';
import { formatDateShort } from '@/utils/locale';
import { useTranslation } from '@/i18n/I18nProvider';

type StockLevel = 'ok' | 'medium' | 'low' | 'empty';

function getStockLevel(stockType: number, quantity: number): StockLevel {
  if (quantity <= 0) return 'empty';
  if (stockType === 3) {
    if (quantity > 500) return 'ok';
    if (quantity > 100) return 'medium';
    return 'low';
  }
  if (quantity > 100) return 'ok';
  if (quantity > 50) return 'medium';
  return 'low';
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState<PrintStatistics | null>(null);
  const [recentOperations, setRecentOperations] = useState<PrintOperation[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResult, opsResult, invResult] = await Promise.allSettled([
        printingService.getStatistics(),
        printingService.getHistory({ limit: 5 }),
        inventoryService.getAll(),
      ]);

      if (statsResult.status === 'fulfilled') {
        setStatistics(statsResult.value);
      } else {
        console.error('Failed to load statistics:', statsResult.reason);
      }

      if (opsResult.status === 'fulfilled') {
        setRecentOperations(opsResult.value);
      } else {
        console.error('Failed to load recent operations:', opsResult.reason);
      }

      if (invResult.status === 'fulfilled') {
        setInventory(invResult.value);
      } else {
        console.error('Failed to load inventory:', invResult.reason);
      }
    } catch (error) {
      console.error('Unexpected error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stockLabel = (stockType: number) => {
    if (stockType === 1) return t('dashboard.stockTypeIndividual');
    if (stockType === 2) return t('dashboard.stockTypeCorporate');
    return t('dashboard.stockTypeCertified');
  };

  const levelLabel = (level: StockLevel) => {
    if (level === 'ok') return t('dashboard.stockLevelOk');
    if (level === 'medium') return t('dashboard.stockLevelMedium');
    if (level === 'low') return t('dashboard.stockLevelLow');
    return t('dashboard.stockLevelEmpty');
  };

  const levelStyles = (level: StockLevel) => {
    if (level === 'ok') return 'border-emerald-300 bg-emerald-50 text-emerald-800';
    if (level === 'medium') return 'border-amber-300 bg-amber-50 text-amber-900';
    if (level === 'low') return 'border-orange-400 bg-orange-50 text-orange-900';
    return 'border-red-400 bg-red-50 text-red-900';
  };

  const alerts = inventory
    .map((item) => ({
      ...item,
      level: getStockLevel(item.stockType, item.quantity),
    }))
    .filter((item) => item.level !== 'ok');

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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('dashboard.title')}</h1>
            <p className="text-gray-600">{t('dashboard.subtitle')}</p>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${alerts.length > 0 ? 'bg-orange-100' : 'bg-emerald-100'}`}>
                {alerts.length > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">{t('dashboard.inventoryAlerts')}</h2>
            </div>
            <Link
              href="/inventory"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              {t('dashboard.goToInventory')}
            </Link>
          </div>

          {alerts.length === 0 ? (
            <p className="text-emerald-700 font-medium">{t('dashboard.inventoryOk')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alerts.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border-2 p-4 ${levelStyles(item.level)}`}
                >
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{stockLabel(item.stockType)}</p>
                      <p className="text-sm mt-1">
                        {t('dashboard.availableSheets', { count: item.quantity })}
                      </p>
                      <p className="text-sm font-semibold mt-2">{levelLabel(item.level)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-s-4 border-primary-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('dashboard.totalOperations')}</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.total_operations || 0}
                </p>
              </div>
              <div className="bg-primary-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-s-4 border-emerald-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('dashboard.sheetsPrinted')}</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.total_sheets_printed || 0}
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-s-4 border-blue-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('dashboard.corporate50')}</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.corporate_50 || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-s-4 border-amber-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('dashboard.individual25')}</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.individual_25 || 0}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-s-4 border-purple-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('dashboard.employees10')}</p>
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

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t('dashboard.recentOperations')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-start py-4 px-4 text-sm font-bold text-gray-700">
                    {t('dashboard.accountNumber')}
                  </th>
                  <th className="text-start py-4 px-4 text-sm font-bold text-gray-700">
                    {t('dashboard.type')}
                  </th>
                  <th className="text-start py-4 px-4 text-sm font-bold text-gray-700">
                    {t('dashboard.sheets')}
                  </th>
                  <th className="text-start py-4 px-4 text-sm font-bold text-gray-700">
                    {t('dashboard.date')}
                  </th>
                  <th className="text-start py-4 px-4 text-sm font-bold text-gray-700">
                    {t('dashboard.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOperations.length > 0 ? (
                  recentOperations.map((op) => (
                    <tr key={op.id} className="border-b border-gray-100 hover:bg-primary-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-gray-800">{op.accountNumber}</td>
                      <td className="py-4 px-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-lg font-semibold ${
                            op.accountType === 1
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {op.accountType === 1 ? t('dashboard.individual') : t('dashboard.corporate')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-primary-600">{op.sheetsPrinted}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDateShort(op.printDate)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="badge badge-success">{op.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-semibold">{t('dashboard.noOperations')}</p>
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
