import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Square, 
  Calendar,
  Loader2,
  ListTodo,
  AlertTriangle,
  Clock,
  CheckCircle,
  Scissors
} from 'lucide-react';
import api from '../../utils/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import './TodoList.css';

const TodoList = () => {
  const deletionTimers = useRef({});
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    task: '',
    priority: 'Medium',
    dueDate: ''
  });
  const [modalState, setModalState] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  useEffect(() => {
    // Clear all timers on component unmount
    return () => {
      Object.values(deletionTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Fetch todo list items
  const { data: todoList, isLoading, error } = useQuery(
    ['todoList'],
    async () => {
      const response = await api.get('/todo-list');
      return response.data.data;
    },
    {
      onError: (error) => {
        console.error('Error fetching todo list:', error);
        toast.error('Failed to load todo list');
      }
    }
  );

  // Create todo item mutation
  const createMutation = useMutation(
    async (data) => {
      const response = await api.post('/todo-list', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Todo item added successfully!');
        setIsAdding(false);
        setFormData({ task: '', priority: 'Medium', dueDate: '' });
        queryClient.invalidateQueries(['todoList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add todo item');
      }
    }
  );

  // Update todo item mutation
  const updateMutation = useMutation(
    async ({ id, data }) => {
      const response = await api.put(`/todo-list/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Todo item updated successfully!');
        setEditingId(null);
        setFormData({ task: '', priority: 'Medium', dueDate: '' });
        queryClient.invalidateQueries(['todoList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update todo item');
      }
    }
  );

  // Toggle completion mutation
  const toggleMutation = useMutation(
    async (id) => {
      const response = await api.patch(`/todo-list/${id}/toggle`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(['todoList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update item');
      }
    }
  );

  // Delete todo item mutation
  const deleteMutation = useMutation(
    async (id) => {
      const response = await api.delete(`/todo-list/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Todo item deleted successfully!');
        queryClient.invalidateQueries(['todoList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete todo item');
      }
    }
  );

  // Delete completed todos mutation
  const deleteCompletedMutation = useMutation(
    async () => {
      const response = await api.delete('/todo-list/completed');
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(['todoList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete completed items');
      }
    }
  );

  // Undo cut mutation
  const undoCutMutation = useMutation(
    async (id) => {
      const response = await api.patch(`/todo-list/${id}/undo-cut`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Cut action undone!');
        queryClient.invalidateQueries(['todoList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to undo cut');
      }
    }
  );

  // Cut todo item mutation
  const cutMutation = useMutation(
    async (id) => {
      const response = await api.patch(`/todo-list/${id}/cut`);
      return response.data;
    },
    {
      onSuccess: (response) => {
        const { _id: id } = response.data;
        queryClient.invalidateQueries(['todoList']);

        const toastId = toast.custom(
          (t) => (
            <div
              className={`${t.visible ? 'animate-enter' : 'animate-leave'}
                max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  To-do item completed.
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  It will be removed in 5 minutes.
                </p>
              </div>
              <div className="flex border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    clearTimeout(deletionTimers.current[id]);
                    delete deletionTimers.current[id];
                    undoCutMutation.mutate(id);
                    toast.dismiss(t.id);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Undo
                </button>
              </div>
            </div>
          ),
          { duration: 300000 } // 5 minutes
        );

        // Set a timer to delete the item after 5 minutes
        deletionTimers.current[id] = setTimeout(() => {
          deleteMutation.mutate(id);
          toast.dismiss(toastId);
        }, 300000);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cut item');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task.trim()) {
      toast.error('Task is required');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      task: item.task,
      priority: item.priority,
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ task: '', priority: 'Medium', dueDate: '' });
  };

  const handleToggle = (id) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id) => {
    setModalState({
      isOpen: true,
      onConfirm: () => {
        deleteMutation.mutate(id);
        setModalState({ isOpen: false });
      },
      title: 'Delete Todo Item',
      message: 'Are you sure you want to delete this todo item? This action cannot be undone.',
    });
  };

  const handleCut = (id) => {
    cutMutation.mutate(id);
  };

  const handleDeleteCompleted = () => {
    setModalState({
      isOpen: true,
      onConfirm: () => {
        deleteCompletedMutation.mutate();
        setModalState({ isOpen: false });
      },
      title: 'Clear Completed Tasks',
      message: 'Are you sure you want to delete all completed tasks? This action cannot be undone.',
      confirmText: 'Clear All',
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntil = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#EF4444';
      case 'Medium':
        return '#F59E0B';
      case 'Low':
        return '#10B981';
      default:
        return '#F59E0B';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High':
        return <AlertTriangle size={16} />;
      case 'Medium':
        return <Clock size={16} />;
      case 'Low':
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="todo-list-container">
        <div className="loading-container">
          <Loader2 className="loading-spinner" />
          <p>Loading todo list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="todo-list-container">
        <div className="error-container">
          <p>Failed to load todo list. Please try again.</p>
        </div>
      </div>
    );
  }

  const completedItems = todoList?.filter(item => item.isCompleted) || [];
  const uncompletedItems = todoList?.filter(item => !item.isCompleted) || [];

  return (
    <div className="todo-list-container">
      <ConfirmationModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        isLoading={deleteMutation.isLoading || cutMutation.isLoading || deleteCompletedMutation.isLoading}
      />
      <div className="todo-list-header">
        <div className="header-content">
          <h1>To-Do List</h1>
          <p>Manage your tasks and stay organized</p>
        </div>
        
        <div className="header-actions">
          {completedItems.length > 0 && (
            <button 
              className="clear-completed-btn"
              onClick={handleDeleteCompleted}
              disabled={deleteCompletedMutation.isLoading}
            >
              {deleteCompletedMutation.isLoading ? (
                <>
                  <Loader2 className="button-spinner" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Clear Completed
                </>
              )}
            </button>
          )}
          
          <button 
            className="add-btn"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="form-section">
          <div className="form-card">
            <h3>{editingId ? 'Edit Todo Item' : 'Add New Todo Item'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="task">Task *</label>
                <input
                  id="task"
                  type="text"
                  value={formData.task}
                  onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  placeholder="Enter your task"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCancel}
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {createMutation.isLoading || updateMutation.isLoading ? (
                    <>
                      <Loader2 className="button-spinner" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Todo List Items */}
      <div className="todo-list-content">
        {/* Uncompleted Items */}
        {uncompletedItems.length > 0 && (
          <div className="items-section">
            <h2>Active Tasks ({uncompletedItems.length})</h2>
            <div className="items-list">
              {uncompletedItems.map((item) => (
                <div key={item._id} className="todo-item active">
                  <div className="item-header">
                    <button
                      className="toggle-btn"
                      onClick={() => handleToggle(item._id)}
                      disabled={toggleMutation.isLoading}
                    >
                      <Square size={20} />
                    </button>
                    <div className="item-content">
                      <div className="item-main">
                        <h3>{item.task}</h3>
                        <div className="item-meta">
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(item.priority) }}
                          >
                            {getPriorityIcon(item.priority)}
                            {item.priority}
                          </span>
                          {item.dueDate && (
                            <div className="due-date">
                              <Calendar size={16} />
                              <span>{formatDate(item.dueDate)}</span>
                              {getDaysUntil(item.dueDate) > 0 && (
                                <span className="days-until">({getDaysUntil(item.dueDate)} days left)</span>
                              )}
                              {getDaysUntil(item.dueDate) <= 0 && (
                                <span className="overdue">Overdue</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button
                        className="action-btn cut"
                        onClick={() => handleCut(item._id)}
                        disabled={cutMutation.isLoading}
                        title="Cut"
                      >
                        <Scissors size={16} />
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(item._id)}
                        disabled={deleteMutation.isLoading}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="items-section">
            <h2>Completed Tasks ({completedItems.length})</h2>
            <div className="items-list">
              {completedItems.map((item) => (
                <div key={item._id} className={`todo-item completed ${item.isCut ? 'cut' : ''}`}>
                  <div className="item-header">
                    <button
                      className="toggle-btn"
                      onClick={() => handleToggle(item._id)}
                      disabled={toggleMutation.isLoading}
                    >
                      <CheckSquare size={20} />
                    </button>
                    <div className="item-content">
                      <div className="item-main">
                        <h3>{item.task}</h3>
                        <div className="item-meta">
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(item.priority) }}
                          >
                            {getPriorityIcon(item.priority)}
                            {item.priority}
                          </span>
                          {item.dueDate && (
                            <div className="due-date">
                              <Calendar size={16} />
                              <span>{formatDate(item.dueDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button
                        className="action-btn cut"
                        onClick={() => handleCut(item._id)}
                        disabled={cutMutation.isLoading}
                        title="Cut (will be removed after refresh)"
                      >
                        <Scissors size={16} />
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(item._id)}
                        disabled={deleteMutation.isLoading}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todoList?.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <ListTodo size={48} />
            </div>
            <h3>No Todo Items Yet</h3>
            <p>Start adding your tasks to stay organized!</p>
            <button 
              className="add-btn"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={16} />
              Add Your First Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList; 