const TodoList = require('../models/TodoList');
const { validationResult } = require('express-validator');

// @desc    Get all todo items for user
// @route   GET /api/todo-list
// @access  Private
exports.getTodoList = async (req, res) => {
  try {
    const todoList = await TodoList.find({ 
      userId: req.user.id
    }).sort({ priority: -1, dueDate: 1, createdAt: -1 });

    res.json({
      success: true,
      data: todoList
    });
  } catch (error) {
    console.error('Get todo list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching todo list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new todo item
// @route   POST /api/todo-list
// @access  Private
exports.createTodoItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { task, priority, dueDate } = req.body;

    const todoItem = await TodoList.create({
      userId: req.user.id,
      task,
      priority: priority || 'Medium',
      dueDate: dueDate ? new Date(dueDate) : null
    });

    res.status(201).json({
      success: true,
      message: 'Todo item created successfully',
      data: todoItem
    });
  } catch (error) {
    console.error('Create todo item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating todo item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update todo item
// @route   PUT /api/todo-list/:id
// @access  Private
exports.updateTodoItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { task, priority, dueDate } = req.body;

    const todoItem = await TodoList.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!todoItem) {
      return res.status(404).json({
        success: false,
        message: 'Todo item not found'
      });
    }

    todoItem.task = task || todoItem.task;
    todoItem.priority = priority || todoItem.priority;
    todoItem.dueDate = dueDate ? new Date(dueDate) : todoItem.dueDate;

    await todoItem.save();

    res.json({
      success: true,
      message: 'Todo item updated successfully',
      data: todoItem
    });
  } catch (error) {
    console.error('Update todo item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating todo item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Toggle todo item completion
// @route   PATCH /api/todo-list/:id/toggle
// @access  Private
exports.toggleTodoItem = async (req, res) => {
  try {
    const todoItem = await TodoList.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!todoItem) {
      return res.status(404).json({
        success: false,
        message: 'Todo item not found'
      });
    }

    todoItem.isCompleted = !todoItem.isCompleted;
    await todoItem.save();

    res.json({
      success: true,
      message: `Todo item ${todoItem.isCompleted ? 'completed' : 'uncompleted'}`,
      data: todoItem
    });
  } catch (error) {
    console.error('Toggle todo item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling todo item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Cut todo item (mark as completed and will be deleted on refresh)
// @route   PATCH /api/todo-list/:id/cut
// @access  Private
exports.cutTodoItem = async (req, res) => {
  try {
    const todoItem = await TodoList.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!todoItem) {
      return res.status(404).json({
        success: false,
        message: 'Todo item not found'
      });
    }

    // Mark as completed and add a flag to indicate it should be deleted on refresh
    todoItem.isCompleted = true;
    todoItem.isCut = true; // Add this field to the model
    await todoItem.save();

    res.json({
      success: true,
      message: 'Todo item cut successfully. It will be removed after page refresh.',
      data: todoItem
    });
  } catch (error) {
    console.error('Cut todo item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cutting todo item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete todo item
// @route   DELETE /api/todo-list/:id
// @access  Private
exports.deleteTodoItem = async (req, res) => {
  try {
    const todoItem = await TodoList.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!todoItem) {
      return res.status(404).json({
        success: false,
        message: 'Todo item not found'
      });
    }

    res.json({
      success: true,
      message: 'Todo item deleted successfully'
    });
  } catch (error) {
    console.error('Delete todo item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting todo item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete completed todo items
// @route   DELETE /api/todo-list/completed
// @access  Private
// @desc    Undo cutting a todo item
// @route   PATCH /api/todo-list/:id/undo-cut
// @access  Private
exports.undoCutTodoItem = async (req, res) => {
  try {
    const todoItem = await TodoList.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!todoItem) {
      return res.status(404).json({
        success: false,
        message: 'Todo item not found'
      });
    }

    // Revert the cut status
    todoItem.isCompleted = false;
    todoItem.isCut = false;
    await todoItem.save();

    res.json({
      success: true,
      message: 'Todo item cut undone.',
      data: todoItem
    });
  } catch (error) {
    console.error('Undo cut todo item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error undoing cut on todo item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.deleteCompletedTodos = async (req, res) => {
  try {
    const result = await TodoList.deleteMany({
      userId: req.user.id,
      isCompleted: true
    });

    res.json({
      success: true,
      message: `${result.deletedCount} completed todo items deleted successfully`
    });
  } catch (error) {
    console.error('Delete completed todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting completed todo items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}; 