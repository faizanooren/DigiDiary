const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  updateProfilePicture,
  removeProfilePicture,
  changePassword,
  deleteAccount,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { uploadProfilePicture } = require('../middlewares/upload');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Validation middleware
const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('surname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Surname must be between 2 and 50 characters'),
  body('mobileNumber')
    .if(body('mobileNumber').notEmpty())
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid mobile number'),
  body('dateOfBirth')
    .if(body('dateOfBirth').notEmpty())
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('hobby')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      const validHobbies = [
        'Reading', 'Writing', 'Photography', 'Cooking', 'Gardening', 'Painting',
        'Music', 'Dancing', 'Sports', 'Travel', 'Gaming', 'Crafting',
        'Fitness', 'Yoga', 'Meditation', 'Technology', 'Art', 'Fashion',
        'Food', 'Nature', 'Science', 'History', 'Languages', 'Other'
      ];
      // Convert to proper case for validation
      return validHobbies.some(h => h.toLowerCase() === value.toLowerCase());
    })
    .withMessage('Please select a valid hobby'),
  body('profession')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      const validProfessions = ['Student', 'Employee', 'Freelancer', 'Entrepreneur', 'Retired', 'Other'];
      // Convert to proper case for validation
      return validProfessions.some(p => p.toLowerCase() === value.toLowerCase());
    })
    .withMessage('Please select a valid profession'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Institution name cannot exceed 100 characters'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
];

// Routes
router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/profile-picture', uploadProfilePicture, updateProfilePicture);
router.delete('/profile-picture', removeProfilePicture);
router.put('/change-password', changePasswordValidation, changePassword);
router.delete('/account', deleteAccountValidation, deleteAccount);
router.get('/stats', getUserStats);

module.exports = router; 