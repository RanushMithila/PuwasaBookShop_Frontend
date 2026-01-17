import React, { useEffect, useRef } from "react";

const AlertModal = ({ isOpen, onClose, title, message, type = "info" }) => {
  const okButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => okButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Type-based configuration
  const config =
    {
      success: {
        bgColor: "bg-emerald-50",
        iconColor: "text-emerald-500",
        borderColor: "border-emerald-200",
        buttonColor:
          "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
        icon: (
          <svg
            className="w-12 h-12"
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
        ),
      },
      error: {
        bgColor: "bg-red-50",
        iconColor: "text-red-500",
        borderColor: "border-red-200",
        buttonColor: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        icon: (
          <svg
            className="w-12 h-12"
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
        ),
      },
      info: {
        bgColor: "bg-blue-50",
        iconColor: "text-blue-500",
        borderColor: "border-blue-200",
        buttonColor: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        icon: (
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
    }[type] || config.info;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border ${config.borderColor} animate-in zoom-in-95 duration-200`}
      >
        <div
          className={`p-6 flex flex-col items-center text-center ${config.bgColor}`}
        >
          <div className={`${config.iconColor} mb-4`}>{config.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 font-medium whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 bg-gray-50 flex justify-center">
          <button
            ref={okButtonRef}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onClose();
              }
            }}
            className={`w-full py-3 px-6 text-white text-lg font-bold rounded-xl shadow-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
