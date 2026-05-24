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
  { name: 'Dashboard', href: '/dashboard', icon: Home },

  // Individual & Corporate Checks
  { name: 'Print Check', href: '/print', icon: Printer, permission: 'SCREEN_PRINT' },
  { name: 'Print Logs', href: '/print-logs', icon: ClipboardList, permission: 'SCREEN_PRINT_LOGS' },
  { name: 'Inventory', href: '/inventory', icon: Package, permission: 'INVENTORY_MANAGEMENT' },

  // Certified Checks
  { name: 'Print Certified Check', href: '/certified-print', icon: Printer, permission: 'SCREEN_CERTIFIED_PRINT' },
  { name: 'Certified Check Reports', href: '/certified-reports', icon: FileText, permission: 'SCREEN_CERTIFIED_REPORTS' },
  { name: 'Issue Certified Books', href: '/certified-checks', icon: Stamp, permission: 'SCREEN_CERTIFIED_BOOKS' },
  { name: 'Certified Books Log & Reports', href: '/certified-logs', icon: ClipboardList, permission: 'SCREEN_CERTIFIED_LOGS' },
  { name: 'Certified Checks Inventory', href: '/certified-inventory', icon: Package, permission: 'CERTIFIED_INVENTORY_MANAGEMENT' },

  // Administration & Reports
  { name: 'Users', href: '/users', icon: Users, permission: 'MANAGE_USERS' },
  { name: 'Branches', href: '/branches', icon: Building2, permission: 'MANAGE_BRANCHES' },
  { name: 'Reports', href: '/reports', icon: FileText, permission: 'SCREEN_REPORTS' },
  { name: 'Print Settings', href: '/settings', icon: Settings, permission: 'SYSTEM_SETTINGS' },
  { name: 'Certified Print Settings', href: '/certified-settings', icon: Settings, permission: 'SYSTEM_SETTINGS' },
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
    <div className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-white to-secondary-50 border-r border-gray-200 shadow-xl">
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
            <h1 className="text-lg font-bold text-gray-800">Check System</h1>
            <p className="text-xs text-primary-600 font-semibold">Andalus Bank</p>
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
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent border-t border-gray-200">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{user.username}</p>
                <p className="text-xs text-primary-600">
                  {user.isAdmin ? '👑 System Admin' : '👤 User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

