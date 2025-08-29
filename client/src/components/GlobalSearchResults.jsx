import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CheckSquare, 
  Target, 
  Calendar, 
  Tag, 
  Lock, 
  Search,
  X,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import './GlobalSearchResults.css';

const GlobalSearchResults = ({ query, isVisible, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isVisible && query && query.trim().length >= 2) {
      performSearch(query);
    }
  }, [query, isVisible]);

  const performSearch = async (searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to perform search');
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    switch (result.type) {
      case 'journal':
        navigate(`/journal/${result._id}`);
        break;
      case 'todo':
        navigate('/todo');
        break;
      case 'bucketlist':
        navigate('/bucket-list');
        break;
      default:
        break;
    }
    onClose();
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'journal':
        return <FileText size={16} />;
      case 'todo':
        return <CheckSquare size={16} />;
      case 'bucketlist':
        return <Target size={16} />;
      default:
        return <Search size={16} />;
    }
  };

  const getResultTypeLabel = (type) => {
    switch (type) {
      case 'journal':
        return 'Journal';
      case 'todo':
        return 'Todo';
      case 'bucketlist':
        return 'Bucket List';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-results" onClick={(e) => e.stopPropagation()}>
        <div className="search-results-header">
          <div className="search-results-title">
            <Search size={20} />
            <h3>Search Results for "{query}"</h3>
          </div>
          <button className="close-search-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-results-content">
          {loading ? (
            <div className="search-loading">
              <Loader2 className="loading-spinner" />
              <p>Searching across all your content...</p>
            </div>
          ) : error ? (
            <div className="search-error">
              <p>Error: {error}</p>
              <button onClick={() => performSearch(query)}>Try Again</button>
            </div>
          ) : results ? (
            <div className="search-results-sections">
              {/* Combined Results */}
              {results.combined && results.combined.length > 0 ? (
                <div className="results-section">
                  <h4>All Results ({results.totalResults})</h4>
                  <div className="results-list">
                    {results.combined.map((result, index) => (
                      <div 
                        key={`${result.type}-${result._id}-${index}`}
                        className="result-item"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="result-icon">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="result-content">
                          <div className="result-header">
                            <h5>{result.title}</h5>
                            <div className="result-meta">
                              <span className="result-type">
                                {getResultTypeLabel(result.type)}
                              </span>
                              {result.isEncrypted && (
                                <span className="result-encrypted">
                                  <Lock size={12} />
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="result-excerpt">{result.excerpt}</p>
                          <div className="result-footer">
                            <span className="result-date">
                              <Calendar size={12} />
                              {formatDate(result.createdAt)}
                            </span>
                            {result.tags && result.tags.length > 0 && (
                              <div className="result-tags">
                                <Tag size={12} />
                                {result.tags.slice(0, 2).join(', ')}
                                {result.tags.length > 2 && ` +${result.tags.length - 2}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-results">
                  <Search size={48} />
                  <h4>No results found</h4>
                  <p>Try searching with different keywords or check your spelling.</p>
                </div>
              )}

              {/* Category Breakdown */}
              {results.totalResults > 0 && (
                <div className="results-breakdown">
                  <h4>Results by Category</h4>
                  <div className="breakdown-stats">
                    {results.journals.length > 0 && (
                      <div className="breakdown-item">
                        <FileText size={16} />
                        <span>{results.journals.length} Journal{results.journals.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {results.todos.length > 0 && (
                      <div className="breakdown-item">
                        <CheckSquare size={16} />
                        <span>{results.todos.length} Todo{results.todos.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {results.bucketList.length > 0 && (
                      <div className="breakdown-item">
                        <Target size={16} />
                        <span>{results.bucketList.length} Bucket List Item{results.bucketList.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchResults;
