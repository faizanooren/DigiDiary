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
  const [editPassword, setEditPassword] = useState('');
  const [editUnlockError, setEditUnlockError] = useState('');
  const [editUnlocked, setEditUnlocked] = useState(false);

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

  // We've moved the mutation logic directly into the onSubmit function

  // If editing a protected journal, require password before showing form
  if (id && journalData?.isEncrypted && !editUnlocked) {
    return (
      <div className="journal-protected-fallback">
        <div style={{textAlign: 'center', marginTop: '4rem'}}>
          <Lock size={48} style={{marginBottom: 16}}/>
          <h2>This journal is password protected.</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsVerifyingPassword(true);
            setEditUnlockError('');
            try {
              const response = await api.get(`/journal/${id}?password=${encodeURIComponent(editPassword)}`);
              queryClient.setQueryData(['journal', id], response.data.journal);
              setEditUnlocked(true);
              setEditPassword('');
            } catch (error) {
              setEditUnlockError('Invalid password. Please try again.');
            } finally {
              setIsVerifyingPassword(false);
            }
          }} style={{maxWidth: 320, margin: '2rem auto'}}>
            <input
              type="password"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              placeholder="Enter password"
              style={{width: '100%', padding: '0.75em', fontSize: '1.1em', marginBottom: 8}}
              disabled={isVerifyingPassword}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={isVerifyingPassword} style={{width: '100%'}}>
              {isVerifyingPassword ? 'Unlocking...' : 'Unlock'}
            </button>
            {editUnlockError && <div style={{color: 'red', marginTop: 8}}>{editUnlockError}</div>}
          </form>
        </div>
      </div>
    );
  }

  // When editing, include currentPassword in PUT request if journal is encrypted
  const onSubmit = async (data) => {
    if (isEncrypted && !encryptionPassword.trim()) {
      toast.error('Please enter an encryption password');
      return;
    }
    if (uploadedFiles.some(f => f.uploading)) {
      toast.error('Please wait for files to finish uploading');
      return;
    }

    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    // Add encryption settings
    formData.append('isEncrypted', isEncrypted);
    if (isEncrypted && encryptionPassword) {
      formData.append('encryptionPassword', encryptionPassword);
    }

    // Check if we already have the password in the cache
    const cachedJournal = id ? queryClient.getQueryData(['journal', id]) : null;
    const cachedPassword = cachedJournal?.unlockedPassword;

    // If editing an encrypted journal and we don't have the cached password
    if (id && journalData?.isEncrypted && !cachedPassword) {
      setPasswordModalConfig({
        title: "Verify Current Password",
        description: "Enter the current password to edit this encrypted journal.",
        onSubmit: async (password) => {
          try {
            setIsVerifyingPassword(true);
            // Verify the password
            await api.get(`/journal/${id}?password=${encodeURIComponent(password)}`);
            
            // Add the password to formData
            formData.append('currentPassword', password);
            
            // Make the update request
            const url = id ? `/journal/${id}` : '/journal';
            const response = await api.put(url, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setShowPasswordModal(false);
            toast.success('Journal updated successfully!');
            queryClient.invalidateQueries(['journals']);
            queryClient.invalidateQueries(['journalStats']);
            navigate('/journal');
          } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save journal');
          } finally {
            setIsVerifyingPassword(false);
          }
        }
      });
      setShowPasswordModal(true);
      return;
    }

    // If we have the cached password, use it
    if (id && journalData?.isEncrypted && cachedPassword) {
      formData.append('currentPassword', cachedPassword);
    }

    // Add files
    uploadedFiles.forEach((fileObj) => {
      formData.append('media', fileObj.file);
    });

    try {
      const url = id ? `/journal/${id}` : '/journal';
      const response = await api[id ? 'put' : 'post'](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(id ? 'Journal updated successfully!' : 'Journal created successfully!');
      queryClient.invalidateQueries(['journals']);
      queryClient.invalidateQueries(['journalStats']);
      navigate('/journal');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save journal');
    }
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