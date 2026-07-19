'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Image from 'next/image';
import {
  Home,
  Printer,
  Package,
  Users,
  Building2,
  FileText,
  Settings,
  ClipboardList,
  Stamp,
} from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/I18nProvider';

const navigation: {
  nameKey: TranslationKey;
  href: string;
  icon: typeof Home;
  permission?: string;
}[] = [
  { nameKey: 'nav.dashboard', href: '/dashboard', icon: Home },
  { nameKey: 'nav.printCheck', href: '/print', icon: Printer, permission: 'SCREEN_PRINT' },
  { nameKey: 'nav.printLogs', href: '/print-logs', icon: ClipboardList, permission: 'SCREEN_PRINT_LOGS' },
  { nameKey: 'nav.inventory', href: '/inventory', icon: Package, permission: 'INVENTORY_MANAGEMENT' },
  { nameKey: 'nav.printCertified', href: '/certified-print', icon: Printer, permission: 'SCREEN_CERTIFIED_PRINT' },
  { nameKey: 'nav.certifiedReports', href: '/certified-reports', icon: FileText, permission: 'SCREEN_CERTIFIED_REPORTS' },
  { nameKey: 'nav.issueCertifiedBooks', href: '/certified-checks', icon: Stamp, permission: 'SCREEN_CERTIFIED_BOOKS' },
  { nameKey: 'nav.certifiedLogs', href: '/certified-logs', icon: ClipboardList, permission: 'SCREEN_CERTIFIED_LOGS' },
  { nameKey: 'nav.certifiedInventory', href: '/certified-inventory', icon: Package, permission: 'CERTIFIED_INVENTORY_MANAGEMENT' },
  { nameKey: 'nav.users', href: '/users', icon: Users, permission: 'MANAGE_USERS' },
  { nameKey: 'nav.branches', href: '/branches', icon: Building2, permission: 'MANAGE_BRANCHES' },
  { nameKey: 'nav.reports', href: '/reports', icon: FileText, permission: 'SCREEN_REPORTS' },
  { nameKey: 'nav.printSettings', href: '/settings', icon: Settings, permission: 'SYSTEM_SETTINGS' },
  { nameKey: 'nav.certifiedPrintSettings', href: '/certified-settings', icon: Settings, permission: 'SYSTEM_SETTINGS' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();

  const filteredNavigation = useMemo(() => {
    if (!user) return [];

    return navigation.filter((item) => {
      if (item.href === '/dashboard') return true;
      if (user.isAdmin) return true;
      if (item.permission) {
        const userPermissions = user.permissions || [];
        return userPermissions.some((p) => p.permissionCode === item.permission);
      }
      return true;
    });
  }, [user]);

  return (
    <div className="fixed start-0 top-0 bottom-0 w-72 bg-gradient-to-b from-white to-secondary-50 border-e border-gray-200 shadow-xl z-30">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl shadow-md">
            <Image
              src="/images/1.png"
              alt="Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">{t('brand.name')}</h1>
            <p className="text-xs text-primary-600 font-semibold">{t('brand.bank')}</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const label = t(item.nameKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:bg-white hover:shadow-md'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="font-semibold text-sm leading-snug">{label}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="absolute bottom-0 start-0 end-0 p-4 bg-gradient-to-t from-white to-transparent border-t border-gray-200">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{user.username}</p>
                <p className="text-xs text-primary-600">
                  {user.isAdmin ? t('header.admin') : t('header.user')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
