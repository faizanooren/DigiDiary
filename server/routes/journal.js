const express = require('express');
const { body } = require('express-validator');
const {
  createJournal,
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
  getJournalStats,
  getJournalFilterStats,
  verifyJournalPassword
} = require('../controllers/journalController');
const { protect } = require('../middlewares/auth');
const { uploadMultiple } = require('../middlewares/upload');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Validation middleware
const journalValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required'),
  body('moodRating')
    .isInt({ min: 1, max: 10 })
    .withMessage('Mood rating must be between 1 and 10'),
  body('isEncrypted')
    .optional()
    .isBoolean()
    .withMessage('isEncrypted must be a boolean'),
  body('encryptionPassword')
    .optional()
    .isLength({ min: 4 })
    .withMessage('Encryption password must be at least 4 characters'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Routes
router.post('/', uploadMultiple, journalValidation, createJournal);
router.get('/', getJournals);
router.get('/stats', getJournalStats);
router.get('/filter-stats', getJournalFilterStats);
router.get('/:id', getJournal);
router.post('/:id/verify-password', verifyJournalPassword);
router.put('/:id', uploadMultiple, updateJournal);
router.delete('/:id', deleteJournal);

module.exports = router;