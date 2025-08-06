import React, { useState } from 'react';
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
  Unlock,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal/DeleteConfirmModal';
import './JournalDetail.css';

const JournalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch journal entry
  const { data: journal, isLoading, error } = useQuery(
    ['journal', id],
    async () => {
      const response = await api.get(`/journal/${id}`);
      return response.data.journal;
    },
    {
      onError: (error) => {
        if (error.response?.status === 401 && error.response?.data?.requiresPassword) {
          // Handle password requirement for encrypted journals
          setShowPasswordModal(true);
        } else {
          toast.error('Failed to load journal entry');
          console.error('Error fetching journal:', error);
        }
      }
    }
  );

  // Delete journal mutation
  const deleteMutation = useMutation(
    async () => {
      await api.delete(`/journal/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Journal entry deleted successfully');
        navigate('/journal');
        queryClient.invalidateQueries(['journals']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete journal entry');
      }
    }
  );

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
  };

  const handlePasswordSubmit = async (password) => {
    try {
      setIsVerifyingPassword(true);
      const response = await api.get(`/journal/${id}?password=${encodeURIComponent(password)}`);
      queryClient.setQueryData(['journal', id], response.data.journal);
      setShowPasswordModal(false);
      toast.success('Journal unlocked successfully!');
    } catch (error) {
      toast.error('Invalid password');
    } finally {
      setIsVerifyingPassword(false);
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
            <Link to={`/journal/${id}/edit`} className="edit-btn">
              <Edit size={16} />
              Edit
            </Link>
            <button onClick={handleDelete} className="delete-btn" disabled={deleteMutation.isLoading}>
              {deleteMutation.isLoading ? (
                <Loader2 size={16} className="button-spinner" />
              ) : (
                <Trash2 size={16} />
              )}
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
                  {media.type.startsWith('image/') ? (
                    <img 
                      src={media.url} 
                      alt={`Attachment ${index + 1}`}
                      className="media-image"
                    />
                  ) : (
                    <div className="media-placeholder">
                      <VideoIcon size={24} />
                      <span>Video File</span>
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
      
      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          navigate('/journal');
        }}
        onSubmit={handlePasswordSubmit}
        title="Enter Journal Password"
        description="This journal is encrypted. Please enter the password to view it."
        isLoading={isVerifyingPassword}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Journal Entry"
        message="Are you sure you want to delete this journal entry? This action cannot be undone."
        itemName={journal?.title}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
};

export default JournalDetail; 