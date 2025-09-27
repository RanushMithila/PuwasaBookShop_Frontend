import React, { useState } from 'react';

const TemporaryBillsModal = ({ isOpen, onClose, temporaryBills = [], onSelectBill, onDeleteBill, loading=false, error='', onRefresh }) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[640px] max-h-[540px] border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Temporary Bills</h2>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="px-3 py-1.5 bg-white hover:bg-sky-50 border border-sky-200 text-sky-700 rounded-md text-sm transition">Refresh</button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[380px]">
          {loading ? (
            <div className="text-center py-16 text-gray-500 flex items-center justify-center gap-3">
              <span className="inline-block h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500 text-sm">{error}</div>
          ) : temporaryBills && temporaryBills.length > 0 ? (
            <div className="space-y-2">
              {temporaryBills.map((bill, idx) => {
                const createdRaw = bill.createdDateTime || bill.CreatedDateTime || bill.createdAt || bill.CreatedAt || bill.created_date || bill.CreatedDate || bill.dateCreated || bill.DateCreated || null;
                const created = createdRaw ? new Date(createdRaw) : null;
                return (
                  <div
                    key={bill.BillID}
                    className={`group border border-gray-200 p-3 rounded-xl hover:bg-gray-50 cursor-pointer relative ${selectedIndex === idx ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setSelectedIndex(idx);
                      if (typeof onSelectBill === 'function') onSelectBill(bill, idx);
                      if (typeof onClose === 'function') onClose();
                    }}
                  >
                    <button
                      type="button"
                      title="Delete bill"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof onDeleteBill === 'function') onDeleteBill(bill.BillID, idx);
                      }}
                      className="opacity-70 hover:opacity-100 absolute top-2 right-2 text-red-500 hover:text-red-600 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M9 3a1 1 0 0 0-1 1v1H5.5a.5.5 0 0 0 0 1h.54l.84 12.063A2 2 0 0 0 8.875 20h6.25a2 2 0 0 0 1.995-1.937L17.96 6H18.5a.5.5 0 0 0 0-1H16V4a1 1 0 0 0-1-1H9Zm1 2h4V4h-4v1Zm-.995 2.05a.5.5 0 0 0-.507.492l.347 8.999a.5.5 0 1 0 1-.039l-.347-9a.5.5 0 0 0-.493-.452Zm5.487.492-.347 9a.5.5 0 0 0 .986.04l.347-9a.5.5 0 1 0-.986-.04ZM12 7.5a.5.5 0 0 0-.5.5v9a.5.5 0 1 0 1 0v-9a.5.5 0 0 0-.5-.5Z" />
                      </svg>
                    </button>
                    <div className="flex justify-between items-start pr-6">
                      <div>
                        <div className="font-semibold text-gray-800">Bill ID: {bill.BillID}</div>
                        <div className="text-sm text-gray-600">Total: Rs: {bill.Total ? (typeof bill.Total === 'number' ? bill.Total.toFixed(2) : bill.Total) : '0.00'}</div>
                        <div className="text-xs text-gray-500">{created ? created.toLocaleString() : ''}</div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-sm text-gray-500">Customer ID: {bill.CustomerID}</div>
                        <div className="text-sm text-gray-500">Location: {bill.LocationID || '1'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">No temporary bills found</div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TemporaryBillsModal;
