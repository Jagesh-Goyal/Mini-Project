import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, AlertTriangle, Lightbulb, TrendingUp, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/skills', icon: Zap, label: 'Skills' },
  { to: '/gap', icon: AlertTriangle, label: 'Skill Gap' },
  { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore();

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col
          border-r border-slate-700/70 bg-slate-900/85 backdrop-blur-md
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-30
          transition-transform duration-300
        `}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700/80 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <span className="text-white font-bold">D</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-white">Dakshtra</span>
              <span className="block text-[11px] uppercase tracking-wide text-slate-400">Talent OS</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
                ${isActive
                  ? 'bg-blue-600/90 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-700/80 px-4 py-3">
          <p className="text-xs text-slate-400">Monitor capability gaps and hiring readiness in one place.</p>
        </div>
      </aside>
    </>
  );
}
