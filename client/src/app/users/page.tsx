'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userService, branchService } from '@/lib/api';
import { User, Branch, Permission, CreateUserRequest } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    branch_id: undefined,
    is_admin: false,
    permission_ids: [],
  });

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      alert('ليس لديك صلاحية الوصول لهذه الصفحة');
      window.location.href = '/dashboard';
      return;
    }
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, branchesData, permsData] = await Promise.all([
        userService.getAll(),
        branchService.getAll(),
        userService.getPermissions(),
      ]);
      setUsers(usersData);
      setBranches(branchesData);
      setPermissions(permsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.is_admin && !formData.branch_id) {
        alert('يجب اختيار فرع للمستخدم العادي');
        return;
      }

      if (editingUser) {
        await userService.update(editingUser.id, {
          username: formData.username,
          password: formData.password || undefined,
          branch_id: formData.branch_id,
          is_admin: formData.is_admin,
          permission_ids: formData.permission_ids,
        });
      } else {
        await userService.create(formData);
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        branch_id: undefined,
        is_admin: false,
        permission_ids: [],
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل في حفظ المستخدم');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      branch_id: user.branchId,
      is_admin: user.isAdmin,
      permission_ids: user.permissions.map((p) => p.id),
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await userService.delete(userId);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل في حذف المستخدم');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                username: '',
                password: '',
                branch_id: undefined,
                is_admin: false,
                permission_ids: [],
              });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            إضافة مستخدم
          </button>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    اسم المستخدم
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    الفرع
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    الصلاحيات
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    النوع
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    الحالة
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium">{user.username}</td>
                    <td className="py-3 px-4 text-sm">
                      {user.branch?.branchName || 'غير محدد'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.slice(0, 2).map((perm) => (
                          <span
                            key={perm.id}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {perm.permissionName}
                          </span>
                        ))}
                        {user.permissions.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{user.permissions.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${user.isAdmin
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {user.isAdmin ? 'مسؤول' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {user.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="card max-w-2xl w-full mx-4 my-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور {editingUser && '(اتركه فارغاً إذا لم ترد تغييره)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفرع
                </label>
                <select
                  value={formData.branch_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branch_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="input"
                  required={!formData.is_admin}
                >
                  {formData.is_admin && <option value="">بدون فرع (صلاحية كاملة)</option>}
                  {!formData.is_admin && <option value="" disabled>اختر الفرع...</option>}
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={formData.is_admin}
                  onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
                  مسؤول (صلاحيات كاملة)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 border-b pb-2">
                  الصلاحيات حسب المجموعات
                </label>
                <div className="space-y-6 max-h-[400px] overflow-y-auto p-2 pr-4 border rounded-xl bg-gray-50/30">
                  {[
                    {
                      name: 'طباعة الشيك المصدق (أفراد)',
                      codes: ['SCREEN_CERTIFIED_PRINT', 'SCREEN_CERTIFIED_REPORTS', 'REPRINT_CERTIFIED']
                    },
                    {
                      name: 'طباعة دفاتر المصدقة',
                      codes: ['SCREEN_CERTIFIED_BOOKS', 'SCREEN_CERTIFIED_LOGS', 'CERTIFIED_INVENTORY_MANAGEMENT']
                    },
                    {
                      name: 'شيكات الأفراد والشركات',
                      codes: ['SCREEN_PRINT', 'SCREEN_PRINT_LOGS', 'INVENTORY_MANAGEMENT', 'REPRINT']
                    },
                    {
                      name: 'إدارة النظام والتقارير العامة',
                      codes: ['MANAGE_USERS', 'MANAGE_BRANCHES', 'SYSTEM_SETTINGS', 'SCREEN_REPORTS']
                    }
                  ].map((group) => (
                    <div key={group.name} className="space-y-2">
                      <h3 className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded inline-block">
                        {group.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions
                          .filter(p => group.codes.includes(p.permissionCode))
                          .map((perm) => (
                            <label key={perm.id} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg transition-all group">
                              <input
                                type="checkbox"
                                checked={formData.permission_ids.includes(perm.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      permission_ids: [...formData.permission_ids, perm.id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      permission_ids: formData.permission_ids.filter(
                                        (id) => id !== perm.id
                                      ),
                                    });
                                  }
                                }}
                                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <div>
                                <span className="text-sm font-semibold block text-gray-800 group-hover:text-primary-700">{perm.permissionName}</span>
                                {perm.description && (
                                  <span className="text-[10px] text-gray-500 block leading-tight">{perm.description}</span>
                                )}
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn btn-primary">
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
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

