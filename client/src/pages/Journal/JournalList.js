import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Filter, 
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
import './JournalList.css';

const JournalList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, journal: null });

  // Fetch journals with filters
  const { data: journalsData, isLoading, error } = useQuery(
    ['journals', searchTerm, selectedMood, selectedTags, sortBy, sortOrder, currentPage],
    async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        sortBy,
        sortOrder
      });

      if (selectedMood) params.append('moodRating', selectedMood);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));

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

  const journals = journalsData?.journals || [];
  const totalPages = journalsData?.totalPages || 1;
  const totalJournals = journalsData?.totalJournals || 0;

  // Delete journal mutation
  const deleteMutation = useMutation(
    async (journalId) => {
      await api.delete(`/journal/${journalId}`);
    },
    {
      onSuccess: () => {
        toast.success('Journal deleted successfully');
        queryClient.invalidateQueries(['journals']);
        setDeleteDialog({ isOpen: false, journal: null });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete journal');
      }
    }
  );

  const handleDelete = (journal) => {
    setDeleteDialog({ isOpen: true, journal });
  };

  const confirmDelete = () => {
    if (deleteDialog.journal) {
      deleteMutation.mutate(deleteDialog.journal._id);
    }
  };

  const getMoodEmoji = (rating) => {
    const emojis = ['😢', '😞', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥰', '😍'];
    return emojis[rating - 1] || '😐';
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

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMood('');
    setSelectedTags([]);
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedMood || selectedTags.length > 0;

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

      {/* Stats Cards */}
      {statsData && (
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={20} />
            </div>
            <div className="stat-content">
              <h3>{statsData.totalEntries}</h3>
              <p>Total Entries</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <h3>{statsData.entriesThisMonth}</h3>
              <p>This Month</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Image size={20} />
            </div>
            <div className="stat-content">
              <h3>{statsData.totalMedia}</h3>
              <p>Media Files</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Lock size={20} />
            </div>
            <div className="stat-content">
              <h3>{statsData.encryptedEntries}</h3>
              <p>Encrypted</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search journals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn">Search</button>
        </form>

        <div className="filter-controls">
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Mood Rating</label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
            >
              <option value="">All Moods</option>
              <option value="1-3">Sad (1-3)</option>
              <option value="4-6">Neutral (4-6)</option>
              <option value="7-10">Happy (7-10)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="moodRating">Mood</option>
              <option value="createdAt">Created</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}

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
                    {getMoodEmoji(journal.moodRating)}
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
                      <Link to={`/journal/${journal._id}`} className="dropdown-item">
                        <Eye size={14} />
                        View
                      </Link>
                      <Link to={`/journal/${journal._id}/edit`} className="dropdown-item">
                        <Edit size={14} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(journal)}
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