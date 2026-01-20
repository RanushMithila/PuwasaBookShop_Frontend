import React, { useState, useEffect } from "react";
import useAuthStore from "../store/AuthStore";
import { cashInOut } from "../services/CashRegisterService";

const CashInOutModal = ({ isOpen, onClose }) => {
  const deviceId = useAuthStore((state) => state.deviceId);
  const [transactionType, setTransactionType] = useState("in"); // 'in' or 'out'
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTransactionType("in");
      setAmount("");
      setReason("");
      setToast({ show: false, type: "", message: "" });
    }
  }, [isOpen]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, type: "", message: "" });
        // If success, close modal after toast
        if (toast.type === "success") {
          onClose();
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.type, onClose]);

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast("error", "Please enter a valid amount");
      return;
    }
    if (!reason.trim()) {
      showToast("error", "Please enter a reason");
      return;
    }
    if (!deviceId) {
      console.error("No device ID available for cash in/out");
      showToast("error", "Device ID not found. Please re-login.");
      return;
    }

    setIsLoading(true);

    try {
      // Type: true for Cash In, false for Cash Out
      const isIn = transactionType === "in";

      console.log("Submitting cash transaction:", {
        deviceId,
        amount: parseFloat(amount),
        Type: isIn,
        reason: reason.trim(),
      });

      const response = await cashInOut(
        deviceId,
        parseFloat(amount),
        isIn,
        reason.trim(),
      );
      console.log("cashInOut response:", response);

      if (response.status === true) {
        console.log(
          "Cash transaction recorded successfully, TransactionID:",
          response.data?.TransactionID,
        );
        // Show success toast
        showToast(
          "success",
          `${isIn ? "Cash In" : "Cash Out"} recorded successfully!`,
        );
      } else {
        console.error(
          "Failed to record cash transaction:",
          response.error_message || response.message,
        );
        showToast(
          "error",
          response.error_message ||
            response.message ||
            "Failed to record transaction",
        );
      }
    } catch (error) {
      console.error("Cash in/out failed:", error);
      showToast("error", error.message || "Error recording transaction");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isIn = transactionType === "in";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-[420px] relative">
        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`absolute -top-16 left-0 right-0 mx-auto w-[90%] p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${
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
            <span className="font-medium">{toast.message}</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">💵 Cash In / Out</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Transaction Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                isIn
                  ? "border-emerald-300 bg-emerald-50 focus:border-emerald-500"
                  : "border-red-300 bg-red-50 focus:border-red-500"
              }`}
              disabled={isLoading}
            >
              <option value="in">💰 Cash In</option>
              <option value="out">💸 Cash Out</option>
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Rs.)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                isIn ? "focus:border-emerald-500" : "focus:border-red-500"
              } border-gray-200`}
              placeholder="0.00"
              step="0.01"
              min="0"
              disabled={isLoading}
            />
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                isIn ? "focus:border-emerald-500" : "focus:border-red-500"
              } border-gray-200`}
              placeholder="Enter reason for transaction"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-600 border-2 border-gray-200 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 px-4 py-3 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
              isIn
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
              <>
                {isIn ? "💰" : "💸"} Save {isIn ? "Cash In" : "Cash Out"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* CSS for toast animation */}
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
      `}</style>
    </div>
  );
};

export default CashInOutModal;
