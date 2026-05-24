'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { inventoryService } from '@/lib/api';
import { Inventory, InventoryTransaction } from '@/types';
import { Package, Plus, Minus, History, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDateShort, formatNumber } from '@/utils/locale';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    stock_type: 1 as 1 | 2 | 3,
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
        inventoryService.getTransactionHistory(undefined, 20),
      ]);
      setInventory(inv.filter(item => item.stockType !== 3));
      setTransactions(trans.filter(item => item.stockType !== 3));
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
        stock_type: 1,
        quantity: 0,
        serial_from: '',
        serial_to: '',
        notes: '',
      });
      loadInventoryData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add stock');
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
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Stock
          </button>
        </div>

        {/* Inventory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inventory.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {item.stockType === 1 ? 'Individual & Employee Checks' : 'Corporate Checks'}
                </h3>
                <Package className="w-8 h-8 text-blue-500" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Available Quantity:</span>
                  <span className="text-2xl font-bold text-gray-800">
                    {item.quantity}
                  </span>
                </div>

                <div
                  className={`mt-4 px-4 py-2 rounded-lg text-center font-medium ${item.quantity > 100
                    ? 'bg-green-100 text-green-700'
                    : item.quantity > 50
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}
                >
                  {item.quantity > 100
                    ? 'Stock OK'
                    : item.quantity > 50
                      ? 'Stock Medium'
                      : 'Stock Low - Please add stock'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Inventory Transaction History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Type
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Operation
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Quantity
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trans) => (
                  <tr key={trans.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {trans.stockType === 1 ? 'Individual/Employee' : 'Corporate'}
                    </td>
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
                        {trans.transactionType === 'ADD' ? 'Add' : 'Deduct'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">{trans.quantity}</td>
                    <td className="py-3 px-4 text-sm">
                      {formatDateShort(trans.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {trans.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Stock</h2>

            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check Type
                </label>
                <select
                  value={addForm.stock_type}
                  onChange={(e) =>
                    setAddForm({ ...addForm, stock_type: Number(e.target.value) as 1 | 2 })
                  }
                  className="input"
                  required
                >
                  <option value={1}>Individual & Employee Checks</option>
                  <option value={2}>Corporate Checks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={addForm.quantity}
                  onChange={(e) =>
                    setAddForm({ ...addForm, quantity: Number(e.target.value) })
                  }
                  className="input"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn btn-primary">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

