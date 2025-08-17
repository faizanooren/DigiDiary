const User = require('../models/User');
const { validationResult } = require('express-validator');
const { getFileUrl, deleteFile } = require('../middlewares/upload');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Transform dates to ISO string format for frontend
    const userData = user.toObject();
    if (userData.dateOfBirth) {
      userData.dateOfBirth = new Date(userData.dateOfBirth).toISOString().split('T')[0];
    }

    // Add profile picture URL if it exists
    if (userData.profilePicture && !userData.profilePicture.startsWith('http')) {
      userData.profilePicture = `${process.env.SERVER_URL}${userData.profilePicture}`;
    }

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    console.log('Profile update request body:', req.body);
    console.log('User ID:', req.user.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Find user first
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Define updatable fields
    const updatableFields = [
      'fullName', 'surname', 'mobileNumber', 'dateOfBirth', 
      'hobby', 'profession', 'institution', 'companyName', 'theme'
    ];

    let isModified = false;

    // Process and apply updates, checking for actual changes
    updatableFields.forEach(field => {
      // Check if the field is present in the request body
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = req.body[field];
        let newValue;

        // If value is an empty string, set field to undefined to clear it
        if (value === '') {
          newValue = undefined;
        } else if (field === 'dateOfBirth' && value) {
          newValue = new Date(value);
        } else if ((field === 'hobby' || field === 'profession') && value) {
          newValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        } else {
          newValue = value;
        }

        // Compare new value with the existing one to see if a change is needed
        const oldValue = user[field];
        let valuesDiffer = false;

        if (field === 'dateOfBirth' && oldValue instanceof Date) {
          // For dates, compare ISO strings to avoid timezone issues
          const oldDateString = oldValue.toISOString().split('T')[0];
          const newDateString = newValue ? new Date(newValue).toISOString().split('T')[0] : undefined;
          valuesDiffer = oldDateString !== newDateString;
        } else {
          valuesDiffer = oldValue !== newValue;
        }

        if (valuesDiffer) {
          user[field] = newValue;
          isModified = true;
        }
      }
    });

    // Save only if there are actual changes
    if (isModified) {
      await user.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update profile picture
// @route   PUT /api/user/profile-picture
// @access  Private
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a profile picture'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      try {
        const oldPath = user.profilePicture.replace('/uploads/', '');
        deleteFile(oldPath);
      } catch (deleteError) {
        console.error('Error deleting old profile picture:', deleteError);
        // Continue with the upload even if delete fails
      }
    }

    // Update profile picture URL using relative path
    const filename = req.file.filename;
    user.profilePicture = `/uploads/profiles/${filename}`;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile picture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Remove profile picture
// @route   DELETE /api/user/profile-picture
// @access  Private
exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.profilePicture) {
      try {
        const relativePath = user.profilePicture.replace('/uploads/', '');
        deleteFile(relativePath);
      } catch (deleteError) {
        console.error('Error deleting profile picture:', deleteError);
        // continue to clear db reference even if file delete fails
      }

      user.profilePicture = undefined;
      await user.save();
    }

    return res.json({
      success: true,
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing profile picture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/user/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete user
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate user stats
    const stats = {
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
      age: user.age,
      profileCompletion: calculateProfileCompletion(user)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to calculate profile completion percentage
const calculateProfileCompletion = (user) => {
  const fields = [
    'fullName', 'surname', 'email', 'mobileNumber', 
    'dateOfBirth', 'hobby', 'profession'
  ];
  
  let completedFields = 0;
  fields.forEach(field => {
    if (user[field]) completedFields++;
  });
  
  // Add profession-specific field
  if (user.profession === 'Student' && user.institution) completedFields++;
  if (user.profession !== 'Student' && user.companyName) completedFields++;
  
  return Math.round((completedFields / (fields.length + 1)) * 100);
}; 