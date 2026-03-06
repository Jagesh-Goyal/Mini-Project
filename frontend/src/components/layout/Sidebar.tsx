import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Zap,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  ChevronLeft,
  X,
  BrainCircuit,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/skills', icon: Zap, label: 'Skills' },
  { to: '/gap', icon: AlertTriangle, label: 'Skill Gap' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
  { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
];

export default function Sidebar() {
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapse, setSidebarOpen } = useStore();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col
          glass-card-static border-r border-white/[0.06]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-30
        `}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ borderRadius: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-bold text-lg gradient-text whitespace-nowrap"
                >
                  Dakshtra AI
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-gradient-to-r from-blue-500/15 to-purple-500/10 text-white border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon size={20} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle (desktop only) */}
        <div className="hidden lg:block p-3 border-t border-white/[0.06]">
          <button
            onClick={toggleSidebarCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/[0.05] transition text-slate-400 hover:text-white"
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft size={18} />
            </motion.div>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
