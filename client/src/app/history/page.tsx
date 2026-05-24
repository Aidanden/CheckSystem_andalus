'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatDateMedium, formatNumber } from '@/utils/locale';

interface PrintOperation {
  id: number;
  accountNumber: string;
  accountType: number;
  serialFrom: number;
  serialTo: number;
  sheetsPrinted: number;
  printDate: string;
  status: string;
  routingNumber: string;
  branchId: number;
}

interface ReprintModal {
  show: boolean;
  operation: PrintOperation | null;
  serialFrom: number;
  serialTo: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [operations, setOperations] = useState<PrintOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reprintModal, setReprintModal] = useState<ReprintModal>({
    show: false,
    operation: null,
    serialFrom: 0,
    serialTo: 0,
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:5050/api/printing/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setOperations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while loading the log');
    } finally {
      setLoading(false);
    }
  };

  const openReprintModal = (operation: PrintOperation) => {
    setReprintModal({
      show: true,
      operation,
      serialFrom: operation.serialFrom,
      serialTo: operation.serialTo,
    });
  };

  const closeReprintModal = () => {
    setReprintModal({
      show: false,
      operation: null,
      serialFrom: 0,
      serialTo: 0,
    });
    setError('');
    setSuccess('');
  };

  const handleReprint = async () => {
    if (!reprintModal.operation) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:5050/api/printing/print', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: reprintModal.operation.accountNumber,
          serial_from: reprintModal.serialFrom,
          serial_to: reprintModal.serialTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Reprint failed');
      }

      setSuccess('Reprint completed successfully! PDF opened in a new window.');

      // Open PDF in new tab for printing (fetch with token, embed and auto-print)
      if (data.pdfPath) {
        const filename = data.pdfPath.split('\\').pop() || data.pdfPath.split('/').pop();
        const downloadUrl = `http://localhost:5050/api/printing/download/${filename}`;
        try {
          const res = await fetch(downloadUrl, { headers: { 'Authorization': `Bearer ${token}` } });
          if (!res.ok) throw new Error('Failed to download PDF');
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        } catch (e) {
          console.error('Download failed', e);
        }
      }

      // Refresh history
      await fetchHistory();

      // Close modal after 2 seconds
      setTimeout(() => {
        closeReprintModal();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during reprint');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (operation: PrintOperation) => {
    const filename = `checkbook_${operation.accountNumber}_*.pdf`;
    // In a real implementation, you would store the PDF filename in the database
    alert('File download will be available in the full version');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Print Operations Log</h1>
          <button
            onClick={fetchHistory}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {loading && !reprintModal.show ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading log...</p>
          </div>
        ) : operations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No previous print operations</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operation ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Number
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial From-To
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sheets
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {operations.map((operation) => (
                    <tr key={operation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{operation.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">
                        {operation.accountNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {operation.accountType === 1 ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Individual
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Corporate
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">
                        {operation.serialFrom} - {operation.serialTo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {operation.sheetsPrinted} sheet(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateMedium(operation.printDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {operation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                        <button
                          onClick={() => openReprintModal(operation)}
                          className="text-blue-600 hover:text-blue-900 ml-2"
                        >
                          Reprint
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reprint Modal */}
        {reprintModal.show && reprintModal.operation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Reprint Checkbook
                </h3>

                <div className="mt-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={reprintModal.operation.accountNumber}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      النوع
                    </label>
                    <input
                      type="text"
                      value={reprintModal.operation.accountType === 1 ? 'Individual' : 'Corporate'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial From
                      </label>
                      <input
                        type="number"
                        value={reprintModal.serialFrom}
                        onChange={(e) => setReprintModal({
                          ...reprintModal,
                          serialFrom: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial To
                      </label>
                      <input
                        type="number"
                        value={reprintModal.serialTo}
                        onChange={(e) => setReprintModal({
                          ...reprintModal,
                          serialTo: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Will print {reprintModal.serialTo - reprintModal.serialFrom + 1} sheet(s)
                      (Max: {reprintModal.operation.accountType === 1 ? 25 : 50} sheet(s))
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                      {success}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleReprint}
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
                  >
                    {loading ? 'Printing...' : 'Print'}
                  </button>
                  <button
                    onClick={closeReprintModal}
                    disabled={loading}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

