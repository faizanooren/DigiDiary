const express = require('express');
const router = express.Router();
const { getStreak, checkStreak } = require('../controllers/streakController');
const { protect } = require('../middlewares/auth');

// @route   GET /api/streak
// @desc    Get user streak data
// @access  Private
router.get('/', protect, getStreak);

// @route   POST /api/streak/check
// @desc    Check and reset streak if needed
// @access  Private
router.post('/check', protect, checkStreak);

module.exports = router;
