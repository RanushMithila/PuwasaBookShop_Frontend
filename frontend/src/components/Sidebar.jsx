import { useNavigate, useLocation } from "react-router-dom";

// Get the correct base path for assets in Electron
const getAssetPath = (path) => {
  // In Electron production, use relative path from the HTML file
  // In development, use absolute path
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    return `.${path}`;
  }
  return path;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/billing", label: "Billing", icon: "🧾" },
    { path: "/refund", label: "Refund", icon: "↩️" },
  ];

  return (
    <div className="w-[84px] bg-gradient-to-b from-white to-gray-50 border-r flex flex-col items-center py-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden shadow mb-5 ring-1 ring-gray-200">
        <img
          src={getAssetPath("/PUWASA LOGO.jpg")}
          alt="Logo"
          className="w-full h-full object-cover"
        />
      </div>
      <nav className="flex flex-col gap-3 w-full px-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border-none cursor-pointer ${
                isActive
                  ? "bg-indigo-100 text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto text-[10px] text-gray-400 pb-2">v1.0</div>
    </div>
  );
};
export default Sidebar;
