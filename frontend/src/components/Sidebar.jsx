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

// Simple receipt icon that inherits currentColor
const BillingIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7 3h10a1 1 0 0 1 1 1v16l-2.5-1.5L13 20l-2.5-1.5L8 20l-2.5-1.5L3 20V4a1 1 0 0 1 1-1h3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M8 7h8M8 10h8M8 13h6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <BillingIcon />, path: "/billing", label: "Billing" },
    { icon: "🗂️", path: "/categories", label: "Categories" },
    { icon: "📦", path: "/items", label: "Items" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="w-[84px] bg-gradient-to-b from-white to-gray-50 border-r flex flex-col items-center py-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden shadow mb-5 ring-1 ring-gray-200">
        <img
          src={getAssetPath("/PUWASA LOGO.jpg")}
          alt="Logo"
          className="w-full h-full object-cover"
        />
      </div>
      <nav className="flex flex-col gap-4 text-[22px] text-gray-600">
        {menuItems.map((item, index) => {
          const path = location.pathname || "";
          const active = path === item.path || path.startsWith(item.path + "/");
          return (
            <button
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow ring-2 ring-emerald-400 ring-offset-2 ring-offset-white"
                  : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex items-center justify-center">
                {item.icon}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto text-[10px] text-gray-400 pb-2">v1.0</div>
    </div>
  );
};
export default Sidebar;
