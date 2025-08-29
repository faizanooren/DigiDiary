import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Plus, Sun, Moon, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import GlobalSearchResults from '../GlobalSearchResults';
import './Header.css';

const Header = ({ onMenuClick, user, currentPath }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && searchQuery.trim().length >= 2) {
      setShowGlobalSearch(true);
    }
  };

  const handleCloseGlobalSearch = () => {
    setShowGlobalSearch(false);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Auto-trigger search for queries >= 2 characters
    if (value.trim().length >= 2) {
      setShowGlobalSearch(true);
    } else {
      setShowGlobalSearch(false);
    }
  };

  const getPageTitle = () => {
    const pathMap = {
      '/dashboard': 'Dashboard',
      '/journal': 'Journal',
      '/insights': 'Insights',
      '/todo': 'To-do List',
      '/bucket-list': 'Bucket List',
      '/profile': 'Profile'
    };
    return pathMap[currentPath] || 'DigiDiary';
  };

  const handleNewJournal = () => {
    navigate('/journal/new');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <h1 className="page-title">{getPageTitle()}</h1>
      </div>

      <div className="header-center">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search across journals, todos, bucket list..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="search-input"
            />
          </div>
        </form>
      </div>

      <div className="header-right">
        {currentPath === '/journal' && (
          <button className="new-journal-btn" onClick={handleNewJournal}>
            <Plus size={20} />
            <span>New Entry</span>
          </button>
        )}
        
        <div className="header-actions">

          
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <div className="user-profile-section">
          <div className="user-profile-info">
            <div className="user-profile-avatar">
              {authUser?.profilePicture ? (
                <img src={authUser.profilePicture} alt={authUser.fullName} />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="user-profile-details">
              <h4>{authUser?.fullName || 'User'}</h4>
              <p>{authUser?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Search Results */}
      <GlobalSearchResults 
        query={searchQuery}
        isVisible={showGlobalSearch}
        onClose={handleCloseGlobalSearch}
      />
    </header>
  );
};

export default Header;