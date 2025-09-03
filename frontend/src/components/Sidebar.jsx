import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: '🏠', path: '/billing', label: 'Billing' },
    { icon: '🏷️', path: '/categories', label: 'Categories' },
    { icon: '📍', path: '/locations', label: 'Locations' },
    { icon: '📦', path: '/items', label: 'Items' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="w-[80px] bg-white border-r flex flex-col items-center pt-4">
      <img src="/PUWASA LOGO.jpg" alt="Logo" className="w-10 h-10 mb-4" />
      <nav className="space-y-6 text-xl text-gray-600">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleNavigation(item.path)}
            className={`hover:text-black cursor-pointer transition-colors ${
              location.pathname === item.path ? 'text-blue-500' : ''  
            }`}
            title={item.label}
          >
            {item.icon}
          </div>
        ))}
      </nav>
    </div>
  );
};
export default Sidebar;