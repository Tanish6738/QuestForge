"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import QuestCard from "../../../../components/QuestCard";
import QuestPlanManager from "../../../../components/QuestPlanManager";

export default function GoalDetailPage() {
  const [goal, setGoal] = useState(null);
  const [quests, setQuests] = useState({
    main: [],
    sub: [],
    side: [],
    all: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("plan"); // 'plan', 'legacy-quests'
  const [user, setUser] = useState(null);
  const router = useRouter();
  const params = useParams();

  const fetchGoalData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/goals/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setGoal(data.goal);
        setQuests(data.quests);
      } else {
        alert(data.error || "Goal not found");
        router.push("/goals");
      }
    } catch (error) {
      console.error("Error fetching goal data:", error);
      router.push("/goals");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    console.log(userData);
    if (!token || !userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    fetchGoalData();
  }, [fetchGoalData, router]);

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

      // Refresh goal data
      fetchGoalData();
    } catch (error) {
      console.error("Error updating quest:", error);
      alert("Failed to update quest");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "var(--color-primary)";
      case "completed":
        return "var(--color-success)";
      case "paused":
        return "var(--color-warning)";
      case "cancelled":
        return "var(--color-danger)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      health: "🏃",
      career: "💼",
      education: "📚",
      personal: "🌱",
      finance: "💰",
      relationships: "❤️",
      hobbies: "🎨",
      other: "📋",
    };
    return icons[category] || "📋";
  };

  const getFilteredQuests = () => {
    if (filter === "all") return quests.all;
    if (filter === "main") return quests.main;
    if (filter === "sub") return quests.sub;
    if (filter === "side") return quests.side;

    // Filter by status
    return quests.all.filter((quest) => quest.status === filter);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading goal details...</p>
        </div>
      </div>
    );
  }

  const filteredQuests = getFilteredQuests();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* Header */}
      <header
        className="bg-white shadow-sm border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/goals")}
                className="text-2xl hover:opacity-80"
              >
                ←
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {getCategoryIcon(goal?.category)}
                </span>
                <h1 className="text-2xl font-bold text-gradient">
                  {goal?.title}
                </h1>
              </div>
            </div>

            <div
              className="text-xs px-3 py-1 rounded-full text-white font-medium"
              style={{ backgroundColor: getStatusColor(goal?.status) }}
            >
              {goal?.status?.toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Goal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2
                className="text-xl font-semibold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                Description
              </h2>
              <p style={{ color: "var(--color-text-secondary)" }}>
                {goal?.description}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3
                  className="font-medium mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Deadline
                </h3>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {new Date(goal?.deadline).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <h3
                  className="font-medium mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Priority
                </h3>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {goal?.priority?.charAt(0).toUpperCase() +
                    goal?.priority?.slice(1)}
                </p>
              </div>

              <div>
                <h3
                  className="font-medium mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Category
                </h3>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {goal?.category?.charAt(0).toUpperCase() +
                    goal?.category?.slice(1)}
                </p>
              </div>

              {goal?.tags && goal.tags.length > 0 && (
                <div>
                  <h3
                    className="font-medium mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {goal.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: "var(--color-bg-tertiary)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        {/* Quest Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              {quests.main.length}
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Main Quests
            </div>
          </div>
          <div className="card text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {quests.sub.length}
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Sub Quests
            </div>
          </div>
          <div className="card text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--color-success)" }}
            >
              {quests.all.filter((q) => q.status === "completed").length}
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Completed
            </div>
          </div>
          <div className="card text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--color-quest-active)" }}
            >
              {quests.all.filter((q) => q.status === "active").length}
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Active
            </div>
          </div>
        </div>{" "}
        {/* Enhanced Goal Information */}
        {goal?.dailyTimeAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8"
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Quest Plan Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Daily Time Available:</span>
                <p className="text-muted">
                  {goal.dailyTimeAvailable} minutes/day
                </p>
              </div>
              <div>
                <span className="font-medium">Difficulty Preference:</span>
                <p className="text-muted capitalize">
                  {goal.questGenerationPreferences?.difficulty || "Mixed"}
                </p>
              </div>
              <div>
                <span className="font-medium">Session Length:</span>
                <p className="text-muted capitalize">
                  {goal.questGenerationPreferences?.sessionLength || "Flexible"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        {/* Tab Navigation */}
        <div
          className="flex flex-wrap gap-2 mb-6 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "plan"
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-primary"
            }`}
          >
            📅 Quest Plan
          </button>
          <button
            onClick={() => setActiveTab("legacy-quests")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "legacy-quests"
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-primary"
            }`}
          >
            🗂️ Legacy Quests
          </button>
        </div>
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "plan" && user && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <QuestPlanManager goalId={params.id} userId={user.id} />
            </motion.div>
          )}

          {activeTab === "legacy-quests" && (
            <motion.div
              key="legacy-quests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Quest Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  "all",
                  "main",
                  "sub",
                  "side",
                  "available",
                  "active",
                  "completed",
                  "failed",
                ].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`btn ${filter === filterType ? "btn-primary" : "btn-secondary"}`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    <span className="ml-1">({getFilteredQuests().length})</span>
                  </button>
                ))}
              </div>
              {/* Legacy Quests List */}
              <div className="space-y-4">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Legacy Quests {filter !== "all" && `(${filter})`}
                </h2>

                <AnimatePresence>
                  {filteredQuests.length > 0 ? (
                    filteredQuests.map((quest) => (
                      <QuestCard
                        key={quest._id}
                        quest={quest}
                        onStart={(id) => handleQuestAction(id, "start")}
                        onComplete={(id) => handleQuestAction(id, "complete")}
                        onFail={(id) => handleQuestAction(id, "fail")}
                        onAccept={(id) => handleQuestAction(id, "accept")}
                        onReject={(id) => handleQuestAction(id, "reject")}
                        onRetry={(id) => handleQuestAction(id, "retry")}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="text-6xl mb-4">🎯</div>
                      <h3
                        className="text-xl font-medium mb-2"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        No legacy quests found
                      </h3>
                      <p style={{ color: "var(--color-text-secondary)" }}>
                        {filter === "all"
                          ? "Use the Quest Plan tab to generate AI-powered daily quests for this goal."
                          : `No ${filter} quests at the moment.`}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>{" "}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
