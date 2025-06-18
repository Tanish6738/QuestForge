'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuestCard({ quest, onStart, onComplete, onFail, onAccept, onReject, onRetry }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (quest.status === 'active' && quest.deadline) {
      const interval = setInterval(() => {
        const now = new Date();
        const deadline = new Date(quest.deadline);
        const remaining = deadline - now;
        
        if (remaining <= 0) {
          setIsExpired(true);
          setTimeRemaining(0);
          onFail && onFail(quest._id);
        } else {
          setTimeRemaining(remaining);
          setIsExpired(false);
        }      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quest.status, quest.deadline, quest._id, onFail]);

  const formatTime = (ms) => {
    if (!ms) return '00:00:00';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (quest.status) {
      case 'available': return 'var(--color-quest-available)';
      case 'active': return 'var(--color-quest-active)';
      case 'completed': return 'var(--color-quest-completed)';
      case 'failed': return 'var(--color-quest-failed)';
      default: return 'var(--color-border)';
    }
  };

  const getDifficultyColor = () => {
    switch (quest.difficulty) {
      case 'easy': return 'var(--color-success)';
      case 'medium': return 'var(--color-warning)';
      case 'hard': return 'var(--color-danger)';
      case 'expert': return 'var(--color-quest-side)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`quest-card ${quest.status} ${quest.type === 'side' ? 'side' : ''}`}
      style={{ borderLeftColor: getStatusColor() }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
              {quest.title}
            </h3>
            {quest.type === 'side' && (
              <span 
                className="text-xs px-2 py-1 rounded-full text-white font-medium"
                style={{ backgroundColor: 'var(--color-quest-side)' }}
              >
                Side Quest
              </span>
            )}
          </div>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {quest.description}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span 
            className="text-xs px-2 py-1 rounded font-medium text-white"
            style={{ backgroundColor: getDifficultyColor() }}
          >
            {quest.difficulty.toUpperCase()}
          </span>
          <span className="text-lg font-bold text-gradient">
            {quest.xpReward} XP
          </span>
        </div>
      </div>

      {quest.status === 'active' && timeRemaining !== null && (
        <div className="mb-3">
          <div className={`timer ${isExpired ? 'expired' : ''}`}>
            ⏰ {formatTime(timeRemaining)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            ⏱ {quest.duration} min
          </span>
          {quest.retryCount > 0 && (
            <span className="text-sm" style={{ color: 'var(--color-warning)' }}>
              🔄 Retry {quest.retryCount}/{quest.maxRetries}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {quest.status === 'available' && quest.type !== 'side' && (
            <button 
              onClick={() => onStart(quest._id)}
              className="btn btn-primary"
            >
              Start Quest
            </button>
          )}
          
          {quest.status === 'available' && quest.type === 'side' && (
            <>
              <button 
                onClick={() => onReject(quest._id)}
                className="btn btn-secondary"
              >
                Reject
              </button>
              <button 
                onClick={() => onAccept(quest._id)}
                className="btn btn-success"
              >
                Accept
              </button>
            </>
          )}
          
          {quest.status === 'active' && !isExpired && (
            <>
              <button 
                onClick={() => onFail(quest._id)}
                className="btn btn-danger"
              >
                Give Up
              </button>
              <button 
                onClick={() => onComplete(quest._id)}
                className="btn btn-success"
              >
                Complete
              </button>
            </>
          )}
          
          {quest.status === 'failed' && quest.retryCount < quest.maxRetries && (
            <button 
              onClick={() => onRetry(quest._id)}
              className="btn btn-primary"
            >
              Retry Quest
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
