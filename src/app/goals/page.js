'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GoalForm from '../../../components/GoalForm';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchGoals();
  }, [router]);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/goals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (goalData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create goal');
        return;
      }

      alert(`🎉 Goal created successfully! ${data.quests?.length || 0} quests generated!`);
      setShowForm(false);
      fetchGoals();

    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal');
    }
  };

  const handleUpdateGoal = async (goalData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals/${editingGoal._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update goal');
        return;
      }

      alert('✅ Goal updated successfully!');
      setEditingGoal(null);
      fetchGoals();

    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal? This will also delete all associated quests.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to delete goal');
        return;
      }

      alert('🗑️ Goal deleted successfully');
      fetchGoals();

    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--color-primary)';
      case 'completed': return 'var(--color-success)';
      case 'paused': return 'var(--color-warning)';
      case 'cancelled': return 'var(--color-danger)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'var(--color-text-muted)';
      case 'medium': return 'var(--color-warning)';
      case 'high': return 'var(--color-danger)';
      case 'urgent': return 'var(--color-quest-side)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      health: '🏃',
      career: '💼',
      education: '📚',
      personal: '🌱',
      finance: '💰',
      relationships: '❤️',
      hobbies: '🎨',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-2xl hover:opacity-80"
              >
                ← 
              </button>
              <h1 className="text-2xl font-bold text-gradient">Goals 📋</h1>
            </div>
            
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              ➕ Create New Goal
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show Form */}
        <AnimatePresence>
          {(showForm || editingGoal) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <GoalForm
                    initialData={editingGoal}
                    onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingGoal(null);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'active', 'completed', 'paused', 'cancelled'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`btn ${filter === filterType ? 'btn-primary' : 'btn-secondary'}`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType !== 'all' && (
                <span className="ml-1">
                  ({goals.filter(g => g.status === filterType).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredGoals.map(goal => (
              <motion.div
                key={goal._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                    <div>
                      <div 
                        className="text-xs px-2 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: getStatusColor(goal.status) }}
                      >
                        {goal.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div 
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{ 
                      color: getPriorityColor(goal.priority),
                      backgroundColor: `${getPriorityColor(goal.priority)}20`
                    }}
                  >
                    {goal.priority.toUpperCase()}
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {goal.title}
                </h3>

                <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {goal.description}
                </p>

                <div className="mb-4">
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Category: {goal.category}
                  </div>
                </div>

                {goal.tags && goal.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1">
                    {goal.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: 'var(--color-bg-tertiary)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/goals/${goal._id}`)}
                    className="btn btn-secondary flex-1"
                  >
                    View Quests
                  </button>
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="btn btn-primary"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="btn btn-danger"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredGoals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {filter === 'all' ? 'No goals created yet' : `No ${filter} goals`}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {filter === 'all' 
                ? "Create your first goal to start your quest journey!"
                : `You don't have any ${filter} goals at the moment.`
              }
            </p>
            {filter === 'all' && (
              <button 
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                Create Your First Goal
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
