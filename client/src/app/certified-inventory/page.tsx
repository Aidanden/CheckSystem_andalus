'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { inventoryService } from '@/lib/api';
import { Inventory, InventoryTransaction } from '@/types';
import { Package, Plus, Minus, History, TrendingUp, TrendingDown, Stamp } from 'lucide-react';
import { formatDateShort, formatNumber } from '@/utils/locale';

export default function CertifiedInventoryPage() {
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({
        stock_type: 3 as 1 | 2 | 3,
        quantity: 0,
        serial_from: '',
        serial_to: '',
        notes: '',
    });

    useEffect(() => {
        loadInventoryData();
    }, []);

    const loadInventoryData = async () => {
        try {
            setLoading(true);
            const [inv, trans] = await Promise.all([
                inventoryService.getAll(),
                inventoryService.getTransactionHistory(3, 20),
            ]);
            // Filter inventory to only show certified (stockType === 3)
            setInventory(inv.filter(item => item.stockType === 3));
            setTransactions(trans);
        } catch (error) {
            console.error('Failed to load inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await inventoryService.addStock(addForm);
            setShowAddModal(false);
            setAddForm({
                stock_type: 3,
                quantity: 0,
                serial_from: '',
                serial_to: '',
                notes: '',
            });
            loadInventoryData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'فشل في إضافة المخزون');
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
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                            <Stamp className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">إدارة مخزون الصكوك المصدقة</h1>
                            <p className="text-gray-600">إدارة الأوراق والكميات المتاحة للصكوك المصدقة</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        إضافة مخزون
                    </button>
                </div>

                {/* Inventory Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventory.length > 0 ? (
                        inventory.map((item) => (
                            <div key={item.id} className="card border-2 border-amber-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        مخزون الصكوك المصدقة
                                    </h3>
                                    <Package className="w-8 h-8 text-amber-500" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">الأوراق المتاحة:</span>
                                        <span className="text-3xl font-bold text-gray-800">
                                            {item.quantity}
                                        </span>
                                    </div>

                                    <div
                                        className={`mt-4 px-4 py-2 rounded-lg text-center font-medium ${item.quantity > 500
                                            ? 'bg-green-100 text-green-700'
                                            : item.quantity > 100
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {item.quantity > 500
                                            ? 'المخزون جيد'
                                            : item.quantity > 100
                                                ? 'المخزون متوسط'
                                                : 'المخزون منخفض - يرجى إضافة مخزون'}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-gray-500">
                            <Package className="w-12 h-12 mb-2 opacity-20" />
                            <p>لا يوجد سجل مخزون لهذا النوع</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-4 text-blue-600 hover:underline"
                            >
                                إنشاء سجل مخزون الآن
                            </button>
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            سجل حركة مخزون الصكوك المصدقة
                        </h2>
                        <History className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                        العملية
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                        الكمية
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                        التاريخ
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                        ملاحظات
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? (
                                    transactions.map((trans) => (
                                        <tr key={trans.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`flex items-center gap-1 text-sm ${trans.transactionType === 'ADD'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                        }`}
                                                >
                                                    {trans.transactionType === 'ADD' ? (
                                                        <TrendingUp className="w-4 h-4" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4" />
                                                    )}
                                                    {trans.transactionType === 'ADD' ? 'إضافة' : 'خصم/طباعة'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm font-mono font-bold">
                                                {trans.transactionType === 'ADD' ? '+' : '-'}{trans.quantity}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {new Date(trans.createdAt).toLocaleDateString('ar-LY', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {trans.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500">
                                            لا يوجد سجل حركات حتى الآن
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Stock Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">إضافة مخزون صكوك مصدقة</h2>

                        <form onSubmit={handleAddStock} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    نوع الشيكات
                                </label>
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 font-semibold">
                                    شيكات مصدقة (Certified Checks)
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    الكمية (عدد الأوراق)
                                </label>
                                <input
                                    type="number"
                                    value={addForm.quantity}
                                    onChange={(e) =>
                                        setAddForm({ ...addForm, quantity: Number(e.target.value) })
                                    }
                                    className="input focus:ring-amber-500 border-amber-200"
                                    min="1"
                                    required
                                    placeholder="أدخل عدد الأوراق..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        بداية التسلسل (اختياري)
                                    </label>
                                    <input
                                        type="text"
                                        value={addForm.serial_from}
                                        onChange={(e) => setAddForm({ ...addForm, serial_from: e.target.value })}
                                        className="input"
                                        placeholder="000001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        نهاية التسلسل (اختياري)
                                    </label>
                                    <input
                                        type="text"
                                        value={addForm.serial_to}
                                        onChange={(e) => setAddForm({ ...addForm, serial_to: e.target.value })}
                                        className="input"
                                        placeholder="001000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ملاحظات
                                </label>
                                <textarea
                                    value={addForm.notes}
                                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                                    className="input"
                                    rows={3}
                                    placeholder="أي ملاحظات إضافية..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="flex-1 btn btn-primary bg-amber-600 hover:bg-amber-700 border-none">
                                    إضافة للمخزن
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
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
