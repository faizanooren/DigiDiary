import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Tag, 
  Heart, 
  Lock, 
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import { usePasswordPrompt } from '../../contexts/PasswordPromptContext';
import useJournalPasswordStore from '../../stores/journalPasswordStore';
import DeleteConfirmModal from '../../components/DeleteConfirmModal/DeleteConfirmModal';
import './JournalDetail.css';

const JournalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getPassword, removePassword } = useJournalPasswordStore();
  const { promptForPassword } = usePasswordPrompt();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch journal entry
  const fetchJournal = async () => {
    const password = getPassword(id);
    const response = await api.get(`/journal/${id}`, { params: { password } });
    return response.data.journal;
  };

  const { data: journal, isLoading, error } = useQuery(['journal', id], fetchJournal, {
    onError: (err) => {
      // If content is locked (401), the user needs to enter a password.
      // The prompt context should have handled this, but as a fallback, we redirect.
      if (err.response?.status === 401) {
        toast.error('Password required to view this journal.');
        // Redirect back to list, the prompt will be triggered from there.
        navigate('/journal');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load journal entry.');
        navigate('/journal');
      }
    },
    retry: (failureCount, err) => {
      // Do not retry on 401 errors, as it indicates a password is required.
      if (err.response?.status === 401) {
        return false;
      }
      // Retry for other errors up to 2 times
      return failureCount < 2;
    },
  });

  // Delete is now handled through password verification in PasswordPromptContext

  const handleEdit = () => {
    if (journal.isEncrypted) {
      promptForPassword(id, 'edit');
    } else {
      navigate(`/journal/${id}/edit`);
    }
  };

  const handleDelete = () => {
    if (journal.isEncrypted) {
      promptForPassword(id, 'delete');
    } else {
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/journal/${id}`);
      toast.success('Journal entry deleted successfully');
      queryClient.invalidateQueries('journals');
      navigate('/journal');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete journal entry');
    }
    setShowDeleteModal(false);
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

  if (isLoading) {
    return (
      <div className="journal-detail-loading">
        <Loader2 className="loading-spinner" />
        <p>Loading journal entry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="journal-detail-error">
        <AlertTriangle size={48} />
        <h2>Error loading journal entry</h2>
        <p>The journal entry could not be found or you don't have permission to view it.</p>
        <Link to="/journal" className="back-btn">
          <ArrowLeft size={16} />
          Back to Journals
        </Link>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="journal-detail-error">
        <FileText size={48} />
        <h2>Journal entry not found</h2>
        <p>The journal entry you're looking for doesn't exist.</p>
        <Link to="/journal" className="back-btn">
          <ArrowLeft size={16} />
          Back to Journals
        </Link>
      </div>
    );
  }

  return (
    <div className="journal-detail-container">
      {/* Header */}
      <div className="detail-header">
        <div className="header-actions">
          <Link to="/journal" className="back-link">
            <ArrowLeft size={20} />
            Back to Journals
          </Link>
          <div className="action-buttons">
            <button onClick={handleEdit} className="edit-btn">
              <Edit size={16} />
              Edit
            </button>
            <button onClick={handleDelete} className="delete-btn">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Journal Content */}
      <div className="journal-content">
        <div className="entry-header">
          <div className="entry-meta">
            <div className="entry-date">
              <Calendar size={16} />
              <span>{format(new Date(journal.date || journal.createdAt), 'EEEE, MMMM dd, yyyy')}</span>
            </div>
            <div className="entry-mood">
              <Heart size={16} />
              <span className="mood-emoji">{getMoodEmoji(journal.moodRating)}</span>
              <span className="mood-label">{getMoodLabel(journal.moodRating)}</span>
            </div>
            {journal.isEncrypted && (
              <div className="entry-encrypted">
                <Lock size={16} />
                <span>Encrypted Entry</span>
              </div>
            )}
          </div>
          <h1 className="entry-title">{journal.title}</h1>
        </div>

        {/* Tags */}
        {journal.tags && journal.tags.length > 0 && (
          <div className="entry-tags">
            <Tag size={16} />
            {journal.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Media Gallery */}
        {journal.media && journal.media.length > 0 && (
          <div className="media-gallery">
            <h3>Attachments</h3>
            <div className="media-grid">
              {journal.media.map((media, index) => (
                <div key={index} className="media-item">
                  {media.type === 'image' ? (
                    <img 
                      src={media.url} 
                      alt={`Attachment ${index + 1}`}
                      className="media-image"
                    />
                  ) : media.type === 'video' ? (
                    <video 
                      src={media.url}
                      controls
                      className="media-video"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="media-placeholder">
                      <VideoIcon size={24} />
                      <span>{media.filename}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Journal Content */}
        <div className="entry-content">
          <div className="content-text">
            {journal.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Entry Footer */}
        <div className="entry-footer">
          <div className="footer-meta">
            <span>Created: {format(new Date(journal.createdAt), 'MMM dd, yyyy')}</span>
            {journal.updatedAt && journal.updatedAt !== journal.createdAt && (
              <span>Updated: {format(new Date(journal.updatedAt), 'MMM dd, yyyy')}</span>
            )}
          </div>
        </div>
      </div>
      
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Journal Entry"
        message="Are you sure you want to delete this journal entry? This action cannot be undone."
        itemName={journal?.title}
        isLoading={false}
      />
    </div>
  );
};

export default JournalDetail; 