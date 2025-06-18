'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import QuestCard from '../../../components/QuestCard';

export default function QuestsPage() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchQuests();
  }, [router]);

  const fetchQuests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setQuests(data.quests || []);
      }
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestAction = async (questId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quests/${questId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Action failed');
        return;
      }

      // Show success message for XP changes
      if (data.xpGained) {
        alert(`🎉 Quest completed! +${data.xpGained} XP earned!`);
      } else if (data.xpLost) {
        alert(`😔 Quest failed. -${data.xpLost} XP lost.`);
      }

      // Refresh quests
      fetchQuests();

    } catch (error) {
      console.error('Error updating quest:', error);
      alert('Failed to update quest');
    }
  };

  const generateDailyQuests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'generateDaily' })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to generate daily quests');
        return;
      }

      alert('🎯 Daily quests generated!');
      fetchQuests();

    } catch (error) {
      console.error('Error generating daily quests:', error);
    }
  };

  const filteredAndSortedQuests = quests
    .filter(quest => {
      if (filter === 'all') return true;
      if (filter === 'main') return quest.type === 'main';
      if (filter === 'sub') return quest.type === 'sub';
      if (filter === 'side') return quest.type === 'side' && quest.status !== 'rejected';
      return quest.status === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'xpReward':
          return b.xpReward - a.xpReward;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3, expert: 4 };
          return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        case 'duration':
          return a.duration - b.duration;
        default: // createdAt
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your quests...</p>
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
              <h1 className="text-2xl font-bold text-gradient">Quest Management ⚔️</h1>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={generateDailyQuests}
                className="btn btn-success"
              >
                🎯 Generate Daily Quests
              </button>
              <button 
                onClick={() => router.push('/goals')}
                className="btn btn-primary"
              >
                📋 Manage Goals
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-quest-available)' }}>
              {quests.filter(q => q.status === 'available').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Available
            </div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-quest-active)' }}>
              {quests.filter(q => q.status === 'active').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Active
            </div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
              {quests.filter(q => q.status === 'completed').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Completed
            </div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>
              {quests.filter(q => q.status === 'failed').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Failed
            </div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-quest-side)' }}>
              {quests.filter(q => q.type === 'side' && q.status !== 'rejected').length}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Side Quests
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="mb-6 space-y-4">
          {/* Filters */}
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Filter by:
            </h3>
            <div className="flex flex-wrap gap-2">
              {['all', 'available', 'active', 'completed', 'failed', 'main', 'sub', 'side'].map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`btn ${filter === filterType ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  <span className="ml-1">
                    ({quests.filter(q => {
                      if (filterType === 'all') return true;
                      if (filterType === 'main') return q.type === 'main';
                      if (filterType === 'sub') return q.type === 'sub';
                      if (filterType === 'side') return q.type === 'side' && q.status !== 'rejected';
                      return q.status === filterType;
                    }).length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Sort by:
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'createdAt', label: 'Created Date' },
                { value: 'xpReward', label: 'XP Reward' },
                { value: 'difficulty', label: 'Difficulty' },
                { value: 'deadline', label: 'Deadline' },
                { value: 'duration', label: 'Duration' }
              ].map(sort => (
                <button
                  key={sort.value}
                  onClick={() => setSortBy(sort.value)}
                  className={`btn ${sortBy === sort.value ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quests List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Your Quests ({filteredAndSortedQuests.length})
          </h2>
          
          <AnimatePresence>
            {filteredAndSortedQuests.length > 0 ? (
              filteredAndSortedQuests.map(quest => (
                <QuestCard
                  key={quest._id}
                  quest={quest}
                  onStart={(id) => handleQuestAction(id, 'start')}
                  onComplete={(id) => handleQuestAction(id, 'complete')}
                  onFail={(id) => handleQuestAction(id, 'fail')}
                  onAccept={(id) => handleQuestAction(id, 'accept')}
                  onReject={(id) => handleQuestAction(id, 'reject')}
                  onRetry={(id) => handleQuestAction(id, 'retry')}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">⚔️</div>
                <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  No quests found
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {filter === 'all' 
                    ? "Create goals or generate daily quests to get started!"
                    : `No ${filter} quests found.`
                  }
                </p>
                {filter === 'all' && (
                  <div className="flex gap-4 justify-center mt-4">
                    <button 
                      onClick={() => router.push('/goals')}
                      className="btn btn-primary"
                    >
                      Create Your First Goal
                    </button>
                    <button 
                      onClick={generateDailyQuests}
                      className="btn btn-success"
                    >
                      Generate Daily Quests
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
