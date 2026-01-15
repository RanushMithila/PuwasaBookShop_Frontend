import React, { useState, useRef, useEffect } from "react";

/**
 * OpeningAmountModal - Modal for entering opening cash amount
 * This modal has NO close button - user must submit the opening amount to proceed.
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onSubmit - Callback when opening amount is submitted, receives (amount)
 * @param {boolean} isLoading - Whether the submit action is in progress
 */
const OpeningAmountModal = ({ isOpen, onSubmit, isLoading = false }) => {
  const [openingAmount, setOpeningAmount] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(openingAmount) || 0;

    if (amount < 0) {
      setError("Opening amount cannot be negative");
      return;
    }

    console.log("Submitting opening amount:", amount);
    onSubmit(amount);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-[420px] relative">
        {/* No close button - user must submit to proceed */}

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Open Cash Register
          </h2>
          <p className="text-gray-500 mt-2">
            Enter the opening cash amount to start billing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="openingAmount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Opening Amount (Rs.)
            </label>
            <input
              ref={inputRef}
              id="openingAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold text-center focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Processing...
              </span>
            ) : (
              "Start Billing"
            )}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-4">
          This session will be recorded for accounting purposes
        </p>
      </div>
    </div>
  );
};

export default OpeningAmountModal;
