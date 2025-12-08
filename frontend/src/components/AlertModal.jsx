import React, { useEffect, useRef } from "react";

const AlertModal = ({ isOpen, onClose, title, message }) => {
  const okButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => okButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <div className="mb-6 text-gray-700 whitespace-pre-line">{message}</div>
        <div className="flex justify-end">
          <button
            ref={okButtonRef}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onClose();
              }
            }}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
