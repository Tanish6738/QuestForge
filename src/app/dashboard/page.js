"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  XPBar,
  StatsCard,
  LevelBadge,
  AchievementCard,
} from "../../../components/XPComponents";
import QuestCard from "../../../components/QuestCard";
import TodaysQuests from "../../../components/TodaysQuests";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [xpData, setXpData] = useState(null);
  const [quests, setQuests] = useState([]);
  const [dailyLimit, setDailyLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("today"); // 'today', 'all-quests', 'goals'
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch XP data
      const xpResponse = await fetch("/api/xp", { headers });
      const xpData = await xpResponse.json();

      // Fetch quests
      const questsResponse = await fetch("/api/quests", { headers });
      const questsData = await questsResponse.json();

      // Fetch daily limits
      const limitResponse = await fetch("/api/limit", { headers });
      const limitData = await limitResponse.json();

      setXpData(xpData);
      setQuests(questsData.quests || []);
      setDailyLimit(limitData.dailyLimit);

      // Update user data in localStorage
      localStorage.setItem("user", JSON.stringify(xpData.user));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestAction = async (questId, action) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/quests/${questId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Action failed");
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
      console.error("Error updating quest:", error);
      alert("Failed to update quest");
    }
  };

  const generateDailyQuests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/quests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "generateDaily" }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to generate daily quests");
        return;
      }

      alert("🎯 Daily quests generated!");
      fetchDashboardData();
    } catch (error) {
      console.error("Error generating daily quests:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const filteredQuests = quests.filter((quest) => {
    if (filter === "all") return true;
    if (filter === "active") return quest.status === "active";
    if (filter === "available") return quest.status === "available";
    if (filter === "completed") return quest.status === "completed";
    if (filter === "failed") return quest.status === "failed";
    if (filter === "side")
      return quest.type === "side" && quest.status !== "rejected";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your quest dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">QuestForge ⚔️</h1>
              {xpData?.badge && (
                <LevelBadge level={xpData.user.level} badge={xpData.badge} />
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden md:block text-sm text-text-secondary">
                Welcome back, <strong>{user?.username}</strong>!
              </span>
              <button
                onClick={() => router.push("/goals")}
                className="btn btn-primary btn-sm px-4 py-2 rounded-md "
              >
                📋 Goals
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="btn btn-secondary btn-sm px-4 py-2 rounded-md "
              >
                👤 Profile
              </button>
              <button onClick={logout} className="btn btn-secondary btn-sm px-4 py-2 rounded-md ">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* XP Progress */}
        {xpData?.levelInfo && (
          <div className="mb-8">
            <XPBar
              currentXP={xpData.levelInfo.totalXP}
              level={xpData.levelInfo.currentLevel}
              levelProgress={xpData.levelInfo.progress}
              xpToNext={xpData.levelInfo.xpToNext}
            />
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatsCard
            title="Active Quests"
            value={xpData?.stats?.activeQuests || 0}
            icon="⚔️"
          />
          <StatsCard
            title="Completed"
            value={xpData?.stats?.completedQuests || 0}
            icon="✅"
          />
          <StatsCard
            title="Daily Limit"
            value={`${dailyLimit?.questsStarted || 0}/${dailyLimit?.maxQuestsPerDay || 10}`}
            subtitle={`${dailyLimit?.remainingQuests || 0} remaining`}
            icon="📊"
          />
          <StatsCard
            title="Today's XP"
            value={`+${dailyLimit?.xpEarned || 0}`}
            subtitle={
              dailyLimit?.xpLost ? `-${dailyLimit.xpLost} lost` : "No XP lost"
            }
            icon="⭐"
          />
        </div>
        {/* Quest Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => router.push("/goals")}
            className="btn btn-primary"
          >
            ➕ Create New Goal
          </button>
          <button
            onClick={() => router.push("/quests")}
            className="btn btn-secondary"
          >
            🗂️ Manage All Quests
          </button>
          <button
            onClick={() => router.push("/arena")}
            className="btn btn-accent"
          >
            ⚔️ Battle Arena
          </button>
        </div>
        {/* Tab Navigation */}
        <div className="border-b border-border mb-6">
          <div className="flex flex-wrap gap-2 -mb-px">
            <button
              onClick={() => setActiveTab("today")}
              className={`tab-button ${activeTab === "today" ? "tab-button-active" : ""}`}
            >
              📅 Today&apos;s Quests
            </button>
            <button
              onClick={() => setActiveTab("all-quests")}
              className={`tab-button ${activeTab === "all-quests" ? "tab-button-active" : ""}`}
            >
              🗂️ All Quests
            </button>
            <button
              onClick={() => setActiveTab("goals")}
              className={`tab-button ${activeTab === "goals" ? "tab-button-active" : ""}`}
            >
              🎯 Goals & Plans
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "today" && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TodaysQuests userId={user?.id} />
            </motion.div>
          )}

          {activeTab === "all-quests" && (
            <motion.div
              key="all-quests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Quest Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  "all",
                  "available",
                  "active",
                  "completed",
                  "failed",
                  "side",
                ].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`btn btn-sm ${filter === filterType ? "btn-primary" : "btn-secondary"}`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>

              {/* Quest Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredQuests.map((quest, index) => (
                    <motion.div
                      key={quest._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                    >
                      <QuestCard
                        quest={quest}
                        onStart={startQuest}
                        onComplete={completeQuest}
                        onFail={failQuest}
                        onAccept={acceptQuest}
                        onReject={rejectQuest}
                        onRetry={retryQuest} // Added retry handler
                        canStart={dailyLimit?.canStartMore}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredQuests.length === 0 && (
                <div className="text-center py-12 card bg-surface">
                  <p className="text-text-secondary text-lg mb-4">
                    No quests found for the selected filter.
                  </p>
                  <button
                    onClick={generateDailyQuests}
                    className="btn btn-success"
                    disabled={!dailyLimit?.canStartMore}
                  >
                    🎯 Generate Daily Quests
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "goals" && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center py-12 card bg-surface">
                <h3 className="text-xl font-bold mb-4 text-text-primary">
                  Goals & Quest Plans
                </h3>
                <p className="text-text-secondary mb-6">
                  View and manage your goals and their associated quest plans.
                </p>
                <button
                  onClick={() => router.push("/goals")}
                  className="btn btn-primary"
                >
                  🎯 Go to Goals Page
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievements */}
        {xpData?.achievements && xpData.achievements.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">
              Recent Achievements 🏆
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {xpData.achievements.slice(0, 4).map((achievement, index) => (
                <AchievementCard key={index} achievement={achievement} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
