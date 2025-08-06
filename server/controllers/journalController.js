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
        // Convert Windows path to URL format and ensure proper URL structure
        const url = file.path.replace(/\\/g, '/');
        media.push({
          url: url,
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

    res.json({
      success: true,
      journals,
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

    // If journal is encrypted, check if password is provided
    if (journal.isEncrypted) {
      const { password } = req.query;
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required for encrypted journal',
          requiresPassword: true
        });
      }

      // Get journal with password field for comparison
      const journalWithPassword = await Journal.findById(req.params.id).select('+encryptionPassword');
      const isPasswordValid = await journalWithPassword.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    res.json({
      success: true,
      journal
    });
  } catch (error) {
    console.error('Get journal error:', error);
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

    // If journal is encrypted, verify current password before allowing edit
    if (journal.isEncrypted) {
      const { currentPassword } = req.body;
      if (!currentPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password required to edit encrypted journal'
        });
      }

      const journalWithPassword = await Journal.findById(req.params.id).select('+encryptionPassword');
      const isPasswordValid = await journalWithPassword.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid current password'
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

    const { getFileUrl } = require('../middlewares/upload');

    // Handle media files
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        media.push({
          url: getFileUrl(file.filename, 'journals'),
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          filename: file.filename,
          originalname: file.originalname,
          size: file.size
        });
      });
    }

    journal = await Journal.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        media: media.length > 0 ? media : journal.media,
        moodRating,
        isEncrypted,
        encryptionPassword,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : journal.tags,
        isPublic
      },
      { new: true, runValidators: true }
    ).populate('user', 'fullName surname');

    res.json({
      success: true,
      message: 'Journal entry updated successfully',
      journal
    });
  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating journal entry',
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

    await Journal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete journal error:', error);
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