const express = require('express');
const { body } = require('express-validator');
const {
  getTodoList,
  createTodoItem,
  updateTodoItem,
  toggleTodoItem,
  cutTodoItem,
  deleteTodoItem,
  deleteCompletedTodos,
  undoCutTodoItem
} = require('../controllers/todoListController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Validation middleware
const todoListValidation = [
  body('task')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task must be between 1 and 200 characters'),
  body('priority')
    .optional()
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Priority must be High, Medium, or Low'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid due date')
];

// Routes
router.get('/', getTodoList);
router.post('/', todoListValidation, createTodoItem);
router.put('/:id', todoListValidation, updateTodoItem);
router.patch('/:id/toggle', toggleTodoItem);
router.patch('/:id/cut', cutTodoItem);
router.patch('/:id/undo-cut', undoCutTodoItem);
router.delete('/:id', deleteTodoItem);
router.delete('/completed', deleteCompletedTodos);

module.exports = router; 