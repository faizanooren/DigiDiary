import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Calendar,
  Loader2,
  Target,
  CheckSquare,
  Square,
  Scissors
} from 'lucide-react';
import api from '../../utils/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import './BucketList.css';

const BucketList = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: ''
  });
  const [modalState, setModalState] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  // Fetch bucket list items
  const { data: bucketList, isLoading, error } = useQuery(
    ['bucketList'],
    async () => {
      const response = await api.get('/bucket-list');
      return response.data.data;
    },
    {
      onError: (error) => {
        console.error('Error fetching bucket list:', error);
        toast.error('Failed to load bucket list');
      }
    }
  );

  // Create bucket list item mutation
  const createMutation = useMutation(
    async (data) => {
      const response = await api.post('/bucket-list', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Bucket list item added successfully!');
        setIsAdding(false);
        setFormData({ title: '', description: '', targetDate: '' });
        queryClient.invalidateQueries(['bucketList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add bucket list item');
      }
    }
  );

  // Update bucket list item mutation
  const updateMutation = useMutation(
    async ({ id, data }) => {
      const response = await api.put(`/bucket-list/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Bucket list item updated successfully!');
        setEditingId(null);
        setFormData({ title: '', description: '', targetDate: '' });
        queryClient.invalidateQueries(['bucketList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update bucket list item');
      }
    }
  );

  // Toggle completion mutation
  const toggleMutation = useMutation(
    async (id) => {
      const response = await api.patch(`/bucket-list/${id}/toggle`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(['bucketList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update item');
      }
    }
  );

  // Delete bucket list item mutation
  const deleteMutation = useMutation(
    async (id) => {
      const response = await api.delete(`/bucket-list/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Bucket list item deleted successfully!');
        queryClient.invalidateQueries(['bucketList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete bucket list item');
      }
    }
  );

  // Cut bucket list item mutation (marks as completed but keeps in database)
  const cutMutation = useMutation(
    async (id) => {
      const response = await api.patch(`/bucket-list/${id}/cut`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(['bucketList']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cut item');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
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
      title: item.title,
      description: item.description || '',
      targetDate: item.targetDate ? new Date(item.targetDate).toISOString().split('T')[0] : ''
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ title: '', description: '', targetDate: '' });
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
      title: 'Delete Bucket List Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
    });
  };

  const handleCut = (id) => {
    setModalState({
      isOpen: true,
      onConfirm: () => {
        cutMutation.mutate(id);
        setModalState({ isOpen: false });
      },
      title: 'Cut Bucket List Item',
      message: 'Are you sure you want to cut this item? It will be marked as completed but will remain in your list.',
      confirmText: 'Cut',
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntil = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="bucket-list-container">
        <div className="loading-container">
          <Loader2 className="loading-spinner" />
          <p>Loading bucket list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bucket-list-container">
        <div className="error-container">
          <p>Failed to load bucket list. Please try again.</p>
        </div>
      </div>
    );
  }

  const completedItems = bucketList?.filter(item => item.isCompleted) || [];
  const uncompletedItems = bucketList?.filter(item => !item.isCompleted) || [];

  return (
    <div className="bucket-list-container">
      <ConfirmationModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        isLoading={deleteMutation.isLoading || cutMutation.isLoading}
      />
      <div className="bucket-list-header">
        <div className="header-content">
          <h1>Bucket List</h1>
          <p>Track your life goals and dreams</p>
        </div>
        
        <button 
          className="add-btn"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="form-section">
          <div className="form-card">
            <h3>{editingId ? 'Edit Bucket List Item' : 'Add New Bucket List Item'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter your bucket list item"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about this goal"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetDate">Target Date</label>
                <input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
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

      {/* Bucket List Items */}
      <div className="bucket-list-content">
        {/* Uncompleted Items */}
        {uncompletedItems.length > 0 && (
          <div className="items-section">
            <h2>Active Goals ({uncompletedItems.length})</h2>
            <div className="items-grid">
              {uncompletedItems.map((item) => (
                <div key={item._id} className="bucket-item active">
                  <div className="item-header">
                    <button
                      className="toggle-btn"
                      onClick={() => handleToggle(item._id)}
                      disabled={toggleMutation.isLoading}
                    >
                      <Circle size={20} />
                    </button>
                    <div className="item-title">
                      <h3>{item.title}</h3>
                    </div>
                    <div className="item-actions">
                      <button
                        className="action-btn cut"
                        onClick={() => handleCut(item._id)}
                        disabled={cutMutation.isLoading}
                        title="Cut (mark as completed)"
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
                  
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                  
                  {item.targetDate && (
                    <div className="item-date">
                      <Calendar size={16} />
                      <span>{formatDate(item.targetDate)}</span>
                      {getDaysUntil(item.targetDate) > 0 && (
                        <span className="days-until">({getDaysUntil(item.targetDate)} days left)</span>
                      )}
                      {getDaysUntil(item.targetDate) <= 0 && (
                        <span className="overdue">Overdue</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="items-section">
            <h2>Completed Goals ({completedItems.length})</h2>
            <div className="items-grid">
              {completedItems.map((item) => (
                <div key={item._id} className="bucket-item completed">
                  <div className="item-header">
                    <button
                      className="toggle-btn"
                      onClick={() => handleToggle(item._id)}
                      disabled={toggleMutation.isLoading}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <div className="item-title">
                      <h3>{item.title}</h3>
                    </div>
                    <div className="item-actions">
                      <button
                        className="action-btn cut"
                        onClick={() => handleCut(item._id)}
                        disabled={cutMutation.isLoading}
                        title="Cut (mark as completed)"
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
                  
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                  
                  {item.targetDate && (
                    <div className="item-date">
                      <Calendar size={16} />
                      <span>{formatDate(item.targetDate)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {bucketList?.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <Target size={48} />
            </div>
            <h3>No Bucket List Items Yet</h3>
            <p>Start adding your life goals and dreams to your bucket list!</p>
            <button 
              className="add-btn"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={16} />
              Add Your First Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BucketList; 