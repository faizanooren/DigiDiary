import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Calendar, Smile, X } from 'lucide-react';
import './EnhancedSearchBar.css';

const EnhancedSearchBar = ({ 
  onSearch, 
  onFilterChange, 
  placeholder = "Search your journals...",
  showFilters = true,
  initialFilters = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    mood: '',
    ...initialFilters
  });
  const [debounceTimer, setDebounceTimer] = useState(null);
  const filterPanelRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onSearch(searchTerm, filters);
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchTerm, filters]);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setShowFilterPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      fromDate: '',
      toDate: '',
      mood: ''
    };
    setFilters(clearedFilters);
    onFilterChange && onFilterChange(clearedFilters);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return filters.fromDate || filters.toDate || filters.mood;
  };

  const getMoodLabel = (value) => {
    const moodLabels = {
      '1': '😢 Very Sad',
      '2': '😔 Sad',
      '3': '😐 Neutral',
      '4': '😊 Happy',
      '5': '😄 Very Happy'
    };
    return moodLabels[value] || 'All Moods';
  };

  return (
    <div className="enhanced-search-container">
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filter-controls">
            <button
              className={`filter-toggle ${showFilterPanel ? 'active' : ''} ${hasActiveFilters() ? 'has-filters' : ''}`}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              aria-label="Toggle filters"
            >
              <Filter size={18} />
              {hasActiveFilters() && <span className="filter-indicator"></span>}
            </button>
          </div>
        )}
      </div>

      {showFilters && showFilterPanel && (
        <div className="filter-panel" ref={filterPanelRef}>
          <div className="filter-panel-header">
            <h4>Filter Journals</h4>
            {hasActiveFilters() && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear All
              </button>
            )}
          </div>

          <div className="filter-section">
            <label className="filter-label">
              <Calendar size={16} />
              Date Range
            </label>
            <div className="date-range-inputs">
              <div className="date-input-group">
                <label htmlFor="fromDate">From</label>
                <input
                  id="fromDate"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label htmlFor="toDate">To</label>
                <input
                  id="toDate"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  className="date-input"
                  min={filters.fromDate}
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <label className="filter-label">
              <Smile size={16} />
              Mood Score
            </label>
            <select
              value={filters.mood}
              onChange={(e) => handleFilterChange('mood', e.target.value)}
              className="mood-select"
            >
              <option value="">All Moods</option>
              <option value="1">😢 Very Sad (1)</option>
              <option value="2">😔 Sad (2)</option>
              <option value="3">😐 Neutral (3)</option>
              <option value="4">😊 Happy (4)</option>
              <option value="5">😄 Very Happy (5)</option>
            </select>
          </div>

          {hasActiveFilters() && (
            <div className="active-filters">
              <h5>Active Filters:</h5>
              <div className="filter-tags">
                {filters.fromDate && (
                  <span className="filter-tag">
                    From: {new Date(filters.fromDate).toLocaleDateString()}
                    <button onClick={() => handleFilterChange('fromDate', '')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.toDate && (
                  <span className="filter-tag">
                    To: {new Date(filters.toDate).toLocaleDateString()}
                    <button onClick={() => handleFilterChange('toDate', '')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.mood && (
                  <span className="filter-tag">
                    {getMoodLabel(filters.mood)}
                    <button onClick={() => handleFilterChange('mood', '')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchBar;
