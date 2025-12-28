import React, { useEffect } from "react";

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === "success" ? "bg-emerald-500" : "bg-red-500";

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50`}
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-75 font-bold">
        ×
      </button>
    </div>
  );
};

export default Toast;
