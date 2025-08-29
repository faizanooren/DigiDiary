const express = require('express');
const router = express.Router();
const { getRandomQuote, checkForMotivationalQuote } = require('../controllers/quotesController');
const { protect } = require('../middlewares/auth');

// @route   GET /api/quotes
// @desc    Get a random motivational quote
// @access  Private
router.get('/', protect, getRandomQuote);

// @route   GET /api/quotes/check
// @desc    Check if user needs motivational quote based on latest mood
// @access  Private
router.get('/check', protect, checkForMotivationalQuote);

module.exports = router;
