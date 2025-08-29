import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Heart } from 'lucide-react';
import './MotivationalQuote.css';

const MotivationalQuote = ({ isVisible, onClose, initialQuote = null }) => {
  const [quote, setQuote] = useState(initialQuote || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible && !quote) {
      fetchNewQuote();
    }
  }, [isVisible]);

  const fetchNewQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const data = await response.json();
      if (data.success && data.quote) {
        setQuote(data.quote);
      }
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Failed to load motivational quote');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleNextQuote = () => {
    fetchNewQuote();
  };

  if (!isVisible) return null;

  return (
    <div className={`quote-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`quote-modal ${isClosing ? 'closing' : ''}`}>
        <button className="quote-close" onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="quote-content">
          <div className="quote-header">
            <div className="quote-icon">
              <Heart size={24} className="heart-icon" />
            </div>
            <h3>A Little Motivation</h3>
            <p className="quote-subtitle">We noticed you might need some encouragement today</p>
          </div>

          <div className="quote-body">
            {loading ? (
              <div className="quote-loading">
                <div className="loading-spinner"></div>
                <span>Loading inspiration...</span>
              </div>
            ) : error ? (
              <div className="quote-error">
                <p>{error}</p>
                <button className="retry-btn" onClick={fetchNewQuote}>
                  Try Again
                </button>
              </div>
            ) : (
              <blockquote className="quote-text">
                "{quote}"
              </blockquote>
            )}
          </div>

          <div className="quote-actions">
            <button 
              className="quote-btn secondary" 
              onClick={handleNextQuote}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              Next Quote
            </button>
            <button 
              className="quote-btn primary" 
              onClick={handleClose}
            >
              <Heart size={16} />
              Thanks for cheering me up
            </button>
          </div>
        </div>

        <div className="quote-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default MotivationalQuote;
