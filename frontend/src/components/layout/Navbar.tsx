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
  '/advisor': 'AI Advisor',
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
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={toggleSidebar}
          className="topbar-menu-btn lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-title-section">
          <h1 className="page-title">{title}</h1>
          <p className="topbar-subtitle">Workforce insights and actions</p>
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-search-btn">
          <Search size={14} />
          Search
        </button>

        <span className="status-badge live">
          Live
        </span>

        <button
          className="topbar-icon-btn"
          title="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="topbar-divider" />

        <div className="user-profile">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <div className="user-info">
            <p className="user-name">{userName}</p>
            <p className="user-role">{roleLabel}</p>
            <p className="user-email">{userEmail}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="topbar-logout-btn"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
