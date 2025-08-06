import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Navigation items
  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Overview and recent activity'
    },
    {
      path: '/journal',
      label: 'Journal',
      icon: '📝',
      description: 'Your personal diary entries'
    },
    {
      path: '/insights',
      label: 'Insights',
      icon: '📈',
      description: 'Analytics and mood tracking'
    },
    {
      path: '/todo',
      label: 'To-do List',
      icon: '✅',
      description: 'Manage your tasks'
    },
    {
      path: '/bucket-list',
      label: 'Bucket List',
      icon: '🎯',
      description: 'Your life goals and dreams'
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: '👤',
      description: 'Manage your account'
    }
  ];

  return (
    <div className="layout">
      {/* Starfield Animation for Dark Mode */}
      {theme === 'dark' && (
        <div className="starfield">
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      )}
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        navItems={navItems}
        currentPath={location.pathname}
        user={user}
      />
      
      <div className="layout-main">
        <Header 
          onMenuClick={toggleSidebar}
          user={user}
          currentPath={location.pathname}
        />
        
        <main className="layout-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
    </div>
  );
};

export default Layout; 