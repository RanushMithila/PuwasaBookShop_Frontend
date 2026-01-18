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

  const menuItems = [{ path: "/billing", label: "Billing" }];

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
        {/* Navigation items removed per user request */}
      </nav>
      <div className="mt-auto text-[10px] text-gray-400 pb-2">v1.0</div>
    </div>
  );
};
export default Sidebar;
