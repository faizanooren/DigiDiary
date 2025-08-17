const Journal = require('../models/Journal');
const TodoList = require('../models/TodoList');
const BucketList = require('../models/BucketList');
const { validationResult } = require('express-validator');

// @desc    Get dashboard stats
// @route   GET /api/insights/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const journalCount = await Journal.countDocuments({ user: userId });
    const todoCount = await TodoList.countDocuments({ userId: userId });
    const bucketListCount = await BucketList.countDocuments({ userId: userId });

    const moodStats = await Journal.aggregate([
      { $match: { user: userId, isEncrypted: { $ne: true }, moodRating: { $exists: true } } },
      { $group: { _id: null, averageMood: { $avg: "$moodRating" } } },
    ]);

    const averageMood = moodStats.length > 0 ? moodStats[0].averageMood : 0;

    res.json({
      success: true,
      data: {
        journalCount,
        todoCount,
        bucketListCount,
        averageMood,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get mood insights
// @route   GET /api/insights
// @access  Private
exports.getMoodInsights = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1); // Year
    }

    // Get journal entries with mood ratings, excluding encrypted ones
    const journalEntries = await Journal.find({
      user: req.user.id,
      createdAt: { $gte: startDate, $lte: now },
      moodRating: { $exists: true, $ne: null },
      isEncrypted: false // Exclude protected journals
    }).sort({ createdAt: 1 });

    if (journalEntries.length === 0) {
      return res.json({
        success: true,
        data: {
          averageMood: 0,
          highestMood: null,
          lowestMood: null,
          moodTrend: [],
          totalEntries: 0,
          period
        }
      });
    }

    // Calculate insights
    const moodRatings = journalEntries.map(entry => entry.moodRating);
    const averageMood = moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length;
    
    const highestMoodEntry = journalEntries.reduce((max, entry) => 
      entry.moodRating > max.moodRating ? entry : max
    );
    
    const lowestMoodEntry = journalEntries.reduce((min, entry) => 
      entry.moodRating < min.moodRating ? entry : min
    );

    // Group by date for daily averages
    const dailyMoods = {};
    journalEntries.forEach(entry => {
      const date = entry.createdAt.toISOString().split('T')[0];
      if (!dailyMoods[date]) {
        dailyMoods[date] = [];
      }
      dailyMoods[date].push(entry.moodRating);
    });

    const dailyAverages = Object.entries(dailyMoods).map(([date, ratings]) => ({
      date,
      averageMood: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    }));

    res.json({
      success: true,
      data: {
        averageMood: Math.round(averageMood * 10) / 10,
        highestMood: {
          score: highestMoodEntry.moodRating,
          date: highestMoodEntry.createdAt.toISOString().split('T')[0],
          title: highestMoodEntry.title
        },
        lowestMood: {
          score: lowestMoodEntry.moodRating,
          date: lowestMoodEntry.createdAt.toISOString().split('T')[0],
          title: lowestMoodEntry.title
        },
        moodTrend: dailyAverages,
        totalEntries: journalEntries.length,
        period
      }
    });
  } catch (error) {
    console.error('Get mood insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mood insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};