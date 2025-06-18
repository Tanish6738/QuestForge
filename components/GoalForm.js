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
    tags: initialData?.tags?.join(', ') || '',
    dailyTimeAvailable: initialData?.dailyTimeAvailable || 60,
    preferredTimeSlots: initialData?.preferredTimeSlots || [],
    questGenerationPreferences: {
      difficulty: initialData?.questGenerationPreferences?.difficulty || 'mixed',
      sessionLength: initialData?.questGenerationPreferences?.sessionLength || 'flexible',
      breakdownStyle: initialData?.questGenerationPreferences?.breakdownStyle || 'moderate'
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const difficultyOptions = [
    { value: 'easy', label: 'Easy - Gentle progression' },
    { value: 'medium', label: 'Medium - Balanced challenge' },
    { value: 'hard', label: 'Hard - Intensive approach' },
    { value: 'mixed', label: 'Mixed - Varied difficulty levels' }
  ];

  const sessionLengthOptions = [
    { value: 'short', label: 'Short (15-30 min)' },
    { value: 'medium', label: 'Medium (30-60 min)' },
    { value: 'long', label: 'Long (60-120 min)' },
    { value: 'flexible', label: 'Flexible - Mix of lengths' }
  ];

  const breakdownStyleOptions = [
    { value: 'detailed', label: 'Detailed - Many small steps' },
    { value: 'moderate', label: 'Moderate - Balanced breakdown' },
    { value: 'minimal', label: 'Minimal - Fewer, bigger tasks' }
  ];
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('questGenerationPreferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        questGenerationPreferences: {
          ...prev.questGenerationPreferences,
          [prefKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
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
    }    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    if (!formData.dailyTimeAvailable || formData.dailyTimeAvailable < 15 || formData.dailyTimeAvailable > 720) {
      newErrors.dailyTimeAvailable = 'Daily time must be between 15 and 720 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }    const goalData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      dailyTimeAvailable: parseInt(formData.dailyTimeAvailable),
      questGenerationPreferences: formData.questGenerationPreferences
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
        </div>        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Tags (optional)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., fitness, personal-growth, urgent"
            className="input"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Separate tags with commas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Daily Time Available (minutes) *
          </label>
          <input
            type="number"
            name="dailyTimeAvailable"
            value={formData.dailyTimeAvailable}
            onChange={handleChange}
            min="15"
            max="720"
            className={`input ${errors.dailyTimeAvailable ? 'border-red-500' : ''}`}
            placeholder="60"
          />
          {errors.dailyTimeAvailable && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
              {errors.dailyTimeAvailable}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            How many minutes per day can you dedicate to this goal? (15-720 minutes)
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm font-medium mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-primary)' }}
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            Advanced Quest Preferences
          </button>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 rounded-lg"
              style={{ backgroundColor: 'var(--color-background-elevated)' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Difficulty Preference
                  </label>
                  <select
                    name="questGenerationPreferences.difficulty"
                    value={formData.questGenerationPreferences.difficulty}
                    onChange={handleChange}
                    className="select"
                  >
                    {difficultyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Session Length
                  </label>
                  <select
                    name="questGenerationPreferences.sessionLength"
                    value={formData.questGenerationPreferences.sessionLength}
                    onChange={handleChange}
                    className="select"
                  >
                    {sessionLengthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Task Breakdown
                  </label>
                  <select
                    name="questGenerationPreferences.breakdownStyle"
                    value={formData.questGenerationPreferences.breakdownStyle}
                    onChange={handleChange}
                    className="select"
                  >
                    {breakdownStyleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>              </div>
            </motion.div>
          )}
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
