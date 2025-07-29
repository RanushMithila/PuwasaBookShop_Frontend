const Sidebar = () => {
  return (
    <div className="w-[80px] bg-white border-r flex flex-col items-center pt-4">
      <img src="/logo.png" alt="Logo" className="w-10 h-10 mb-4" />
      <nav className="space-y-6 text-xl text-gray-600">
        <div className="hover:text-black cursor-pointer">🏠</div>
        <div className="hover:text-black cursor-pointer">📋</div>
        <div className="hover:text-black cursor-pointer">🎧</div>
        <div className="hover:text-black cursor-pointer">📚</div>
        <div className="hover:text-black cursor-pointer">👤</div>
      </nav>
    </div>
  );
};
export default Sidebar;