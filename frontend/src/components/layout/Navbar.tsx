import { Menu, User, LogOut } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/employees': 'Employees',
  '/skills': 'Skills',
  '/gap': 'Skill Gap',
  '/recommendations': 'Recommendations',
};

export default function Navbar() {
  const { toggleSidebar } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'Dashboard';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-700 bg-slate-900 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-700 transition text-slate-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">Admin</p>
            <p className="text-xs text-slate-500 leading-tight">HR Manager</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-slate-700 transition text-slate-400 hover:text-red-400"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
