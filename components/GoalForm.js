'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function GoalForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'personal',
    deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
    priority: initialData?.priority || 'medium',
    tags: initialData?.tags?.join(', ') || ''
  });

  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'health', label: '🏃 Health & Fitness' },
    { value: 'career', label: '💼 Career & Work' },
    { value: 'education', label: '📚 Education & Learning' },
    { value: 'personal', label: '🌱 Personal Development' },
    { value: 'finance', label: '💰 Finance & Money' },
    { value: 'relationships', label: '❤️ Relationships' },
    { value: 'hobbies', label: '🎨 Hobbies & Recreation' },
    { value: 'other', label: '📋 Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'var(--color-text-muted)' },
    { value: 'medium', label: 'Medium', color: 'var(--color-warning)' },
    { value: 'high', label: 'High', color: 'var(--color-danger)' },
    { value: 'urgent', label: 'Urgent', color: 'var(--color-quest-side)' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const goalData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    onSubmit(goalData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-gradient">
        {initialData ? 'Edit Goal' : 'Create New Goal'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Goal Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`input ${errors.title ? 'border-red-500' : ''}`}
            placeholder="Enter your goal title..."
            maxLength={200}
          />
          {errors.title && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`textarea ${errors.description ? 'border-red-500' : ''}`}
            placeholder="Describe your goal in detail..."
            rows={4}
            maxLength={1000}
          />
          {errors.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
              {errors.description}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {formData.description.length}/1000 characters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="select"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="select"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Deadline *
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className={`input ${errors.deadline ? 'border-red-500' : ''}`}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.deadline && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
              {errors.deadline}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Tags (optional)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="input"
            placeholder="health, fitness, daily routine (comma separated)"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Separate tags with commas
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" className="btn btn-primary flex-1">
            {initialData ? 'Update Goal' : 'Create Goal & Generate Quests'}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
