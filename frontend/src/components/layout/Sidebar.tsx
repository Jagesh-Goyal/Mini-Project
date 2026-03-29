import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Zap,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  FileSpreadsheet,
  ShieldAlert,
  ScanSearch,
  FileSearch,
  Grid2x2,
  Bot,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/skills', icon: Zap, label: 'Skills' },
  { to: '/heatmap', icon: Grid2x2, label: 'Heatmap' },
  { to: '/gap', icon: AlertTriangle, label: 'Skill Gap' },
  { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { to: '/risk', icon: ShieldAlert, label: 'Risk' },
  { to: '/resume-parser', icon: ScanSearch, label: 'Resume Parser' },
  { to: '/jd-parser', icon: FileSearch, label: 'JD Parser' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
  { to: '/advisor', icon: Bot, label: 'AI Advisor' },
  { to: '/reports', icon: FileSpreadsheet, label: 'Reports' },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore();

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sidebar-overlay"
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <span>D</span>
            </div>
            <div>
              <span className="logo-text">Dakshtra</span>
              <span className="logo-subtext">Talent OS</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close-btn lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Navigation</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <span className="nav-icon">
                <item.icon size={18} />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Monitor capability gaps and hiring readiness in one place.</p>
        </div>
      </aside>
    </>
  );
}
