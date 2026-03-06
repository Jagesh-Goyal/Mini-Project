import { Menu, Bell, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/employees': 'Employees',
  '/skills': 'Skills',
  '/gap': 'Skill Gap Analysis',
  '/recommendations': 'Recommendations',
  '/forecast': 'Forecast',
};

export default function Navbar() {
  const { toggleSidebar } = useStore();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="h-16 border-b border-white/[0.06] glass-card-static flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30"
      style={{ borderRadius: 0 }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-white/[0.06] transition text-slate-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="p-2 rounded-xl hover:bg-white/[0.06] transition text-slate-400 hover:text-white relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-white/[0.08]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">Admin</p>
            <p className="text-xs text-slate-500 leading-tight">HR Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
