"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import GoalForm from "../../../components/GoalForm";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchGoals();
  }, [router]);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/goals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (goalData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to create goal");
        return;
      }

      // Show success message with next steps
      alert(`🎉 Goal created successfully! 

Next steps:
1. Click on your goal to view details
2. Generate a quest plan to create daily tasks
3. Complete quests and earn XP!`);
      setShowForm(false);
      fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
      alert("Failed to create goal");
    }
  };

  const handleUpdateGoal = async (goalData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/goals/${editingGoal._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update goal");
        return;
      }

      alert("✅ Goal updated successfully!");
      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      alert("Failed to update goal");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (
      !confirm(
        "Are you sure you want to delete this goal? This will also delete all associated quests."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete goal");
        return;
      }

      alert("🗑️ Goal deleted successfully");
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Failed to delete goal");
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "var(--color-text-muted)";
      case "medium":
        return "var(--color-warning)";
      case "high":
        return "var(--color-danger)";
      case "urgent":
        return "var(--color-quest-side)";
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

  const filteredGoals = goals.filter((goal) => {
    if (filter === "all") return true;
    return goal.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="btn btn-ghost btn-sm p-2"
              >
                <span className="text-2xl">←</span>
              </button>
              <h1 className="text-2xl font-bold text-primary">Goals 📋</h1>
            </div>

            <button
              onClick={() => {
                setEditingGoal(null);
                setShowForm(true);
              }}
              className="btn btn-primary"
            >
              ➕ Create New Goal
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show Form Modal */}
        <AnimatePresence>
          {(showForm || editingGoal) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowForm(false);
                setEditingGoal(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <GoalForm
                    initialData={editingGoal}
                    onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingGoal(null);
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "active", "completed", "paused", "cancelled"].map(
            (filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`btn btn-sm ${filter === filterType ? "btn-primary" : "btn-secondary"}`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {filterType !== "all" && (
                  <span className="ml-2 opacity-75">
                    ({goals.filter((g) => g.status === filterType).length})
                  </span>
                )}
              </button>
            )
          )}
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredGoals.map((goal) => (
              <motion.div
                key={goal._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="card flex flex-col"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {getCategoryIcon(goal.category)}
                      </span>
                      <span className={`badge badge-outline`}>
                        {goal.status}
                      </span>
                    </div>
                    <span className={`badge badge-outline`}>
                      {goal.priority}
                    </span>
                  </div>

                  <h3
                    className="font-bold text-lg mb-2 text-text-primary hover:text-primary transition-colors cursor-pointer"
                    onClick={() => router.push(`/goals/${goal._id}`)}
                  >
                    {goal.title}
                  </h3>

                  <p className="text-sm mb-4 line-clamp-3 text-text-secondary">
                    {goal.description}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <div className="text-xs text-text-muted mb-4">
                    <p>
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                    <p>Category: {goal.category}</p>
                  </div>

                  {goal.tags && goal.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {goal.tags.map((tag, index) => (
                        <span key={index} className="badge badge-neutral">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/goals/${goal._id}`)}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      View Plan
                    </button>
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setShowForm(true);
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="btn btn-ghost btn-sm text-danger"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredGoals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 card"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2 text-text-primary">
              {filter === "all" ? "No goals created yet" : `No ${filter} goals`}
            </h3>
            <p className="text-text-secondary mb-6">
              {filter === "all"
                ? "Create your first goal to start your quest journey!"
                : `You don't have any ${filter} goals at the moment.`}
            </p>
            {filter === "all" && (
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowForm(true);
                }}
                className="btn btn-primary mt-4"
              >
                Create Your First Goal
              </button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
