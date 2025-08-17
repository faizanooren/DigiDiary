const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const journalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  media: {
    type: [{
      url: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true
      },
      filename: String,
      size: Number
    }],
    default: []
  },
  moodRating: {
    type: Number,
    required: [true, 'Mood rating is required'],
    min: [1, 'Mood rating must be at least 1'],
    max: [10, 'Mood rating cannot exceed 10']
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionPassword: {
    type: String,
    select: false
  },
  passwordFailedAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  passwordLockoutUntil: {
    type: Date,
    select: false
  },
  tags: {
    type: [String],
    default: []
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },
  weather: {
    temperature: Number,
    condition: String,
    humidity: Number
  }
}, {
  timestamps: true
});

// Index for better query performance
journalSchema.index({ user: 1, createdAt: -1 });
journalSchema.index({ user: 1, moodRating: 1 });
journalSchema.index({ user: 1, tags: 1 });

// Virtual for mood emoji
journalSchema.virtual('moodEmoji').get(function() {
  const emojis = {
    1: '😢', 2: '😞', 3: '😐', 4: '😕', 5: '😊',
    6: '😄', 7: '😃', 8: '😁', 9: '🤩', 10: '🥰'
  };
  return emojis[this.moodRating] || '😐';
});

// Virtual for reading time (rough estimate)
journalSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(' ').length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Method to get formatted date
journalSchema.methods.getFormattedDate = function() {
  return this.createdAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Method to get time ago
journalSchema.methods.getTimeAgo = function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

// Pre-save middleware to hash password
journalSchema.pre('save', async function(next) {
  if (!this.isModified('encryptionPassword') || !this.encryptionPassword) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.encryptionPassword = await bcrypt.hash(this.encryptionPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
journalSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.encryptionPassword) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.encryptionPassword);
};

// Method to verify password and handle lockouts
journalSchema.methods.verifyPasswordAndHandleLockout = async function(candidatePassword) {
  if (this.passwordLockoutUntil && this.passwordLockoutUntil > new Date()) {
    const remainingTime = Math.ceil((this.passwordLockoutUntil - new Date()) / (1000 * 60));
    const error = new Error(`This journal is locked due to too many failed password attempts. Please try again in ${remainingTime} minutes.`);
    error.status = 429; // Too Many Requests
    throw error;
  }

  const isMatch = await this.comparePassword(candidatePassword);

  if (isMatch) {
    // Password is correct, reset attempts if there were any previous failed ones
    if (this.passwordFailedAttempts > 0) {
      this.passwordFailedAttempts = 0;
      this.passwordLockoutUntil = null;
      await this.save();
    }
    return true;
  } else {
    // Password is incorrect, increment attempts
    this.passwordFailedAttempts = (this.passwordFailedAttempts || 0) + 1;
    if (this.passwordFailedAttempts >= 3) {
      // Lock for 3 hours
      this.passwordLockoutUntil = new Date(Date.now() + 3 * 60 * 60 * 1000);
    }
    await this.save();
    return false;
  }
};

// Ensure virtual fields are serialized
journalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Journal', journalSchema);