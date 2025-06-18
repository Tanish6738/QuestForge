'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User as UserIcon, Settings, Shield, Star, CheckCircle, XCircle, Trophy, Crown, SlidersHorizontal } from 'lucide-react';

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
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [xpRes, limitRes, leaderboardRes] = await Promise.all([
        fetch('/api/xp', { headers }),
        fetch('/api/limit', { headers }),
        fetch('/api/xp/leaderboard?limit=10', { headers })
      ]);

      const xpData = await xpRes.json();
      const limitData = await limitRes.json();
      const leaderboardData = await leaderboardRes.json();

      if (xpRes.ok) setXpData(xpData);
      if (limitRes.ok) {
        setDailyLimit(limitData.dailyLimit);
        setNewLimit(limitData.dailyLimit?.maxQuestsPerDay || 10);
      }
      if (leaderboardRes.ok) setLeaderboard(leaderboardData.leaderboard || []);
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDailyLimit = async () => {
    if (!newLimit || newLimit < 1 || newLimit > 50) {
      alert('Please enter a number between 1 and 50.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/limit', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon, label, value, colorClass }) => (
    <div className="bg-card-alt p-4 rounded-lg flex items-center gap-4">
      <div className={`p-2 rounded-full ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );

  const getLeaderboardRankColor = (index) => {
    if (index === 0) return 'bg-yellow-400 text-yellow-900';
    if (index === 1) return 'bg-gray-400 text-gray-900';
    if (index === 2) return 'bg-orange-500 text-orange-900';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card text-card-foreground shadow-sm sticky top-0 z-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="btn btn-ghost btn-circle" aria-label="Go back">
                <ArrowLeft />
              </button>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <UserIcon className="h-6 w-6" />
                Profile
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Info & Stats */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center text-4xl text-primary-foreground">
                  {user?.username?.charAt(0).toUpperCase() || <UserIcon />}
                </div>
                <h2 className="text-2xl font-bold text-foreground">{user?.username}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              {xpData?.badge && (
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: xpData.badge.color, color: '#fff' }}>
                    <span>{xpData.badge.icon}</span>
                    <span>Level {xpData.user.level} - {xpData.badge.name}</span>
                  </div>
                </div>
              )}

              {xpData?.levelInfo && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                    <span>Level {xpData.levelInfo.currentLevel}</span>
                    <span>{xpData.levelInfo.xpToNext.toLocaleString()} XP to next</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${xpData.levelInfo.progress}%` }}></div>
                  </div>
                  <div className="text-center mt-2 text-lg font-bold text-primary">
                    {xpData.levelInfo.totalXP.toLocaleString()} Total XP
                  </div>
                </div>
              )}

              {xpData?.stats && (
                <div className="space-y-4">
                  <StatCard icon={<CheckCircle className="h-6 w-6 text-green-500" />} label="Completed Quests" value={xpData.stats.completedQuests} />
                  <StatCard icon={<XCircle className="h-6 w-6 text-red-500" />} label="Failed Quests" value={xpData.stats.failedQuests} />
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="daily-limit" className="block text-sm font-medium text-muted-foreground mb-1">Daily Quest Limit</label>
                  <div className="flex gap-2">
                    <input id="daily-limit" type="number" min="1" max="50" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} className="input flex-1" />
                    <button onClick={updateDailyLimit} className="btn btn-primary">Update</button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Current: {dailyLimit?.questsStarted || 0}/{dailyLimit?.maxQuestsPerDay || 10} quests today</p>
                </div>
                <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">Member since: {new Date(user?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Achievements & Leaderboard */}
          <div className="lg:col-span-2 space-y-8">
            {xpData?.achievements && xpData.achievements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Achievements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {xpData.achievements.map((achievement, index) => (
                    <div key={index} className="bg-card-alt border border-border p-4 rounded-lg flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h4 className="font-semibold text-foreground">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Leaderboard
              </h3>
              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <div key={player.username} className={`flex items-center justify-between p-3 rounded-lg ${player.username === user?.username ? 'bg-primary/10 border-2 border-primary/50' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getLeaderboardRankColor(index)}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {player.username}
                          {player.username === user?.username && <span className="text-xs text-primary"> (You)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">Level {player.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{player.totalXP.toLocaleString()} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
