"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import QuestCard from "../../../../components/QuestCard";
import QuestPlanManager from "../../../../components/QuestPlanManager";
import { StatsCard } from "../../../../components/XPComponents";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading goal details...</p>
        </div>
      </div>
    );
  }

  const filteredQuests = getFilteredQuests();

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/goals")}
                className="btn btn-ghost btn-sm p-2"
              >
                <span className="text-2xl">←</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getCategoryIcon(goal?.category)}
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-text-primary">
                  {goal?.title}
                </h1>
              </div>
            </div>

            <span
              className={`badge ${
                goal?.status === "completed"
                  ? "badge-success"
                  : "badge-primary"
              }`}
            >
              {goal?.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Goal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-3 text-text-primary">
                Description
              </h2>
              <p className="text-text-secondary prose prose-sm max-w-none">
                {goal?.description}
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-1 text-text-primary">
                  Deadline
                </h3>
                <p className="text-text-secondary">
                  {new Date(goal?.deadline).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1 text-text-primary">
                  Priority
                </h3>
                <p className="text-text-secondary capitalize">
                  {goal?.priority}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1 text-text-primary">
                  Category
                </h3>
                <p className="text-text-secondary capitalize">
                  {goal?.category}
                </p>
              </div>

              {goal?.tags && goal.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-text-primary">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {goal.tags.map((tag, index) => (
                      <span key={index} className="badge badge-neutral">
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
          <StatsCard
            title="Main Quests"
            value={quests.main.length}
            icon="🎯"
          />
          <StatsCard title="Sub Quests" value={quests.sub.length} icon="⦿" />
          <StatsCard
            title="Completed"
            value={quests.all.filter((q) => q.status === "completed").length}
            icon="✅"
          />
          <StatsCard
            title="Active"
            value={quests.all.filter((q) => q.status === "active").length}
            icon="⚔️"
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border mb-6">
          <div className="flex flex-wrap gap-2 -mb-px">
            <button
              onClick={() => setActiveTab("plan")}
              className={`tab-button ${
                activeTab === "plan" ? "tab-button-active" : ""
              }`}
            >
              📅 Quest Plan
            </button>
            <button
              onClick={() => setActiveTab("legacy-quests")}
              className={`tab-button ${
                activeTab === "legacy-quests" ? "tab-button-active" : ""
              }`}
            >
              🗂️ All Generated Quests
            </button>
          </div>
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
              <QuestPlanManager goalId={params.id} userId={user.id} goal={goal} />
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
                {["all", "main", "sub", "side", "available", "active", "completed", "failed"].map(
                  (filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType)}
                      className={`btn btn-sm ${
                        filter === filterType ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </button>
                  )
                )}
              </div>
              {/* Legacy Quests List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      className="text-center py-12 card md:col-span-2 lg:col-span-3"
                    >
                      <div className="text-6xl mb-4">🎯</div>
                      <h3 className="text-xl font-bold mb-2 text-text-primary">
                        No quests found
                      </h3>
                      <p className="text-text-secondary">
                        {filter === "all"
                          ? "Use the Quest Plan tab to generate AI-powered daily quests for this goal."
                          : `No ${filter} quests at the moment.`}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
