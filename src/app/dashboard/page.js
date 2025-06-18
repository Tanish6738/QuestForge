'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import XPBar, { StatsCard, LevelBadge, AchievementCard } from '../../../components/XPComponents';
import QuestCard from '../../../components/QuestCard';
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [xpData, setXpData] = useState(null);
  const [quests, setQuests] = useState([]);
  const [dailyLimit, setDailyLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch XP data
      const xpResponse = await fetch('/api/xp', { headers });
      const xpData = await xpResponse.json();

      // Fetch quests
      const questsResponse = await fetch('/api/quests', { headers });
      const questsData = await questsResponse.json();

      // Fetch daily limits
      const limitResponse = await fetch('/api/limit', { headers });
      const limitData = await limitResponse.json();

      setXpData(xpData);
      setQuests(questsData.quests || []);
      setDailyLimit(limitData.dailyLimit);
      
      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(xpData.user));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

      // Refresh dashboard data
      fetchDashboardData();

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
      fetchDashboardData();

    } catch (error) {
      console.error('Error generating daily quests:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') return true;
    if (filter === 'active') return quest.status === 'active';
    if (filter === 'available') return quest.status === 'available';
    if (filter === 'completed') return quest.status === 'completed';
    if (filter === 'failed') return quest.status === 'failed';
    if (filter === 'side') return quest.type === 'side' && quest.status !== 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your quest dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gradient">QuestForge ⚔️</h1>
              {xpData?.badge && (
                <LevelBadge level={xpData.user.level} badge={xpData.badge} />
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Welcome back, <strong>{user?.username}</strong>!
              </span>
              <button onClick={() => router.push('/goals')} className="btn btn-primary">
                📋 Goals
              </button>
              <button onClick={() => router.push('/profile')} className="btn btn-secondary">
                👤 Profile
              </button>
              <button onClick={logout} className="btn btn-secondary">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* XP Progress */}
        {xpData?.levelInfo && (
          <XPBar
            currentXP={xpData.levelInfo.totalXP}
            level={xpData.levelInfo.currentLevel}
            levelProgress={xpData.levelInfo.progress}
            xpToNext={xpData.levelInfo.xpToNext}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Active Quests"
            value={xpData?.stats?.activeQuests || 0}
            icon="⚔️"
            color="var(--color-quest-active)"
          />
          <StatsCard
            title="Completed"
            value={xpData?.stats?.completedQuests || 0}
            icon="✅"
            color="var(--color-success)"
          />
          <StatsCard
            title="Daily Limit"
            value={`${dailyLimit?.questsStarted || 0}/${dailyLimit?.maxQuestsPerDay || 10}`}
            subtitle={`${dailyLimit?.remainingQuests || 0} remaining`}
            icon="📊"
            color="var(--color-warning)"
          />
          <StatsCard
            title="Today's XP"
            value={`+${dailyLimit?.xpEarned || 0}`}
            subtitle={dailyLimit?.xpLost ? `-${dailyLimit.xpLost} lost` : 'No XP lost'}
            icon="⭐"
            color="var(--color-success)"
          />
        </div>

        {/* Quest Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button 
            onClick={generateDailyQuests}
            className="btn btn-success"
            disabled={!dailyLimit?.canStartMore}
          >
            🎯 Generate Daily Quests
          </button>
          <button onClick={() => router.push('/goals')} className="btn btn-primary">
            ➕ Create New Goal
          </button>
          <button onClick={() => router.push('/quests')} className="btn btn-secondary">
            🗂️ Manage Quests
          </button>
        </div>

        {/* Quest Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'available', 'active', 'completed', 'failed', 'side'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`btn ${filter === filterType ? 'btn-primary' : 'btn-secondary'}`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType !== 'all' && (
                <span className="ml-1">
                  ({quests.filter(q => {
                    if (filterType === 'side') return q.type === 'side' && q.status !== 'rejected';
                    return filterType === 'available' ? q.status === 'available' : q.status === filterType;
                  }).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quests List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Your Quests {filter !== 'all' && `(${filter})`}
          </h2>
          
          <AnimatePresence>
            {filteredQuests.length > 0 ? (
              filteredQuests.map(quest => (
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
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  No quests found
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {filter === 'all' 
                    ? "Create your first goal to start your quest journey!"
                    : `No ${filter} quests at the moment.`
                  }
                </p>
                {filter === 'all' && (
                  <button 
                    onClick={() => router.push('/goals')}
                    className="btn btn-primary mt-4"
                  >
                    Create Your First Goal
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Achievements Section */}
        {xpData?.achievements && xpData.achievements.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Recent Achievements 🏆
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {xpData.achievements.slice(0, 4).map((achievement, index) => (
                <AchievementCard key={index} achievement={achievement} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
