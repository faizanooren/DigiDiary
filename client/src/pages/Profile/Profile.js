import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Phone, 
  Calendar, 
  Heart, 
  Briefcase, 
  GraduationCap, 
  Building2,
  Save,
  Camera,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm();

  const watchedProfession = watch('profession');

  // Fetch user profile data
  const { data: profileData, isLoading } = useQuery(
    ['userProfile'],
    async () => {
      const response = await api.get('/user/profile');
      return response.data.user;
    },
    {
      onSuccess: (data) => {
        reset({
          fullName: data.fullName || '',
          surname: data.surname || '',
          mobileNumber: data.mobileNumber || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          hobby: data.hobby || '',
          profession: data.profession || '',
          institution: data.institution || '',
          companyName: data.companyName || ''
        });
      },
      onError: (error) => {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile data');
      },
      retry: 3,
      retryDelay: 1000
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      // Sanitize data before sending
      const payload = { ...data };
      if (payload.profession !== 'Student') {
        payload.institution = '';
      }
      if (payload.profession === 'Student' || !payload.profession) {
        payload.companyName = '';
      }
      const response = await api.put('/user/profile', payload);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Profile updated successfully!');
        updateUser(data.user);
        setIsEditing(false);
        queryClient.invalidateQueries(['userProfile']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      const response = await api.put('/user/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Profile picture updated!');
        updateUser(data.user);
        setUploadingImage(false);
        queryClient.invalidateQueries(['userProfile']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload image');
        setUploadingImage(false);
      }
    }
  );

  // Remove profile picture mutation
  const removeProfilePictureMutation = useMutation(
    async () => {
      const response = await api.delete('/user/profile-picture');
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Profile picture removed!');
        // Create a new user object with profilePicture set to null
        const updatedUser = { ...user, profilePicture: null };
        updateUser(updatedUser);
        queryClient.invalidateQueries(['userProfile']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove image');
      }
    }
  );

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setUploadingImage(true);
      uploadProfilePictureMutation.mutate(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };
  
  useEffect(() => {
    if (profileData) {
        const currentProfession = watch('profession');
        if (currentProfession !== 'Student') {
            setValue('institution', '');
        }
        if (currentProfession === 'Student' || !currentProfession) {
            setValue('companyName', '');
        }
    }
  }, [watch('profession'), profileData, setValue]);


  const calculateProfileCompletion = () => {
    if (!profileData) return 0;
    const fields = [
      profileData.fullName,
      profileData.surname,
      profileData.mobileNumber,
      profileData.dateOfBirth,
      profileData.hobby,
      profileData.profession,
    ];
    let filledFields = fields.filter(field => field && String(field).trim() !== '').length;
    if (profileData.profession === 'Student' && profileData.institution) {
        filledFields++;
    } else if (profileData.profession && profileData.profession !== 'Student' && profileData.companyName) {
        filledFields++;
    }
    const totalFields = fields.length + 1; // +1 for the conditional field (institution/companyName)
    return Math.round((filledFields / totalFields) * 100);
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <Loader2 className="loading-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <div className="profile-content">
        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="profile-picture-container">
            <div className="profile-picture">
              {profileData?.profilePicture ? (
                <img 
                  src={profileData.profilePicture} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                <User className="profile-placeholder" />
              )}
              {uploadingImage && (
                <div className="upload-overlay">
                  <Loader2 className="upload-spinner" />
                </div>
              )}
            </div>
            <div className="profile-actions">
              <label className="upload-button" htmlFor="profile-picture">
                <Camera size={16} />
                {uploadingImage ? 'Uploading...' : 'Change Photo'}
              </label>
              {profileData?.profilePicture && (
                <button 
                  className="remove-photo-button"
                  onClick={() => removeProfilePictureMutation.mutate()}
                  disabled={removeProfilePictureMutation.isLoading}
                >
                  {removeProfilePictureMutation.isLoading ? 'Removing...' : 'Remove Photo'}
                </button>
              )}
            </div>
            <div className="profile-name">
              <h3>{profileData?.fullName} {profileData?.surname}</h3>
              <p className="profile-email">{profileData?.email}</p>
            </div>
            <input
              id="profile-picture"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          
          <div className="profile-stats">
            <div className="completion-card">
              <div className="completion-header">
                <h3>Profile Completion</h3>
                <span className="completion-percentage">{calculateProfileCompletion()}%</span>
              </div>
              <div className="completion-bar">
                <div 
                  className="completion-fill" 
                  style={{ width: `${calculateProfileCompletion()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="profile-form-container">
          <div className="form-header">
            <h2>Personal Information</h2>
            {!isEditing ? (
              <button className="edit-button" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <div className="form-actions">
                <button 
                  className="cancel-button" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className="save-button" 
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || updateProfileMutation.isLoading}
                >
                  {isSubmitting || updateProfileMutation.isLoading ? (
                    <>
                      <Loader2 className="button-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName', { 
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  disabled={!isEditing}
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-message">{errors.fullName.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="surname">Surname *</label>
                <input
                  id="surname"
                  type="text"
                  {...register('surname', { 
                    required: 'Surname is required',
                    minLength: { value: 2, message: 'Surname must be at least 2 characters' }
                  })}
                  disabled={!isEditing}
                  className={errors.surname ? 'error' : ''}
                />
                {errors.surname && <span className="error-message">{errors.surname.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mobileNumber">Mobile Number</label>
                <div className="input-with-icon">
                  <Phone size={16} />
                  <input
                    id="mobileNumber"
                    type="tel"
                    {...register('mobileNumber', {
                      pattern: {
                        value: /^[0-9]{11}$/,
                        message: 'Please enter a valid 11-digit phone number'
                      }
                    })}
                    disabled={!isEditing}
                    placeholder="01712345678"
                    className={errors.mobileNumber ? 'error' : ''}
                  />
                </div>
                {errors.mobileNumber && <span className="error-message">{errors.mobileNumber.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <div className="input-with-icon">
                  <Calendar size={16} />
                  <input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    disabled={!isEditing}
                    className={errors.dateOfBirth ? 'error' : ''}
                  />
                </div>
                {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hobby">Hobby</label>
                <div className="input-with-icon">
                  <Heart size={16} />
                  <select
                    id="hobby"
                    {...register('hobby')}
                    disabled={!isEditing}
                    className={errors.hobby ? 'error' : ''}
                  >
                    <option value="">Select a hobby</option>
                    <option value="Reading">Reading</option>
                    <option value="Writing">Writing</option>
                    <option value="Photography">Photography</option>
                    <option value="Cooking">Cooking</option>
                    <option value="Gardening">Gardening</option>
                    <option value="Painting">Painting</option>
                    <option value="Music">Music</option>
                    <option value="Dancing">Dancing</option>
                    <option value="Sports">Sports</option>
                    <option value="Travel">Travel</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Crafting">Crafting</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Meditation">Meditation</option>
                    <option value="Technology">Technology</option>
                    <option value="Art">Art</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Food">Food</option>
                    <option value="Nature">Nature</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Languages">Languages</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.hobby && <span className="error-message">{errors.hobby.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="profession">Profession</label>
                <div className="input-with-icon">
                  <Briefcase size={16} />
                  <select
                    id="profession"
                    {...register('profession')}
                    disabled={!isEditing}
                    className={errors.profession ? 'error' : ''}
                  >
                    <option value="">Select profession</option>
                    <option value="Student">Student</option>
                    <option value="Employee">Employee</option>
                    <option value="Freelancer">Freelancer</option>
                    <option value="Entrepreneur">Entrepreneur</option>
                    <option value="Retired">Retired</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.profession && <span className="error-message">{errors.profession.message}</span>}
              </div>
            </div>

            {watchedProfession === 'Student' ? (
              <div className="form-group">
                <label htmlFor="institution">School/College/University</label>
                <div className="input-with-icon">
                  <GraduationCap size={16} />
                  <input
                    id="institution"
                    type="text"
                    {...register('institution')}
                    disabled={!isEditing}
                    placeholder="Enter your educational institution"
                    className={errors.institution ? 'error' : ''}
                  />
                </div>
                {errors.institution && <span className="error-message">{errors.institution.message}</span>}
              </div>
            ) : watchedProfession && watchedProfession !== 'Student' && watchedProfession !== '' ? (
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <div className="input-with-icon">
                  <Building2 size={16} />
                  <input
                    id="companyName"
                    type="text"
                    {...register('companyName')}
                    disabled={!isEditing}
                    placeholder="Enter your company name"
                    className={errors.companyName ? 'error' : ''}
                  />
                </div>
                {errors.companyName && <span className="error-message">{errors.companyName.message}</span>}
              </div>
            ) : null}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="disabled-input"
              />
              <small className="help-text">Email cannot be changed</small>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile; 