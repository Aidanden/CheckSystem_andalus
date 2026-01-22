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

const navigation = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: Home },

  // شيكات الأفراد والشركات
  { name: 'طباعة شيك', href: '/print', icon: Printer, permission: 'SCREEN_PRINT' },
  { name: 'سجلات الطباعة', href: '/print-logs', icon: ClipboardList, permission: 'SCREEN_PRINT_LOGS' },
  { name: 'المخزون', href: '/inventory', icon: Package, permission: 'INVENTORY_MANAGEMENT' },

  // الشيكات المصدقة
  { name: 'طباعة شيك مصدق', href: '/certified-print', icon: Printer, permission: 'SCREEN_CERTIFIED_PRINT' },
  { name: 'تقارير الشيك المصدقة', href: '/certified-reports', icon: FileText, permission: 'SCREEN_CERTIFIED_REPORTS' },
  { name: 'إصدار دفاتر مصدقة', href: '/certified-checks', icon: Stamp, permission: 'SCREEN_CERTIFIED_BOOKS' },
  { name: 'سجل و تقارير دفاتر المصدقة', href: '/certified-logs', icon: ClipboardList, permission: 'SCREEN_CERTIFIED_LOGS' },
  { name: 'مخزن الشيكات المصدقة', href: '/certified-inventory', icon: Package, permission: 'CERTIFIED_INVENTORY_MANAGEMENT' },

  // الإدارة والتقارير
  { name: 'المستخدمين', href: '/users', icon: Users, permission: 'MANAGE_USERS' },
  { name: 'الفروع', href: '/branches', icon: Building2, permission: 'MANAGE_BRANCHES' },
  { name: 'التقارير', href: '/reports', icon: FileText, permission: 'SCREEN_REPORTS' },
  { name: 'إعدادات الطباعة', href: '/settings', icon: Settings, permission: 'SYSTEM_SETTINGS' },
  { name: 'إعدادات طباعة شيك مصدق', href: '/certified-settings', icon: Settings, permission: 'SYSTEM_SETTINGS' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);

  const filteredNavigation = useMemo(() => {
    if (!user) return [];

    return navigation.filter((item) => {
      // Dashboard is always visible
      if (item.href === '/dashboard') return true;

      // Admin sees everything
      if (user.isAdmin) return true;

      // Check permissions for other users
      if (item.permission) {
        // Safe check for permissions array
        const userPermissions = user.permissions || [];
        return userPermissions.some(p => p.permissionCode === item.permission);
      }

      // If no permission requirement, show it
      return true;
    });
  }, [user]);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-72 bg-gradient-to-b from-white to-secondary-50 border-l border-gray-200 shadow-xl">
      {/* Header with Logo */}
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
            <h1 className="text-lg font-bold text-gray-800">نظام الشيكات</h1>
            <p className="text-xs text-primary-600 font-semibold">مصرف الاندلس</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className="absolute bottom-0 right-0 left-0 p-4 bg-gradient-to-t from-white to-transparent border-t border-gray-200">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{user.username}</p>
                <p className="text-xs text-primary-600">
                  {user.isAdmin ? '👑 مسؤول النظام' : '👤 مستخدم'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

