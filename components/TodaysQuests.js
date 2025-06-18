"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
      <div className="card-theme text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
        <p className="mt-4 text-theme-text-secondary">Loading Today&apos;s Quests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-theme text-center p-8">
        <div className="text-5xl mb-4">😢</div>
        <h3 className="text-xl font-bold text-theme-error mb-2">An Error Occurred</h3>
        <p className="text-theme-error mb-6">{error}</p>
        <button onClick={fetchTodaysQuests} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!questData || questData.totalQuests === 0) {
    return (
      <div className="card-theme text-center p-8">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-2xl font-bold text-theme-text mb-4">No Quests for Today</h3>
        <p className="text-theme-text-secondary mb-6 max-w-md mx-auto">
          You don&apos;t have any quests scheduled for today. Here&apos;s how to get started:
        </p>
        
        <div className="space-y-4 max-w-md mx-auto text-left mb-8">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-theme-secondary">
            <span className="text-3xl">📋</span>
            <div>
              <h4 className="font-semibold text-theme-text mb-1">1. Create a Goal</h4>
              <p className="text-sm text-theme-text-secondary">Define what you want to achieve.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-lg bg-theme-secondary">
            <span className="text-3xl">🗺️</span>
            <div>
              <h4 className="font-semibold text-theme-text mb-1">2. Generate Quest Plan</h4>
              <p className="text-sm text-theme-text-secondary">Let AI create daily quests for your goal.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-lg bg-theme-secondary">
            <span className="text-3xl">⚡</span>
            <div>
              <h4 className="font-semibold text-theme-text mb-1">3. Complete Quests</h4>
              <p className="text-sm text-theme-text-secondary">Earn XP and level up as you progress.</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/goals" className="btn-primary">
            📋 Create Your First Goal
          </Link>
          <button onClick={fetchTodaysQuests} className="btn-outline-primary">
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-theme p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-3xl font-bold text-theme-text">
            Today&apos;s Quests
          </h2>
          <div className="text-left sm:text-right">
            <p className="text-sm text-theme-text-secondary">{questData.date}</p>
            <p className="text-lg font-semibold text-theme-text">
              {questData.totalQuests} Quest
              {questData.totalQuests !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {questData.questsByGoal.map((goalGroup, index) => (
            <div
              key={goalGroup.goal?._id || `no-goal-${index}`}
              className="p-4 rounded-lg bg-theme-secondary"
            >
              <h4 className="font-semibold text-theme-text mb-2 truncate">
                {goalGroup.goal?.title || "General Quests"}
              </h4>
              <p className="text-sm text-theme-text-secondary mb-2 capitalize">
                {goalGroup.goal?.category || "general"}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-theme-primary">
                  {
                    goalGroup.quests.filter((q) => q.status === "completed")
                      .length
                  }
                </span>
                <span className="text-theme-text-secondary">/ {goalGroup.quests.length}</span>
                <span className="text-sm text-theme-text-secondary">quests</span>
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
          className="card-theme p-6"
        >
          {goalGroup.goal && (
            <div className="mb-6 pb-4 border-b border-theme-border/20">
              <h3 className="text-xl font-bold text-theme-text mb-2">{goalGroup.goal.title}</h3>
              <p className="text-theme-text-secondary text-sm mb-3 max-w-prose">{goalGroup.goal.description}</p>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-theme-text-secondary">
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

          <div className="space-y-4">
            {goalGroup.quests.map((quest, questIndex) => (
              <motion.div
                key={quest._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: questIndex * 0.05 }}
                className={`p-4 rounded-lg border-l-4 transition-all duration-200 ${
                  quest.status === "active"
                    ? "border-theme-primary bg-theme-primary/10"
                    : quest.status === "completed"
                      ? "border-theme-success bg-theme-success/10"
                      : "border-theme-border/20 bg-theme-secondary hover:border-theme-primary/50"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className="text-lg">{getStatusIcon(quest)}</span>
                      <h4 className="font-semibold text-lg text-theme-text">{quest.title}</h4>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{
                          backgroundColor: getDifficultyColor(quest.difficulty),
                        }}
                      >
                        {quest.difficulty}
                      </span>
                    </div>

                    <p className="text-theme-text-secondary mb-3">{quest.description}</p>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-theme-text-secondary">
                      <span>⏱️ {quest.duration} min</span>
                      <span>🎁 {quest.xpReward} XP</span>
                      {quest.dayNumber && <span>📅 Day {quest.dayNumber}</span>}
                      {quest.isOptional && (
                        <span className="text-theme-accent font-medium">🌟 Optional</span>
                      )}
                    </div>

                    {quest.status === "active" && quest.deadline && (
                      <div className="mt-2 text-sm">
                        <span className="text-theme-warning">
                          ⏰ Ends:{" "}
                          {new Date(quest.deadline).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-stretch gap-2 w-full sm:w-auto">
                    {quest.status === "available" && (
                      <button
                        onClick={() => startQuest(quest._id)}
                        className="btn-primary w-full px-4 py-2 rounded-md"
                        disabled={activeQuest && activeQuest._id !== quest._id}
                      >
                        Start Quest
                      </button>
                    )}

                    {quest.status === "active" && (
                      <button
                        onClick={() => completeQuest(quest._id)}
                        className="bg-theme-success text-white px-4 py-2 rounded-md w-full"
                      >
                        Complete
                      </button>
                    )}

                    {quest.status === "completed" && (
                      <div className="text-center p-2 rounded-md bg-theme-success/10">
                        <span className="font-medium text-theme-success">
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
      <div className="text-center mt-8">
        <button onClick={fetchTodaysQuests} className="btn-outline-primary px-4 py-2 rounded-md">
          🔄 Refresh Quests
        </button>
      </div>
    </div>
  );
}
