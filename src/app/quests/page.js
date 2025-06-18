'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import QuestCard from '../../../components/QuestCard';
import { ShieldQuestion, PlusCircle, ArrowLeft, Star, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

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
    setLoading(true);
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
      } else {
        console.error('Failed to fetch quests:', data.error);
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
          'Authorization': `Bearer ${token}`,'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Action failed');
        return;
      }

      if (data.xpGained) {
        // Replace with a more modern notification system if available
        alert(`🎉 Quest completed! +${data.xpGained} XP earned!`);
      } else if (data.xpLost) {
        alert(`😔 Quest failed. -${data.xpLost} XP lost.`);
      }

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
          'Authorization': `Bearer ${token}`,'Content-Type': 'application/json'
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
          return (difficultyOrder[b.difficulty] || 0) - (difficultyOrder[a.difficulty] || 0);
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        default: // createdAt
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-background flex items-center justify-center">
        <div className="text-center text-theme-text-secondary">
          <div className="animate-spin h-10 w-10 border-4 border-theme-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Loading your quests...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, colorClass }) => (
    <div className="card-theme p-4 text-center flex flex-col justify-between shadow-md">
      <p className="text-sm text-theme-text-secondary mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-theme-background text-theme-text">
      {/* Header */}
      <header className="bg-theme-secondary text-theme-text shadow-sm sticky top-0 z-10 border-b border-theme-border-opaque">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-theme-secondary-lighter transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft />
              </button>
              <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
                <ShieldQuestion className="h-6 w-6" />
                Quest Log
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={generateDailyQuests}
                className="btn-outline-primary hidden sm:flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
              >
                <PlusCircle className="h-4 w-4" />
                Generate Daily
              </button>
              <button
                onClick={() => router.push('/goals')}
                className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
              >
                Manage Goals
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard title="Available" value={quests.filter(q => q.status === 'available').length} colorClass="text-theme-primary" />
          <StatCard title="Active" value={quests.filter(q => q.status === 'active').length} colorClass="text-theme-warning" />
          <StatCard title="Completed" value={quests.filter(q => q.status === 'completed').length} colorClass="text-theme-success" />
          <StatCard title="Failed" value={quests.filter(q => q.status === 'failed').length} colorClass="text-theme-error" />
          <StatCard title="Side Quests" value={quests.filter(q => q.type === 'side' && q.status !== 'rejected').length} colorClass="text-theme-accent" />
        </div>

        {/* Filters and Sorting */}
        <div className="card-theme p-4 mb-8 space-y-6 shadow-md">
          {/* Filters */}
          <div>
            <h3 className="text-sm font-semibold text-theme-text-secondary mb-3">FILTER BY</h3>
            <div className="flex flex-wrap gap-2">
              {['all', 'available', 'active', 'completed', 'failed', 'main', 'sub', 'side'].map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === filterType ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  <span className="ml-1.5 text-xs opacity-75">
                    (
                      {quests.filter(q => {
                        if (filterType === 'all') return true;
                        if (filterType === 'main') return q.type === 'main';
                        if (filterType === 'sub') return q.type === 'sub';
                        if (filterType === 'side') return q.type === 'side' && q.status !== 'rejected';
                        return q.status === filterType;
                      }).length}
                    )
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div>
            <h3 className="text-sm font-semibold text-theme-text-secondary mb-3">SORT BY</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'createdAt', label: 'Recent', Icon: Calendar },
                { value: 'xpReward', label: 'XP Reward', Icon: Star },
                { value: 'difficulty', label: 'Difficulty', Icon: ShieldQuestion },
                { value: 'deadline', label: 'Deadline', Icon: Clock },
                { value: 'duration', label: 'Duration', Icon: Clock }
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sortBy === value ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quests List */}
        <div>
          <h2 className="text-xl font-bold text-theme-text mb-4">
            {filter.charAt(0).toUpperCase() + filter.slice(1)} Quests ({filteredAndSortedQuests.length})
          </h2>
          
          <AnimatePresence>
            {filteredAndSortedQuests.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedQuests.map(quest => (
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
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16 card-theme shadow-inner"
              >
                <ShieldQuestion className="mx-auto h-16 w-16 text-theme-text-secondary mb-4" />
                <h3 className="text-xl font-semibold text-theme-text mb-2">
                  No Quests Found
                </h3>
                <p className="text-theme-text-secondary max-w-md mx-auto">
                  {filter === 'all'
                    ? "Your quest log is empty. Try generating some daily quests or create goals to populate your adventure!"
                    : `There are no quests matching the '${filter}' filter. Try a different one!`}
                </p>
                {filter === 'all' && (
                  <div className="flex gap-4 justify-center mt-6">
                    <button
                      onClick={() => router.push('/goals')}
                      className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
                    >
                      Create a Goal
                    </button>
                    <button
                      onClick={generateDailyQuests}
                      className="btn-outline-primary rounded-lg px-4 py-2 text-sm font-semibold"
                    >
                      Generate Daily Quests
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
