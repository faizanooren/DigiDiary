import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usePasswordPrompt } from '../../contexts/PasswordPromptContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Calendar, 
  Tag, 
  Lock, 
  Unlock,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Loader2,
  FileText,
  Image,
  Video
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import EnhancedSearchBar from '../../components/EnhancedSearchBar';
import './JournalList.css';

const JournalList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { promptForPassword } = usePasswordPrompt();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    mood: '',
    isEncrypted: undefined,
    hasMedia: undefined,
    moodRange: ''
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, journal: null });

  // Fetch journals with filters
  const { data: journalsData, isLoading, error } = useQuery(
    ['journals', searchTerm, filters, sortBy, sortOrder, currentPage],
    async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        sortBy,
        sortOrder
      });

      if (filters.mood) params.append('mood', filters.mood);
      if (filters.isEncrypted !== undefined) params.append('isEncrypted', filters.isEncrypted);
      if (filters.hasMedia !== undefined) params.append('hasMedia', filters.hasMedia);
      if (filters.moodRange) params.append('moodRange', filters.moodRange);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const response = await api.get(`/journal?${params}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch journal statistics
  const { data: statsData } = useQuery(
    ['journalStats'],
    async () => {
      const response = await api.get('/journal/stats');
      return response.data;
    }
  );

  // Fetch filter statistics for cards
  const { data: filterStatsData } = useQuery(
    ['journalFilterStats'],
    async () => {
      const response = await api.get('/journal/filter-stats');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const journals = journalsData?.journals || [];
  const totalPages = journalsData?.totalPages || 1;
  const totalJournals = journalsData?.totalJournals || 0;

  // Delete journal mutation (for non-encrypted journals)
  const deleteMutation = useMutation(
    (journalId) => api.delete(`/journal/${journalId}`),
    {
      onSuccess: () => {
        toast.success('Journal deleted successfully');
        queryClient.invalidateQueries('journals');
        setDeleteDialog({ isOpen: false, journal: null });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete journal');
      },
    }
  );

  const handleJournalAction = (journal, action) => {
    if (journal.isEncrypted) {
      promptForPassword(journal._id, action);
    } else {
      if (action === 'view') {
        navigate(`/journal/${journal._id}`);
      } else if (action === 'edit') {
        navigate(`/journal/${journal._id}/edit`);
      } else if (action === 'delete') {
        setDeleteDialog({ isOpen: true, journal });
      }
    }
  };


  const confirmDelete = () => {
    if (deleteDialog.journal) {
      deleteMutation.mutate(deleteDialog.journal._id);
    }
  };

  const getMoodEmoji = (journal) => {
    if (journal.isEncrypted) return '🔒';
    const emojis = ['😢', '😞', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥰', '😍'];
    return emojis[journal.moodRating - 1] || '😐';
  };

  const getMoodLabel = (rating) => {
    const labels = [
      'Very Sad', 'Sad', 'Disappointed', 'Neutral', 'Okay',
      'Good', 'Happy', 'Very Happy', 'Excited', 'Ecstatic'
    ];
    return labels[rating - 1] || 'Neutral';
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleSearch = (searchTerm, searchFilters) => {
    setSearchTerm(searchTerm);
    setFilters(searchFilters);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      fromDate: '',
      toDate: '',
      mood: '',
      isEncrypted: undefined,
      hasMedia: undefined,
      moodRange: ''
    });
    setActiveQuickFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || filters.mood || filters.fromDate || filters.toDate || 
    filters.isEncrypted !== undefined || filters.hasMedia !== undefined || filters.moodRange;

  // Quick filter functions
  const handleQuickFilter = (filterType) => {
    // Clear other quick filters first
    setFilters(prev => ({
      ...prev,
      isEncrypted: undefined,
      hasMedia: undefined,
      moodRange: '',
      fromDate: '',
      toDate: ''
    }));
    
    setActiveQuickFilter(filterType);
    setCurrentPage(1);
    
    switch (filterType) {
      case 'protected':
        setFilters(prev => ({ ...prev, isEncrypted: true }));
        break;
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        setFilters(prev => ({ 
          ...prev, 
          fromDate: sevenDaysAgo.toISOString().split('T')[0] 
        }));
        break;
      case 'thisMonth':
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        setFilters(prev => ({ 
          ...prev, 
          fromDate: firstDayOfMonth.toISOString().split('T')[0] 
        }));
        break;
      case 'withMedia':
        setFilters(prev => ({ ...prev, hasMedia: true }));
        break;
      case 'goodMood':
        setFilters(prev => ({ ...prev, moodRange: 'good' }));
        break;
      case 'lowMood':
        setFilters(prev => ({ ...prev, moodRange: 'low' }));
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <div className="journal-list-error">
        <h2>Error loading journals</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="journal-list-container">
      {/* Header */}
      <div className="list-header">
        <div className="header-content">
          <h1>My Journal Entries</h1>
          <p>Reflect on your thoughts, feelings, and experiences</p>
        </div>
        <Link to="/journal/new" className="new-entry-btn">
          <Plus size={16} />
          New Entry
        </Link>
      </div>

      {/* Filter Stats Cards */}
      {filterStatsData && (
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={20} />
            </div>
            <div className="stat-content">
              <h3>{filterStatsData.stats.totalEntries}</h3>
              <p>Total Entries</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <h3>{filterStatsData.stats.thisMonthEntries}</h3>
              <p>This Month</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Image size={20} />
            </div>
            <div className="stat-content">
              <h3>{filterStatsData.stats.mediaFilesEntries}</h3>
              <p>Media Files</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Lock size={20} />
            </div>
            <div className="stat-content">
              <h3>{filterStatsData.stats.encryptedEntries}</h3>
              <p>Encrypted</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filter Shortcuts */}
      <div className="quick-filters-section">
        <div className="quick-filters-header">
          <h3>
            <Tag size={20} />
            Quick Filters
          </h3>
          {hasActiveFilters && (
            <button className="clear-all-filters-btn" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          )}
        </div>
        <div className="quick-filters">
          <button 
            className={`quick-filter-btn ${activeQuickFilter === 'protected' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('protected')}
          >
            <Lock size={16} />
            Protected Journals
          </button>
          <button 
            className={`quick-filter-btn ${activeQuickFilter === 'recent' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('recent')}
          >
            <Calendar size={16} />
            Last 7 Days
          </button>
          <button 
            className={`quick-filter-btn ${activeQuickFilter === 'thisMonth' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('thisMonth')}
          >
            <Calendar size={16} />
            This Month
          </button>
          <button 
            className={`quick-filter-btn ${activeQuickFilter === 'withMedia' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('withMedia')}
          >
            <Image size={16} />
            With Media
          </button>
          <button 
            className={`quick-filter-btn ${activeQuickFilter === 'goodMood' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('goodMood')}
          >
            <span className="mood-emoji">😊</span>
            Good Mood
          </button>
          <button 
            className={`quick-filter-btn ${activeQuickFilter === 'lowMood' ? 'active' : ''}`}
            onClick={() => handleQuickFilter('lowMood')}
          >
            <span className="mood-emoji">😔</span>
            Low Mood
          </button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="search-section">
        <EnhancedSearchBar
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          placeholder="Search your journals by title, content, or tags..."
          showFilters={true}
          initialFilters={filters}
        />

        </div>

      {/* Results Info */}
      <div className="results-info">
        <p>
          Showing {journals.length} of {totalJournals} entries
          {hasActiveFilters && ' (filtered)'}
        </p>
      </div>

      {/* Journals Grid */}
      {isLoading ? (
        <div className="loading-container">
          <Loader2 className="loading-spinner" />
          <p>Loading your journals...</p>
        </div>
      ) : journals.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No journal entries yet</h3>
          <p>Start your digital journey by creating your first journal entry</p>
          <Link to="/journal/new" className="create-first-btn">
            <Plus size={16} />
            Create Your First Entry
          </Link>
        </div>
      ) : (
        <div className="journals-grid">
          {journals.map((journal) => (
            <div key={journal._id} className="journal-card">
              <div className="card-header">
                <div className="card-meta">
                  <span className="mood-indicator">
                    {getMoodEmoji(journal)}
                  </span>
                  <span className="entry-date">
                    {format(new Date(journal.date || journal.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="card-actions">
                  <div className="dropdown">
                    <button className="dropdown-toggle">
                      <MoreVertical size={16} />
                    </button>
                    <div className="dropdown-menu">
                      <button 
                        onClick={() => handleJournalAction(journal, 'view')}
                        className="dropdown-item"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button 
                        onClick={() => handleJournalAction(journal, 'edit')}
                        className="dropdown-item"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleJournalAction(journal, 'delete')}
                        className="dropdown-item delete"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-content">
                <h3 className="entry-title">{journal.title}</h3>
                <p className="entry-preview">
                  {truncateText(journal.content)}
                </p>
              </div>

              <div className="card-footer">
                <div className="entry-tags">
                  {journal.tags && journal.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                  {journal.tags && journal.tags.length > 3 && (
                    <span className="tag-more">+{journal.tags.length - 3}</span>
                  )}
                </div>

                <div className="entry-indicators">
                  {journal.isEncrypted && (
                    <span className="indicator encrypted" title="Encrypted Entry">
                      <Lock size={12} />
                    </span>
                  )}
                  {journal.media && journal.media.length > 0 && (
                    <span className="indicator media" title={`${journal.media.length} media file(s)`}>
                      {journal.media[0].type.startsWith('image/') ? (
                        <Image size={12} />
                      ) : (
                        <Video size={12} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, journal: null })}
        onConfirm={confirmDelete}
        title="Delete Journal Entry"
        message={`Are you sure you want to delete "${deleteDialog.journal?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteMutation.isLoading}
      />

    </div>
  );
};

export default JournalList; 