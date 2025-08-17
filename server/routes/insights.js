const express = require('express');
const {
  getMoodInsights,
  getDashboardStats
} = require('../controllers/insightsController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes
router.get('/', getMoodInsights);
router.get('/stats', getDashboardStats);

module.exports = router;