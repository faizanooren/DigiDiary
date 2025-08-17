const express = require('express');
const { body } = require('express-validator');
const {
  getBucketList,
  createBucketListItem,
  updateBucketListItem,
  toggleBucketListItem,
  cutBucketListItem,
  deleteBucketListItem
} = require('../controllers/bucketListController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Validation middleware
const bucketListValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid target date')
];

// Routes
router.get('/', getBucketList);
router.post('/', bucketListValidation, createBucketListItem);
router.put('/:id', bucketListValidation, updateBucketListItem);
router.patch('/:id/toggle', toggleBucketListItem);
router.patch('/:id/cut', cutBucketListItem);
router.delete('/:id', deleteBucketListItem);

module.exports = router; 