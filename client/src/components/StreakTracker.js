import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Calendar } from 'lucide-react';
import './StreakTracker.css';

const StreakTracker = ({ isCompact = false }) => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastEntryDate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/streak', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch streak data');
      }

      const data = await response.json();
      if (data.success) {
        setStreakData(data.streak);
      }
    } catch (err) {
      console.error('Error fetching streak data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStreakPercentage = () => {
    if (streakData.longestStreak === 0) return 0;
    return Math.min((streakData.currentStreak / streakData.longestStreak) * 100, 100);
  };

  const formatLastEntryDate = () => {
    if (!streakData.lastEntryDate) return 'No entries yet';
    const date = new Date(streakData.lastEntryDate);
    const today = new Date();
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className={`streak-tracker ${isCompact ? 'compact' : ''}`}>
        <div className="streak-loading">
          <div className="loading-spinner"></div>
          <span>Loading streak...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`streak-tracker ${isCompact ? 'compact' : ''}`}>
        <div className="streak-error">
          <span>Failed to load streak data</span>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="streak-tracker compact">
        <div className="streak-compact-content">
          <div className="streak-icon">
            <Flame size={20} className={streakData.currentStreak > 0 ? 'active' : ''} />
          </div>
          <div className="streak-info">
            <span className="streak-count">{streakData.currentStreak}</span>
            <span className="streak-label">day streak</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="streak-tracker">
      <div className="streak-header">
        <div className="streak-title">
          <Flame size={24} className={streakData.currentStreak > 0 ? 'active' : ''} />
          <h3>Writing Streak</h3>
        </div>
      </div>

      <div className="streak-content">
        <div className="streak-main">
          <div className="current-streak">
            <span className="streak-number">{streakData.currentStreak}</span>
            <span className="streak-text">
              {streakData.currentStreak === 1 ? 'Day' : 'Days'}
            </span>
          </div>
          
          <div className="streak-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getStreakPercentage()}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>Current: {streakData.currentStreak}</span>
              <span>Best: {streakData.longestStreak}</span>
            </div>
          </div>
        </div>

        <div className="streak-stats">
          <div className="stat-item">
            <Trophy size={16} />
            <div className="stat-info">
              <span className="stat-value">{streakData.longestStreak}</span>
              <span className="stat-label">Longest Streak</span>
            </div>
          </div>
          
          <div className="stat-item">
            <Calendar size={16} />
            <div className="stat-info">
              <span className="stat-value">{formatLastEntryDate()}</span>
              <span className="stat-label">Last Entry</span>
            </div>
          </div>
        </div>

        {streakData.currentStreak === 0 && (
          <div className="streak-motivation">
            <p>Start your writing journey today! 📝</p>
          </div>
        )}
        
        {streakData.currentStreak > 0 && (
          <div className="streak-motivation">
            <p>Keep it up! You're on fire! 🔥</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakTracker;
