const BucketList = require('../models/BucketList');
const { validationResult } = require('express-validator');

// @desc    Get all bucket list items for user
// @route   GET /api/bucket-list
// @access  Private
exports.getBucketList = async (req, res) => {
  try {
    const bucketList = await BucketList.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bucketList
    });
  } catch (error) {
    console.error('Get bucket list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bucket list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new bucket list item
// @route   POST /api/bucket-list
// @access  Private
exports.createBucketListItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, targetDate } = req.body;

    const bucketListItem = await BucketList.create({
      userId: req.user.id,
      title,
      description,
      targetDate: targetDate ? new Date(targetDate) : null
    });

    res.status(201).json({
      success: true,
      message: 'Bucket list item created successfully',
      data: bucketListItem
    });
  } catch (error) {
    console.error('Create bucket list item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bucket list item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update bucket list item
// @route   PUT /api/bucket-list/:id
// @access  Private
exports.updateBucketListItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, targetDate } = req.body;

    const bucketListItem = await BucketList.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!bucketListItem) {
      return res.status(404).json({
        success: false,
        message: 'Bucket list item not found'
      });
    }

    bucketListItem.title = title || bucketListItem.title;
    bucketListItem.description = description !== undefined ? description : bucketListItem.description;
    bucketListItem.targetDate = targetDate ? new Date(targetDate) : bucketListItem.targetDate;

    await bucketListItem.save();

    res.json({
      success: true,
      message: 'Bucket list item updated successfully',
      data: bucketListItem
    });
  } catch (error) {
    console.error('Update bucket list item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bucket list item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Toggle bucket list item completion
// @route   PATCH /api/bucket-list/:id/toggle
// @access  Private
exports.toggleBucketListItem = async (req, res) => {
  try {
    const bucketListItem = await BucketList.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!bucketListItem) {
      return res.status(404).json({
        success: false,
        message: 'Bucket list item not found'
      });
    }

    bucketListItem.isCompleted = !bucketListItem.isCompleted;
    await bucketListItem.save();

    res.json({
      success: true,
      message: `Bucket list item ${bucketListItem.isCompleted ? 'completed' : 'uncompleted'}`,
      data: bucketListItem
    });
  } catch (error) {
    console.error('Toggle bucket list item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling bucket list item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Cut bucket list item (mark as completed but keep in database)
// @route   PATCH /api/bucket-list/:id/cut
// @access  Private
exports.cutBucketListItem = async (req, res) => {
  try {
    const bucketListItem = await BucketList.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!bucketListItem) {
      return res.status(404).json({
        success: false,
        message: 'Bucket list item not found'
      });
    }

    // Mark as completed but keep in database (unlike todo items)
    bucketListItem.isCompleted = true;
    await bucketListItem.save();

    res.json({
      success: true,
      message: 'Bucket list item cut successfully. It will remain in the list as completed.',
      data: bucketListItem
    });
  } catch (error) {
    console.error('Cut bucket list item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cutting bucket list item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete bucket list item
// @route   DELETE /api/bucket-list/:id
// @access  Private
exports.deleteBucketListItem = async (req, res) => {
  try {
    const bucketListItem = await BucketList.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!bucketListItem) {
      return res.status(404).json({
        success: false,
        message: 'Bucket list item not found'
      });
    }

    res.json({
      success: true,
      message: 'Bucket list item deleted successfully'
    });
  } catch (error) {
    console.error('Delete bucket list item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bucket list item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}; 