import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Calendar, TrendingUp, BookOpen, Clock } from 'lucide-react';
import api from '../../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  // Fetch recent journals
  const { data: journalsData, isLoading: journalsLoading } = useQuery(
    'recentJournals',
    async () => {
      const response = await api.get('/journal?limit=5');
      return response.data;
    }
  );

  // Fetch journal stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'journalStats',
    async () => {
      const response = await api.get('/journal/stats');
      return response.data;
    }
  );

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const getMoodEmoji = (rating) => {
    const emojis = {
      1: '😢', 2: '😞', 3: '😐', 4: '😕', 5: '😊',
      6: '😄', 7: '😃', 8: '😁', 9: '🤩', 10: '🥰'
    };
    return emojis[rating] || '😐';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const quickActions = [
    {
      title: 'New Journal Entry',
      description: 'Write about your day',
      icon: <Plus size={24} />,
      link: '/journal/new',
      color: 'primary'
    },
    {
      title: 'View Insights',
      description: 'Check your mood trends',
      icon: <TrendingUp size={24} />,
      link: '/insights',
      color: 'success'
    },
    {
      title: 'To-do List',
      description: 'Manage your tasks',
      icon: <BookOpen size={24} />,
      link: '/todo',
      color: 'warning'
    },
    {
      title: 'Bucket List',
      description: 'Track your dreams',
      icon: <Calendar size={24} />,
      link: '/bucket-list',
      color: 'info'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>{greeting}, {user?.fullName}!</h1>
          <p>Welcome back to your digital journey</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link} className={`action-card action-${action.color}`}>
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="dashboard-content">
        {/* Stats Cards */}
        <div className="stats-section">
          <h2>Your Journey Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <h3>{statsLoading ? '...' : statsData?.stats?.totalEntries || 0}</h3>
                <p>Total Entries</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <h3>{statsLoading ? '...' : Math.round(statsData?.stats?.averageMood || 0)}</h3>
                <p>Average Mood</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <h3>{user?.createdAt ? Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0}</h3>
                <p>Days with DigiDiary</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Journal Entries */}
        <div className="recent-entries">
          <div className="section-header">
            <h2>Recent Journal Entries</h2>
            <Link to="/journal" className="view-all-link">View All</Link>
          </div>
          
          {journalsLoading ? (
            <div className="loading-placeholder">
              <div className="loading-spinner"></div>
              <p>Loading recent entries...</p>
            </div>
          ) : journalsData?.journals?.length > 0 ? (
            <div className="entries-list">
              {journalsData.journals.map((journal) => (
                <div key={journal._id} className="entry-card">
                  <div className="entry-header">
                    <h3>{journal.title}</h3>
                    <div className="entry-meta">
                      <span className="mood-emoji">{getMoodEmoji(journal.moodRating)}</span>
                      <span className="entry-date">{formatDate(journal.createdAt)}</span>
                    </div>
                  </div>
                  <p className="entry-preview">
                    {journal.content.length > 150 
                      ? `${journal.content.substring(0, 150)}...` 
                      : journal.content
                    }
                  </p>
                  <div className="entry-footer">
                    <Link to={`/journal/${journal._id}`} className="read-more">
                      Read More
                    </Link>
                    {journal.tags && journal.tags.length > 0 && (
                      <div className="entry-tags">
                        {journal.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No journal entries yet</h3>
              <p>Start your digital journey by writing your first journal entry</p>
              <Link to="/journal/new" className="btn btn-primary">
                <Plus size={20} />
                Write Your First Entry
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 