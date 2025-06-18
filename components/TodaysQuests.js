"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TodaysQuests({ userId }) {
  const [questData, setQuestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeQuest, setActiveQuest] = useState(null);
  const fetchTodaysQuests = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 TodaysQuests: Fetching quests for userId:", userId);
      
      const response = await fetch(`/api/quests/today?userId=${userId}`);

      console.log("📡 TodaysQuests: API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ TodaysQuests: API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch today's quests");
      }

      const data = await response.json();
      console.log("✅ TodaysQuests: Received data:", data);
      setQuestData(data);
    } catch (err) {
      console.error("❌ TodaysQuests: Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTodaysQuests();
    }
  }, [userId, fetchTodaysQuests]);

  const startQuest = async (questId) => {
    try {
      const response = await fetch("/api/quests/today", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "startQuest",
          questId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start quest");
      }

      const data = await response.json();
      setActiveQuest(data.quest);
      await fetchTodaysQuests(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const completeQuest = async (questId) => {
    try {
      const response = await fetch("/api/quests/today", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "completeQuest",
          questId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete quest");
      }

      const data = await response.json();
      setActiveQuest(null);
      await fetchTodaysQuests(); // Refresh the list

      // Show XP earned notification
      if (data.xpEarned) {
        // You can add a toast notification here
        console.log(`Quest completed! +${data.xpEarned} XP earned!`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: "var(--color-success)",
      medium: "var(--color-warning)",
      hard: "var(--color-danger)",
      expert: "var(--color-quest-side)",
    };
    return colors[difficulty] || colors.medium;
  };

  const getStatusIcon = (quest) => {
    switch (quest.status) {
      case "completed":
        return "✅";
      case "active":
        return "⚡";
      case "available":
        return "🎯";
      default:
        return "📋";
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button onClick={fetchTodaysQuests} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  if (!questData || questData.totalQuests === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold mb-4">No Quests for Today</h3>
          <p className="text-muted mb-6 max-w-md mx-auto">
            You don&apos;t have any quests scheduled for today. Here&apos;s how to get started with your quest journey:
          </p>
          
          <div className="space-y-3 max-w-md mx-auto text-left mb-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background-elevated">
              <span className="text-2xl">📋</span>
              <div>
                <h4 className="font-semibold mb-1">1. Create a Goal</h4>
                <p className="text-sm text-muted">Define what you want to achieve</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background-elevated">
              <span className="text-2xl">🗺️</span>
              <div>
                <h4 className="font-semibold mb-1">2. Generate Quest Plan</h4>
                <p className="text-sm text-muted">Let AI create daily quests for your goal</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background-elevated">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-semibold mb-1">3. Complete Quests</h4>
                <p className="text-sm text-muted">Earn XP and level up as you progress</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/goals" className="btn btn-primary">
              📋 Create Your First Goal
            </a>
            <button onClick={fetchTodaysQuests} className="btn btn-secondary">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          {" "}
          <h2 className="text-2xl font-bold text-gradient">
            Today&apos;s Quests
          </h2>
          <div className="text-right">
            <p className="text-sm text-muted">{questData.date}</p>{" "}
            <p className="text-lg font-semibold">
              {questData.totalQuests} Quest
              {questData.totalQuests !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {questData.questsByGoal.map((goalGroup, index) => (
            <div
              key={goalGroup.goal?._id || `no-goal-${index}`}
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--color-background-elevated)" }}
            >
              <h4 className="font-semibold mb-2 truncate">
                {goalGroup.goal?.title || "General Quests"}
              </h4>
              <p className="text-sm text-muted mb-2">
                {goalGroup.goal?.category || "general"}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {
                    goalGroup.quests.filter((q) => q.status === "completed")
                      .length
                  }
                </span>
                <span className="text-muted">/ {goalGroup.quests.length}</span>
                <span className="text-sm text-muted">quests</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quest Groups by Goal */}
      {questData.questsByGoal.map((goalGroup, groupIndex) => (
        <motion.div
          key={goalGroup.goal?._id || `no-goal-${groupIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
          className="card"
        >
          {goalGroup.goal && (
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-2">{goalGroup.goal.title}</h3>
              <p className="text-muted text-sm">{goalGroup.goal.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                <span>
                  📅 Due:{" "}
                  {new Date(goalGroup.goal.deadline).toLocaleDateString()}
                </span>
                <span>⏱️ {goalGroup.goal.dailyTimeAvailable} min/day</span>
                <span className="capitalize">
                  🎯 {goalGroup.goal.priority} priority
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {goalGroup.quests.map((quest, questIndex) => (
              <motion.div
                key={quest._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.1 + questIndex * 0.05 }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  quest.status === "active"
                    ? "border-primary bg-primary/5"
                    : quest.status === "completed"
                      ? "border-green-500 bg-green-500/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getStatusIcon(quest)}</span>
                      <h4 className="font-semibold text-lg">{quest.title}</h4>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{
                          backgroundColor: getDifficultyColor(quest.difficulty),
                        }}
                      >
                        {quest.difficulty}
                      </span>
                    </div>

                    <p className="text-muted mb-3">{quest.description}</p>

                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>⏱️ {quest.duration} min</span>
                      <span>🎁 {quest.xpReward} XP</span>
                      {quest.dayNumber && <span>📅 Day {quest.dayNumber}</span>}
                      {quest.isOptional && (
                        <span className="text-blue-500">🌟 Optional</span>
                      )}
                    </div>

                    {quest.status === "active" && quest.deadline && (
                      <div className="mt-2 text-sm">
                        <span className="text-orange-500">
                          ⏰ Ends:{" "}
                          {new Date(quest.deadline).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {quest.status === "available" && (
                      <button
                        onClick={() => startQuest(quest._id)}
                        className="btn btn-primary"
                        disabled={activeQuest && activeQuest._id !== quest._id}
                      >
                        Start Quest
                      </button>
                    )}

                    {quest.status === "active" && (
                      <button
                        onClick={() => completeQuest(quest._id)}
                        className="btn btn-success"
                      >
                        Complete
                      </button>
                    )}

                    {quest.status === "completed" && (
                      <div className="text-center">
                        <span className="text-green-500 font-medium">
                          ✅ Completed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Refresh Button */}
      <div className="text-center">
        <button onClick={fetchTodaysQuests} className="btn btn-secondary">
          🔄 Refresh Quests
        </button>
      </div>
    </div>
  );
}
