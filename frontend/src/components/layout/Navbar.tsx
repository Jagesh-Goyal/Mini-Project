import { Menu, User, LogOut, Search, Bell } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/employees': 'Employees',
  '/skills': 'Skills',
  '/heatmap': 'Skill Heatmap',
  '/gap': 'Skill Gap',
  '/forecast': 'Forecast',
  '/risk': 'Workforce Risk',
  '/resume-parser': 'Resume Parser',
  '/jd-parser': 'JD Parser',
  '/recommendations': 'Recommendations',
<<<<<<< HEAD
  '/advisor': 'AI Advisor',
=======
>>>>>>> 3bcda08 (Updated backend files)
  '/reports': 'Reports',
};

export default function Navbar() {
  const { toggleSidebar } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const userEmail = localStorage.getItem('userEmail') ?? 'admin@dakshtra.com';
  const userName = localStorage.getItem('userName') ?? 'Admin';
  const storedRole = localStorage.getItem('userRole') ?? 'admin';
  const roleLabel = storedRole === 'admin' ? 'Admin' : storedRole === 'hr_manager' ? 'HR Manager' : 'Employee';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-700/70 bg-slate-900/70 px-4 backdrop-blur-md lg:px-6">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
            <p className="hidden text-xs text-slate-400 sm:block">Workforce insights and actions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-600/90 hover:text-white md:inline-flex">
            <Search size={14} />
            Search
          </button>

          <span className="hidden rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300 lg:inline-flex">
            Live
          </span>

          <button
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Notifications"
          >
            <Bell size={18} />
          </button>

          <div className="h-6 w-px bg-slate-700/80" />

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/90">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight text-white">{userName}</p>
            <p className="text-[11px] uppercase tracking-wide text-cyan-300/80">{roleLabel}</p>
            <p className="max-w-[200px] truncate text-xs leading-tight text-slate-400">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
