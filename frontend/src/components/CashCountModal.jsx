import React, { useState, useEffect } from "react";
import useAuthStore from "../store/AuthStore";

const CashCountModal = ({ isOpen, onClose }) => {
  const clearSession = useAuthStore((state) => state.clearSession);

  const [denominations] = useState([
    { value: 5000, count: 0 },
    { value: 1000, count: 0 },
    { value: 500, count: 0 },
    { value: 100, count: 0 },
    { value: 50, count: 0 },
    { value: 20, count: 0 },
    { value: 10, count: 0 },
    { value: 5, count: 0 },
  ]);

  const [counts, setCounts] = useState(denominations.map(() => ""));
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const calculatedTotal = denominations.reduce((sum, denom, index) => {
      const count = parseInt(counts[index]) || 0;
      return sum + denom.value * count;
    }, 0);
    setTotal(calculatedTotal);
  }, [counts, denominations]);

  const handleCountChange = (index, value) => {
    const newCounts = [...counts];
    newCounts[index] = value;
    setCounts(newCounts);
  };

  const handleSave = () => {
    console.log("Cash count saved:", {
      denominations: denominations.map((denom, index) => ({
        value: denom.value,
        count: parseInt(counts[index]) || 0,
        total: denom.value * (parseInt(counts[index]) || 0),
      })),
      grandTotal: total,
    });

    // TODO: Add API call to save cash count

    // Logout user after saving
    clearSession();
    alert("Cash count saved. Logging out...");
    window.location.href = "/";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Cash Count</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="border border-black">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black p-2 text-left">
                  Denomination
                </th>
                <th className="p-2 text-left">Count</th>
              </tr>
            </thead>
            <tbody>
              {denominations.map((denom, index) => (
                <tr key={denom.value} className="border-b border-black">
                  <td className="border-r border-black p-2">
                    Rs: {denom.value}
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={counts[index]}
                      onChange={(e) => handleCountChange(index, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="border-r border-black p-2">Total</td>
                <td className="p-2">Rs: {total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Save & Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashCountModal;
