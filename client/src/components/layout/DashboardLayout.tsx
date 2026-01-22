'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCurrentUser } from '@/store/slices/authSlice';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, token, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [token, user, router, dispatch]);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-secondary-50">
      <Sidebar />
      <div className="mr-72">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

