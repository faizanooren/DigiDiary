const User = require('../models/User');
const Journal = require('../models/Journal');

// Helper function to calculate streaks from all journal entries
const calculateStreaksFromJournals = async (userId) => {
  try {
    // Get all journal entries for the user, sorted by date (oldest first)
    const journals = await Journal.find({ user: userId })
      .sort({ createdAt: 1 })
      .select('createdAt');

    if (journals.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
        totalEntries: 0
      };
    }

    // Group journals by date (ignore time)
    const journalDates = new Set();
    journals.forEach(journal => {
      const date = new Date(journal.createdAt);
      date.setHours(0, 0, 0, 0);
      journalDates.add(date.getTime());
    });

    // Convert to sorted array of unique dates
    const uniqueDates = Array.from(journalDates)
      .map(timestamp => new Date(timestamp))
      .sort((a, b) => a - b);

    if (uniqueDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
        totalEntries: 0
      };
    }

    // Calculate current streak (working backwards from today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Calculate longest streak by going through all dates
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = uniqueDates[i - 1];
      const currentDate = uniqueDates[i];
      
      const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Gap in dates, update longest streak and reset
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    // Don't forget to check the final streak
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak (from most recent entry backwards)
    const lastEntryDate = uniqueDates[uniqueDates.length - 1];
    const daysSinceLastEntry = Math.floor((today - lastEntryDate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastEntry <= 1) {
      // Last entry was today or yesterday, calculate current streak
      currentStreak = 1;
      
      // Work backwards to find the current streak
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const currentDate = uniqueDates[i + 1];
        const prevDate = uniqueDates[i];
        
        const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      // More than 1 day since last entry, current streak is 0
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak,
      lastEntryDate,
      totalEntries: journals.length
    };
  } catch (error) {
    console.error('Error calculating streaks:', error);
    throw error;
  }
};

// @desc    Get user streak data (calculated from all journal entries)
// @route   GET /api/streak
// @access  Private
exports.getStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate streaks from all journal entries
    const streakData = await calculateStreaksFromJournals(req.user.id);

    // Update user model with calculated values (for caching)
    user.streakCount = streakData.currentStreak;
    user.longestStreak = streakData.longestStreak;
    user.lastEntryDate = streakData.lastEntryDate;
    await user.save();

    res.json({
      success: true,
      streak: {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastEntryDate: streakData.lastEntryDate,
        totalEntries: streakData.totalEntries
      }
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching streak data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update user streak based on journal entry (now recalculates from all entries)
// @route   POST /api/streak/update
// @access  Private (called internally when journal is created)
exports.updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Recalculate streaks from all journal entries
    const streakData = await calculateStreaksFromJournals(userId);

    // Update user model with calculated values
    user.streakCount = streakData.currentStreak;
    user.longestStreak = streakData.longestStreak;
    user.lastEntryDate = streakData.lastEntryDate;
    await user.save();

    console.log(`Streak updated for user ${userId}: Current=${streakData.currentStreak}, Longest=${streakData.longestStreak}`);
  } catch (error) {
    console.error('Update streak error:', error);
  }
};

// @desc    Check and recalculate streak (called on login or manually)
// @route   POST /api/streak/check
// @access  Private
exports.checkStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Recalculate streaks from all journal entries
    const streakData = await calculateStreaksFromJournals(req.user.id);

    // Update user model with calculated values
    user.streakCount = streakData.currentStreak;
    user.longestStreak = streakData.longestStreak;
    user.lastEntryDate = streakData.lastEntryDate;
    await user.save();

    res.json({
      success: true,
      streak: {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastEntryDate: streakData.lastEntryDate,
        totalEntries: streakData.totalEntries
      },
      message: 'Streak recalculated from all journal entries'
    });
  } catch (error) {
    console.error('Check streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking streak',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Recalculate streaks for all users (admin/maintenance function)
// @route   POST /api/streak/recalculate-all
// @access  Private
exports.recalculateAllStreaks = async (req, res) => {
  try {
    const users = await User.find({}).select('_id');
    let updatedCount = 0;

    for (const user of users) {
      try {
        const streakData = await calculateStreaksFromJournals(user._id);
        
        await User.findByIdAndUpdate(user._id, {
          streakCount: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          lastEntryDate: streakData.lastEntryDate
        });
        
        updatedCount++;
      } catch (error) {
        console.error(`Error updating streak for user ${user._id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Recalculated streaks for ${updatedCount} users`,
      updatedCount
    });
  } catch (error) {
    console.error('Recalculate all streaks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recalculating streaks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Export the helper function for use in other controllers
exports.calculateStreaksFromJournals = calculateStreaksFromJournals;
