const mongoose = require('mongoose');

const todoListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: String,
    required: [true, 'Task is required'],
    trim: true,
    maxlength: [200, 'Task cannot exceed 200 characters']
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isCut: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
todoListSchema.index({ userId: 1, isCompleted: 1 });
todoListSchema.index({ userId: 1, priority: 1 });
todoListSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model('TodoList', todoListSchema); 