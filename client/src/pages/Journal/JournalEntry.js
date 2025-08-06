import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { 
  Save, 
  X, 
  Upload, 
  Image, 
  Video, 
  Lock, 
  Unlock, 
  Smile,
  Loader2,
  Calendar,
  Tag
} from 'lucide-react';
import api from '../../utils/api';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import './JournalEntry.css';

const JournalEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState({});
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm({
    defaultValues: {
      title: '',
      content: '',
      moodRating: 5,
      tags: '',
      isPublic: false
    }
  });

  const watchedTitle = watch('title');
  const watchedContent = watch('content');

  // Fetch journal data when editing
  const { data: journalData, isLoading: isLoadingJournal } = useQuery(
    ['journal', id],
    async () => {
      if (!id) return null;
      const response = await api.get(`/journal/${id}`);
      return response.data.journal;
    },
    {
      enabled: !!id,
      onError: (error) => {
        if (error.response?.status === 401 && error.response?.data?.requiresPassword) {
          // Handle password requirement for encrypted journals
          setPasswordModalConfig({
            title: "Enter Journal Password",
            description: "This journal is encrypted. Please enter the password to access it.",
            onSubmit: async (password) => {
              try {
                setIsVerifyingPassword(true);
                const response = await api.get(`/journal/${id}?password=${encodeURIComponent(password)}`);
                queryClient.setQueryData(['journal', id], response.data.journal);
                setShowPasswordModal(false);
                toast.success('Journal unlocked successfully!');
              } catch (err) {
                toast.error('Invalid password');
              } finally {
                setIsVerifyingPassword(false);
              }
            }
          });
          setShowPasswordModal(true);
        } else {
          toast.error('Failed to load journal data');
          navigate('/journal');
        }
      }
    }
  );

  // Populate form when editing
  useEffect(() => {
    if (journalData && id) {
      reset({
        title: journalData.title || '',
        content: journalData.content || '',
        moodRating: journalData.moodRating || 5,
        tags: journalData.tags ? journalData.tags.join(', ') : '',
        isPublic: journalData.isPublic || false
      });
      setIsEncrypted(journalData.isEncrypted || false);
    }
  }, [journalData, id, reset]);

  // File upload handling with dropzone
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      uploading: false
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Create/Update journal mutation
  const journalMutation = useMutation(
    async (data) => {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });

      // Add encryption settings
      formData.append('isEncrypted', isEncrypted);
      if (isEncrypted && encryptionPassword) {
        formData.append('encryptionPassword', encryptionPassword);
      }
      
      // Add current password for editing encrypted journals
      if (id && journalData?.isEncrypted) {
        // This will be handled by the onSubmit function with password modal
        return new Promise((resolve, reject) => {
          setPasswordModalConfig({
            title: "Verify Current Password",
            description: "Enter the current password to edit this encrypted journal.",
            onSubmit: async (currentPassword) => {
              try {
                setIsVerifyingPassword(true);
                formData.append('currentPassword', currentPassword);
                const response = await api[method](url, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                setShowPasswordModal(false);
                resolve(response.data);
              } catch (err) {
                if (err.response?.status === 401) {
                  toast.error('Invalid current password');
                } else {
                  reject(err);
                }
              } finally {
                setIsVerifyingPassword(false);
              }
            }
          });
          setShowPasswordModal(true);
        });
      }

      // Add files
      uploadedFiles.forEach((fileObj, index) => {
        formData.append('media', fileObj.file);
      });

      const url = id ? `/journal/${id}` : '/journal';
      const method = id ? 'put' : 'post';
      
      const response = await api[method](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(id ? 'Journal updated successfully!' : 'Journal created successfully!');
        queryClient.invalidateQueries(['journals']);
        queryClient.invalidateQueries(['journalStats']);
        navigate('/journal');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save journal');
      }
    }
  );

  const onSubmit = (data) => {
    if (isEncrypted && !encryptionPassword.trim()) {
      toast.error('Please enter an encryption password');
      return;
    }

    if (uploadedFiles.some(f => f.uploading)) {
      toast.error('Please wait for files to finish uploading');
      return;
    }

    journalMutation.mutate(data);
  };

  const handleCancel = () => {
    // Clean up file previews
    uploadedFiles.forEach(fileObj => {
      if (fileObj.preview) {
        URL.revokeObjectURL(fileObj.preview);
      }
    });
    navigate('/journal');
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

  // Show loading state when fetching journal data
  if (isLoadingJournal) {
    return (
      <div className="journal-entry-container">
        <div className="loading-state">
          <Loader2 className="loading-spinner" />
          <p>Loading journal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-entry-container">
      <div className="entry-header">
        <div className="header-content">
          <h1>{id ? 'Edit Journal Entry' : 'New Journal Entry'}</h1>
          <p>Share your thoughts, feelings, and experiences</p>
        </div>
        <div className="header-actions">
          <button className="cancel-btn" onClick={handleCancel}>
            <X size={16} />
            Cancel
          </button>
          <button 
            className="save-btn" 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !watchedTitle.trim() || !watchedContent.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="button-spinner" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {id ? 'Update' : 'Save'} Entry
              </>
            )}
          </button>
        </div>
      </div>

      <form className="entry-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-grid">
          {/* Main Content */}
          <div className="main-content">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                placeholder="What's on your mind today?"
                {...register('title', { 
                  required: 'Title is required',
                  minLength: { value: 3, message: 'Title must be at least 3 characters' }
                })}
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="content">Content *</label>
              <textarea
                id="content"
                rows={12}
                placeholder="Write about your day, thoughts, feelings, or anything you want to remember..."
                {...register('content', { 
                  required: 'Content is required',
                  minLength: { value: 10, message: 'Content must be at least 10 characters' }
                })}
                className={errors.content ? 'error' : ''}
              />
              {errors.content && <span className="error-message">{errors.content.message}</span>}
              <div className="character-count">
                {watchedContent.length} characters
              </div>
            </div>

            {/* Media Upload */}
            <div className="form-group">
              <label>Media Attachments</label>
              <div 
                {...getRootProps()} 
                className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
              >
                <input {...getInputProps()} />
                <Upload size={24} />
                <p>
                  {isDragActive 
                    ? 'Drop files here...' 
                    : 'Drag & drop images/videos here, or click to select'
                  }
                </p>
                <small>Supports: JPG, PNG, GIF, MP4, MOV (max 10MB each)</small>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  {uploadedFiles.map((fileObj) => (
                    <div key={fileObj.id} className="file-preview">
                      {fileObj.file.type.startsWith('image/') ? (
                        <img src={fileObj.preview} alt="Preview" />
                      ) : (
                        <video src={fileObj.preview} controls />
                      )}
                      <div className="file-info">
                        <span className="file-name">{fileObj.file.name}</span>
                        <span className="file-size">
                          {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="remove-file"
                        onClick={() => removeFile(fileObj.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="entry-sidebar">
            {/* Mood Rating */}
            <div className="sidebar-section">
              <h3>How are you feeling?</h3>
              <div className="mood-rating">
                <div className="mood-display">
                  <span className="mood-emoji">{getMoodEmoji(watch('moodRating'))}</span>
                  <span className="mood-label">{getMoodLabel(watch('moodRating'))}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  {...register('moodRating')}
                  className="mood-slider"
                />
                <div className="mood-scale">
                  <span>😢</span>
                  <span>😐</span>
                  <span>😍</span>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="sidebar-section">
              <h3>Date</h3>
              <div className="date-input">
                <Calendar size={16} />
                <input
                  type="date"
                  {...register('date')}
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="sidebar-section">
              <h3>Tags</h3>
              <div className="tags-input">
                <Tag size={16} />
                <input
                  type="text"
                  placeholder="Add tags (comma separated)"
                  {...register('tags')}
                />
              </div>
              <small>Example: work, personal, goals, reflection</small>
            </div>

            {/* Encryption */}
            <div className="sidebar-section">
              <h3>Privacy & Security</h3>
              <div className="encryption-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={isEncrypted}
                    onChange={(e) => setIsEncrypted(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {isEncrypted ? <Lock size={16} /> : <Unlock size={16} />}
                    Password Protected
                  </span>
                </label>
              </div>
              
              {isEncrypted && (
                <div className="encryption-password">
                  <input
                    type="password"
                    placeholder="Enter encryption password"
                    value={encryptionPassword}
                    onChange={(e) => setEncryptionPassword(e.target.value)}
                    className="password-input"
                  />
                  <small>This entry will be encrypted and only accessible with this password</small>
                </div>
              )}

              <div className="visibility-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    {...register('isPublic')}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">Public Entry</span>
                </label>
                <small>Public entries can be shared with others</small>
              </div>
            </div>

            {/* Entry Preview */}
            <div className="sidebar-section">
              <h3>Entry Preview</h3>
              <div className="entry-preview">
                <h4>{watchedTitle || 'Untitled Entry'}</h4>
                <p className="preview-content">
                  {watchedContent 
                    ? (watchedContent.length > 100 
                        ? watchedContent.substring(0, 100) + '...' 
                        : watchedContent)
                    : 'Start writing to see a preview...'
                  }
                </p>
                <div className="preview-meta">
                  <span className="preview-mood">{getMoodEmoji(watch('moodRating'))}</span>
                  <span className="preview-files">
                    {uploadedFiles.length > 0 && `${uploadedFiles.length} file(s)`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/journal')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner"></div>
                {id ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {id ? 'Update Entry' : 'Create Entry'}
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          if (passwordModalConfig.onSubmit) {
            // If user cancels password entry, navigate back
            navigate('/journal');
          }
        }}
        onSubmit={passwordModalConfig.onSubmit}
        title={passwordModalConfig.title}
        description={passwordModalConfig.description}
        isLoading={isVerifyingPassword}
      />
    </div>
  );
};

export default JournalEntry;