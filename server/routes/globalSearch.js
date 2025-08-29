const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/globalSearchController');
const { protect } = require('../middlewares/auth');

// @route   GET /api/search
// @desc    Global search across all content types
// @access  Private
router.get('/', protect, globalSearch);

module.exports = router;
