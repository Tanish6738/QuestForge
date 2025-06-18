'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [xpData, setXpData] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLimit, setNewLimit] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    fetchProfileData();
  }, [router]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch XP data
      const xpResponse = await fetch('/api/xp', { headers });
      const xpData = await xpResponse.json();

      // Fetch daily limits
      const limitResponse = await fetch('/api/limit', { headers });
      const limitData = await limitResponse.json();

      // Fetch leaderboard
      const leaderboardResponse = await fetch('/api/xp/leaderboard?limit=10', { headers });
      const leaderboardData = await leaderboardResponse.json();

      setXpData(xpData);
      setDailyLimit(limitData.dailyLimit);
      setNewLimit(limitData.dailyLimit?.maxQuestsPerDay || 10);
      setLeaderboard(leaderboardData.leaderboard || []);
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDailyLimit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/limit', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ maxQuestsPerDay: parseInt(newLimit) })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update daily limit');
        return;
      }

      alert('✅ Daily quest limit updated!');
      fetchProfileData();

    } catch (error) {
      console.error('Error updating daily limit:', error);
      alert('Failed to update daily limit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your profile...</p>
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
              <h1 className="text-2xl font-bold text-gradient">Profile 👤</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient rounded-full flex items-center justify-center text-3xl text-white">
                👤
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {user?.username}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {user?.email}
              </p>
            </div>

            {xpData?.badge && (
              <div className="text-center mb-6">
                <div 
                  className="level-badge inline-flex"
                  style={{ backgroundColor: xpData.badge.color }}
                >
                  <span className="text-lg">{xpData.badge.icon}</span>
                  <span>Level {xpData.user.level}</span>
                  <span className="text-xs opacity-90">{xpData.badge.name}</span>
                </div>
              </div>
            )}

            {/* XP Progress */}
            {xpData?.levelInfo && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    Level {xpData.levelInfo.currentLevel}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {xpData.levelInfo.xpToNext} XP to next level
                  </span>
                </div>
                <div className="xp-bar">
                  <div 
                    className="xp-progress"
                    style={{ width: `${xpData.levelInfo.progress}%` }}
                  />
                </div>
                <div className="text-center mt-2">
                  <span className="text-lg font-bold text-gradient">
                    {xpData.levelInfo.totalXP.toLocaleString()} XP
                  </span>
                </div>
              </div>
            )}

            {/* Stats */}
            {xpData?.stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                    {xpData.stats.completedQuests}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Completed Quests
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>
                    {xpData.stats.failedQuests}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Failed Quests
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Settings ⚙️
            </h3>

            <div className="space-y-6">
              {/* Daily Quest Limit */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Daily Quest Limit
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="input flex-1"
                  />
                  <button 
                    onClick={updateDailyLimit}
                    className="btn btn-primary"
                  >
                    Update
                  </button>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Current: {dailyLimit?.questsStarted || 0}/{dailyLimit?.maxQuestsPerDay || 10} quests today
                </p>
              </div>

              {/* Account Info */}
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Account Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Member since:</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(user?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Total XP:</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {xpData?.user?.totalXP?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Current Level:</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {xpData?.user?.level || 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Achievements */}
          {xpData?.achievements && xpData.achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card lg:col-span-2"
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Achievements 🏆
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {xpData.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4"
                    style={{ borderColor: 'var(--color-success)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="text-2xl"
                        style={{ color: 'var(--color-success)' }}
                      >
                        🏆
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {achievement.name}
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card lg:col-span-2"
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Leaderboard 🏆
            </h3>
            <div className="space-y-3">
              {leaderboard.map((player, index) => (
                <div
                  key={player.username}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.username === user?.username ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {player.username}
                        {player.username === user?.username && ' (You)'}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Level {player.level}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gradient">
                      {player.totalXP.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
