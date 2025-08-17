const Journal = require('../models/Journal');
const { validationResult } = require('express-validator');

// @desc    Create new journal entry
// @route   POST /api/journal
// @access  Private
exports.createJournal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      content,
      moodRating,
      isEncrypted,
      encryptionPassword,
      tags,
      isPublic
    } = req.body;

    // Handle media files
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Generate proper URL path for uploaded files
        const relativePath = file.path.replace(/\\/g, '/').replace(/.*\/uploads\//, '');
        media.push({
          url: `/uploads/${relativePath}`,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          filename: file.originalname,
          size: file.size
        });
      });
    }

    const journal = await Journal.create({
      user: req.user.id,
      title,
      content,
      media,
      moodRating,
      isEncrypted,
      encryptionPassword,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic
    });

    await journal.populate('user', 'fullName surname');

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      journal
    });
  } catch (error) {
    console.error('Create journal error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Request files:', req.files);
    console.error('Request user:', req.user);
    res.status(500).json({
      success: false,
      message: 'Error creating journal entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all journal entries for user
// @route   GET /api/journal
// @access  Private
exports.getJournals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };

    // Add search functionality
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Add mood filter
    if (req.query.mood) {
      query.moodRating = parseInt(req.query.mood);
    }

    // Add date filter
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.createdAt = {
        $gte: date,
        $lt: nextDay
      };
    }

    const journals = await Journal.find(query)
      .populate('user', 'fullName surname')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Journal.countDocuments(query);

    // Sanitize journals to hide content for encrypted entries
    const sanitizedJournals = journals.map(journal => {
      const journalObj = journal.toObject();
      
      // If journal is encrypted, hide sensitive content
      if (journalObj.isEncrypted) {
        return {
          ...journalObj,
          title: '[Protected Journal]',
          content: '[Content is password protected]',
          moodRating: null,
          moodEmoji: '🔒',
          media: [], // Hide media for encrypted journals
          tags: [] // Hide tags for encrypted journals
        };
      }
      
      return journalObj;
    });

    res.json({
      success: true,
      journals: sanitizedJournals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching journal entries',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single journal entry
// @route   GET /api/journal/:id
// @access  Private
exports.getJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id)
      .populate('user', 'fullName surname');

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Check if user owns this journal or if it's public
    if (journal.user._id.toString() !== req.user.id && !journal.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If journal is encrypted, sanitize the output
    if (journal.isEncrypted) {
      const { password } = req.query; // Check for password in query for verified requests

      if (!password) {
        // If no password, return sanitized data and indicate it's locked
        const sanitizedJournal = {
          ...journal.toObject(),
          title: '[Protected Journal]',
          content: '[Content is password protected]',
          moodRating: null,
          media: [],
          tags: [],
          contentLocked: true,
        };
        return res.json({ success: true, journal: sanitizedJournal });
      }

      // If password is provided, verify it
      const journalWithPassword = await Journal.findById(req.params.id).select('+encryptionPassword +passwordFailedAttempts +passwordLockoutUntil');
      const isPasswordValid = await journalWithPassword.verifyPasswordAndHandleLockout(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password',
        });
      }

      // If password is valid, return the full journal
      return res.json({
        success: true,
        journal: journalWithPassword, // Return the full journal object
      });
    }

    res.json({
      success: true,
      journal,
    });
  } catch (error) {
    console.error('Get journal error:', error);
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching journal entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update journal entry
// @route   PUT /api/journal/:id
// @access  Private
exports.updateJournal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Check ownership
    if (journal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If journal is encrypted, verify password before allowing edit
    if (journal.isEncrypted) {
      const { password } = req.body;
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required to edit encrypted journal'
        });
      }

      const journalWithPassword = await Journal.findById(req.params.id).select('+encryptionPassword +passwordFailedAttempts +passwordLockoutUntil');
      const isPasswordValid = await journalWithPassword.verifyPasswordAndHandleLockout(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    const {
      title,
      content,
      moodRating,
      isEncrypted,
      encryptionPassword,
      tags,
      isPublic
    } = req.body;

    // Handle media files
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Generate proper URL path for uploaded files
        const relativePath = file.path.replace(/\\/g, '/').replace(/.*\/uploads\//, '');
        media.push({
          url: `/uploads/${relativePath}`,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          filename: file.originalname,
          size: file.size
        });
      });
    }

    // Update journal fields
    journal.title = title;
    journal.content = content;
    journal.media = media.length > 0 ? media : journal.media;
    journal.moodRating = moodRating;
    journal.isEncrypted = isEncrypted;
    if (encryptionPassword) {
      journal.encryptionPassword = encryptionPassword;
    }
    journal.tags = tags ? tags.split(',').map(tag => tag.trim()) : journal.tags;
    journal.isPublic = isPublic;

    // Save to trigger pre-save middleware for password hashing
    await journal.save();
    await journal.populate('user', 'fullName surname');

    res.json({
      success: true,
      message: 'Journal entry updated successfully',
      journal
    });
  } catch (error) {
    console.error('Update journal error:', error);
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating journal entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Verify journal password with action routing
// @route   POST /api/journal/:id/verify-password
// @access  Private
exports.verifyJournalPassword = async (req, res) => {
  try {
    const { password, action } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (!action || !['view', 'edit', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action is required (view, edit, delete)'
      });
    }

    const journal = await Journal.findById(req.params.id).select('+encryptionPassword +passwordFailedAttempts +passwordLockoutUntil');

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Check ownership
    if (journal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if journal is encrypted
    if (!journal.isEncrypted) {
      return res.status(400).json({
        success: false,
        message: 'Journal is not password protected'
      });
    }

    // Check if account is locked
    if (journal.passwordLockoutUntil && journal.passwordLockoutUntil > new Date()) {
      const remainingHours = Math.ceil((journal.passwordLockoutUntil - new Date()) / (1000 * 60 * 60));
      return res.status(429).json({
        success: false,
        message: `You have exceeded the maximum number of password attempts. Please try again in ${remainingHours} hour(s).`,
        lockoutUntil: journal.passwordLockoutUntil
      });
    }

    // Verify password
    const isPasswordValid = await journal.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed attempts
      journal.passwordFailedAttempts = (journal.passwordFailedAttempts || 0) + 1;
      
      if (journal.passwordFailedAttempts >= 3) {
        // Lock for 3 hours after 3 failed attempts
        journal.passwordLockoutUntil = new Date(Date.now() + 3 * 60 * 60 * 1000);
        await journal.save();
        
        return res.status(429).json({
          success: false,
          message: 'You have lost 3 attempts. Try again after 3 hours.',
          lockoutUntil: journal.passwordLockoutUntil,
          attemptsExceeded: true
        });
      }
      
      await journal.save();
      const remainingAttempts = 3 - journal.passwordFailedAttempts;
      
      return res.status(401).json({
        success: false,
        message: `Password is wrong. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
      });
    }

    // Password is correct, reset failed attempts
    if (journal.passwordFailedAttempts > 0) {
      journal.passwordFailedAttempts = 0;
      journal.passwordLockoutUntil = null;
      await journal.save();
    }

    // Handle different actions
    let responseData = {
      success: true,
      message: 'Password verified successfully',
      action
    };

    if (action === 'delete') {
      // For delete action, perform the deletion immediately
      await Journal.findByIdAndDelete(req.params.id);
      responseData.message = 'Journal entry deleted successfully';
      responseData.deleted = true;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Verify journal password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete journal entry
// @route   DELETE /api/journal/:id
// @access  Private
exports.deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Check ownership
    if (journal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If journal is encrypted, verify password before allowing delete
    if (journal.isEncrypted) {
      const { password } = req.body;
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required to delete encrypted journal',
          requiresPassword: true
        });
      }

      const journalWithPassword = await Journal.findById(req.params.id).select('+encryptionPassword +passwordFailedAttempts +passwordLockoutUntil');
      const isPasswordValid = await journalWithPassword.verifyPasswordAndHandleLockout(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    await Journal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete journal error:', error);
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting journal entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get journal statistics
// @route   GET /api/journal/stats
// @access  Private
exports.getJournalStats = async (req, res) => {
  try {
    const totalEntries = await Journal.countDocuments({ user: req.user.id });
    
    const moodStats = await Journal.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: '$moodRating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const monthlyStats = await Journal.aggregate([
      { $match: { user: req.user.id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const averageMood = await Journal.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: null, avgMood: { $avg: '$moodRating' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalEntries,
        moodStats,
        monthlyStats,
        averageMood: averageMood[0]?.avgMood || 0
      }
    });
  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching journal statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}; 