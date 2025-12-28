import React, { useEffect, useRef } from "react";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger', 'warning', 'info'
}) => {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-100",
      icon: "text-red-600 bg-red-50",
      symbol: "⚠️",
    },
    warning: {
      button:
        "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 shadow-amber-100",
      icon: "text-amber-500 bg-amber-50",
      symbol: "🔔",
    },
    info: {
      button:
        "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-100",
      icon: "text-emerald-600 bg-emerald-50",
      symbol: "ℹ️",
    },
  };

  const currentStyle = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-zoom-in">
        <div className="p-8 text-center uppercase">
          {/* Icon */}
          <div
            className={`w-16 h-16 ${currentStyle.icon} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner`}
          >
            {currentStyle.symbol}
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            {title}
          </h2>

          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col gap-3">
            <button
              ref={confirmButtonRef}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full py-4 ${currentStyle.button} text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 uppercase tracking-wide`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all uppercase tracking-wide"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
