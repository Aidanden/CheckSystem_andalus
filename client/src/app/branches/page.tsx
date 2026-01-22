'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { branchService } from '@/lib/api';
import { Branch, CreateBranchRequest } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { Building2, Plus, Edit2, Trash2, Lock } from 'lucide-react';
import { SECURITY_CONFIG } from '@/config/security.config';
import Image from 'next/image';

export default function BranchesPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState<CreateBranchRequest>({
    branch_name: '',
    branch_location: '',
    routing_number: '',
    branch_number: '',
    accounting_number: '',
  });

  // Handle permissions and data loading
  useEffect(() => {
    if (!currentUser) return;

    if (!currentUser.isAdmin) {
      alert('ليس لديك صلاحية الوصول لهذه الصفحة');
      window.location.href = '/dashboard';
      return;
    }

    if (isUnlocked) {
      loadBranches();
    }
  }, [currentUser, isUnlocked]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SECURITY_CONFIG.BRANCHES_PAGE_PASSWORD) {
      setIsUnlocked(true);
      setPasswordError('');
      setPassword('');
    } else {
      setPasswordError('كلمة المرور غير صحيحة');
      setPassword('');
    }
  };

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await branchService.getAll();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBranch) {
        await branchService.update(editingBranch.id, formData);
      } else {
        await branchService.create(formData);
      }

      setShowModal(false);
      setEditingBranch(null);
      setFormData({
        branch_name: '',
        branch_location: '',
        routing_number: '',
        branch_number: '',
        accounting_number: '',
      });
      loadBranches();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل في حفظ الفرع');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      branch_name: branch.branchName,
      branch_location: branch.branchLocation,
      routing_number: branch.routingNumber,
      branch_number: branch.branchNumber || '',
      accounting_number: branch.accountingNumber || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (branchId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;

    try {
      await branchService.delete(branchId);
      loadBranches();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل في حذف الفرع');
    }
  };

  // شاشة إدخال كلمة المرور
  // شاشة إدخال كلمة المرور
  if (!isUnlocked) {
    return (
      <DashboardLayout>
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Header with M.T.C Logo */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg ring-1 ring-gray-100 w-24 h-24 flex items-center justify-center">
                  <span className="text-3xl font-black text-white tracking-tighter">M.T.C</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                إدارة الفروع
              </h2>
              <p className="text-primary-600 font-semibold mb-4">
                منطقة محمية
              </p>
              <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-secondary-400 mx-auto rounded-full"></div>
            </div>

            {/* Lock Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-secondary-400 to-primary-500"></div>

              <div className="flex flex-col items-center mb-6">
                <div className="bg-primary-50 p-3 rounded-full mb-4 ring-4 ring-primary-50/50">
                  <Lock className="w-8 h-8 text-primary-600" />
                </div>
                <p className="text-gray-600 text-center text-sm">
                  يرجى إدخال كلمة المرور للوصول إلى إعدادات الفروع
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center tracking-widest"
                    placeholder="••••••"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-600 font-medium flex items-center justify-center gap-1">
                      <span>⚠️</span> {passwordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  فتح القفل
                </button>
              </form>
            </div>

            <div className="text-center mt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
                <p className="text-blue-800 font-medium mb-2">
                  يجب الاتصال بالشركة المطورة لإضافة فروع جديدة
                </p>
                <div className="flex flex-col gap-1 text-blue-600 dir-ltr">
                  <span className="font-mono font-bold">0925232731</span>
                  <span className="font-mono font-bold">0915730097</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">نظام طباعة الشيكات المصرفية الآمن</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleLock = () => {
    setIsUnlocked(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">إدارة الفروع</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLock}
              className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center gap-2"
              title="قفل الصفحة"
            >
              <Lock className="w-5 h-5" />
              قفل
            </button>
            <button
              onClick={() => {
                setEditingBranch(null);
                setFormData({
                  branch_name: '',
                  branch_location: '',
                  routing_number: '',
                  branch_number: '',
                  accounting_number: '',
                });
                setShowModal(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة فرع
            </button>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {branch.branchName}
                    </h3>
                    <p className="text-sm text-gray-500">{branch.branchLocation}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-500">رقم التوجيه</p>
                  <p className="font-mono font-semibold text-gray-800">
                    {branch.routingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">رقم الفرع</p>
                  <p className="font-mono font-semibold text-gray-800">
                    {branch.branchNumber || 'غير محدد'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">الرقم المحاسبي</p>
                  <p className="font-mono font-semibold text-gray-800">
                    {branch.accountingNumber || 'غير محدد'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(branch)}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="flex-1 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg px-4 py-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {branches.length === 0 && (
          <div className="card text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد فروع حتى الآن</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 btn btn-primary"
            >
              إضافة فرع جديد
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingBranch ? 'تعديل فرع' : 'إضافة فرع جديد'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الفرع
                </label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_name: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموقع
                </label>
                <input
                  type="text"
                  value={formData.branch_location}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_location: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم التوجيه (Routing Number)
                </label>
                <input
                  type="text"
                  value={formData.routing_number}
                  onChange={(e) =>
                    setFormData({ ...formData, routing_number: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الفرع
                </label>
                <input
                  type="text"
                  value={formData.branch_number}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_number: e.target.value })
                  }
                  className="input"
                  placeholder="مثال: 123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرقم المحاسبي
                </label>
                <input
                  type="text"
                  value={formData.accounting_number}
                  onChange={(e) =>
                    setFormData({ ...formData, accounting_number: e.target.value })
                  }
                  className="input"
                  placeholder="مثال: 001-2024"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn btn-primary">
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBranch(null);
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

