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
  body('mobileNumber')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid mobile number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('hobby')
    .optional()
    .isIn([
      'reading', 'writing', 'photography', 'cooking', 'gardening', 'painting',
      'music', 'sports', 'travel', 'gaming', 'fitness', 'dancing', 'hiking', 'other'
    ])
    .withMessage('Please select a valid hobby'),
  body('profession')
    .optional()
    .isIn(['student', 'software-developer', 'designer', 'teacher', 'doctor', 'engineer', 'marketing', 'sales', 'manager', 'entrepreneur', 'freelancer', 'other'])
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