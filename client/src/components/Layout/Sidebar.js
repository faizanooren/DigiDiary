import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, LogOut, Settings, User } from 'lucide-react';
import StreakTracker from '../StreakTracker';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, navItems, currentPath, user }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h2>DigiDiary</h2>
            <p>Your Digital Journey</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${currentPath === item.path ? 'active' : ''}`}
                  onClick={handleNavClick}
                  title={item.description}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Compact Streak Tracker */}
        <div className="sidebar-streak">
          <StreakTracker isCompact={true} />
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-actions">
            <Link to="/profile" className="action-btn" onClick={handleNavClick} title="Settings">
              <Settings size={20} />
            </Link>
            
            <button className="action-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 