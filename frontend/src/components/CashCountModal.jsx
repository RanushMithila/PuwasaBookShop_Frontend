import React, { useState, useEffect } from "react";
import useAuthStore from "../store/AuthStore";
import { setClosingAmount } from "../services/CashRegisterService";

const CashCountModal = ({ isOpen, onClose }) => {
  const clearSession = useAuthStore((state) => state.clearSession);
  const deviceId = useAuthStore((state) => state.deviceId);

  // All denominations from coins to notes (sorted high to low for display)
  const [denominations] = useState([
    { value: 5000, label: "Rs: 5000" },
    { value: 2000, label: "Rs: 2000" },
    { value: 1000, label: "Rs: 1000" },
    { value: 500, label: "Rs: 500" },
    { value: 100, label: "Rs: 100" },
    { value: 50, label: "Rs: 50" },
    { value: 20, label: "Rs: 20" },
    { value: 10, label: "Rs: 10" },
    { value: 5, label: "Rs: 5" },
    { value: 2, label: "Rs: 2" },
    { value: 1, label: "Rs: 1" },
  ]);

  const [counts, setCounts] = useState(denominations.map(() => ""));
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    const calculatedTotal = denominations.reduce((sum, denom, index) => {
      const count = parseInt(counts[index]) || 0;
      return sum + denom.value * count;
    }, 0);
    setTotal(calculatedTotal);
  }, [counts, denominations]);

  // Reset counts when modal opens
  useEffect(() => {
    if (isOpen) {
      setCounts(denominations.map(() => ""));
      setToast({ show: false, type: "", message: "" });
    }
  }, [isOpen, denominations]);

  // Handle post-save navigation
  useEffect(() => {
    if (toast.show && toast.type === "success") {
      const timer = setTimeout(() => {
        clearSession();
        window.location.hash = "#/";
      }, 2500);
      return () => clearTimeout(timer);
    } else if (toast.show && toast.type === "error") {
      const timer = setTimeout(() => {
        setToast({ show: false, type: "", message: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearSession]);

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const handleCountChange = (index, value) => {
    const newCounts = [...counts];
    newCounts[index] = value;
    setCounts(newCounts);
  };

  const handleSave = async () => {
    if (!deviceId) {
      console.error("No device ID available for closing amount");
      showToast("error", "Error: Device ID not found. Please re-login.");
      return;
    }

    setIsLoading(true);

    try {
      // Build notes object with denomination as key and count as value
      const notes = {};
      denominations.forEach((denom, index) => {
        notes[String(denom.value)] = parseInt(counts[index]) || 0;
      });

      console.log("Submitting cash count:", {
        deviceId,
        closingAmount: total,
        notes,
      });

      const response = await setClosingAmount(deviceId, total, notes);
      console.log("setClosingAmount response:", response);

      if (response.status === true) {
        console.log("Closing amount saved successfully");
        showToast("success", "Cash count saved successfully. Logging out...");
      } else {
        console.error(
          "Failed to save closing amount:",
          response.error_message || response.message
        );
        showToast(
          "error",
          "Failed to save cash count: " +
            (response.error_message || response.message)
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Save cash count failed:", error);
      showToast("error", "Error saving cash count: " + error.message);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-[420px] max-h-[90vh] overflow-y-auto relative">
        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`absolute -top-16 left-0 right-0 mx-auto w-[90%] p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in z-[60] ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
            style={{
              animation: "slideDown 0.3s ease-out",
            }}
          >
            {toast.type === "success" ? (
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Cash Count - Closing
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="border-r border-gray-200 p-3 text-left font-semibold text-gray-700">
                  Denomination
                </th>
                <th className="p-3 text-left font-semibold text-gray-700">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {denominations.map((denom, index) => (
                <tr
                  key={denom.value}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="border-r border-gray-100 p-2 font-medium text-gray-600">
                    {denom.label}
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={counts[index]}
                      onChange={(e) => handleCountChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      min="0"
                      placeholder="0"
                      disabled={isLoading}
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-100">
                <td className="border-r border-emerald-100 p-3 text-emerald-800">
                  Total
                </td>
                <td className="p-3 text-emerald-800 text-lg">
                  Rs:{" "}
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save & Logout"
            )}
          </button>
        </div>

        {/* CSS for animations */}
        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CashCountModal;
