"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatsCard } from "./XPComponents";

export default function QuestPlanManager({ goalId, userId }) {
  const [questPlan, setQuestPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [actionLoading, setActionLoading] = useState({}); // Track loading state for individual quests
  const [activeTimers, setActiveTimers] = useState({}); // Track active timers for quests
  const [timerIntervals, setTimerIntervals] = useState({}); // Store interval IDs

  // Debug: Log props when component mounts
  useEffect(() => {
    console.log("🎯 QuestPlanManager mounted with props:", { goalId, userId });
  }, [goalId, userId]);

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      Object.values(timerIntervals).forEach((intervalId) => {
        if (intervalId) clearInterval(intervalId);
      });
    };
  }, [timerIntervals]);

  const startQuestTimer = (questId, durationInMinutes) => {
    const totalSeconds = durationInMinutes * 60;
    let remainingSeconds = totalSeconds;

    // Set initial timer state
    setActiveTimers((prev) => ({
      ...prev,
      [questId]: {
        remainingSeconds,
        totalSeconds,
        isRunning: true,
      },
    })); // Create countdown interval
    const intervalId = setInterval(() => {
      remainingSeconds -= 1;

      setActiveTimers((prev) => ({
        ...prev,
        [questId]: {
          ...prev[questId],
          remainingSeconds,
        },
      }));

      // Show warning at 5 minutes remaining
      if (remainingSeconds === 300) {
        // 5 minutes
        const quest = questPlan?.dailyPlans?.[selectedDay]?.quests?.find(
          (q) => q._id === questId
        );
        if (quest) {
          alert(`⚠️ 5 minutes remaining for "${quest.title}"!`);
        }
      }

      // Show warning at 1 minute remaining
      if (remainingSeconds === 60) {
        // 1 minute
        const quest = questPlan?.dailyPlans?.[selectedDay]?.quests?.find(
          (q) => q._id === questId
        );
        if (quest) {
          alert(`⏰ 1 minute remaining for "${quest.title}"!`);
        }
      }

      // Timer finished
      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        setTimerIntervals((prev) => {
          const newIntervals = { ...prev };
          delete newIntervals[questId];
          return newIntervals;
        });

        // Show completion dialog
        showTimerCompletionDialog(questId);
      }
    }, 1000);

    // Store interval ID
    setTimerIntervals((prev) => ({
      ...prev,
      [questId]: intervalId,
    }));
  };

  const stopQuestTimer = (questId) => {
    const intervalId = timerIntervals[questId];
    if (intervalId) {
      clearInterval(intervalId);
      setTimerIntervals((prev) => {
        const newIntervals = { ...prev };
        delete newIntervals[questId];
        return newIntervals;
      });
    }

    setActiveTimers((prev) => {
      const newTimers = { ...prev };
      delete newTimers[questId];
      return newTimers;
    });
  };

  const showTimerCompletionDialog = (questId) => {
    const quest = questPlan.dailyPlans[selectedDay]?.quests?.find(
      (q) => q._id === questId
    );
    if (!quest) return;

    const userChoice = confirm(
      `⏰ Timer finished for "${quest.title}"!\n\n` +
        `Did you successfully complete this quest?\n\n` +
        `✅ Click OK if you completed it (earn +${quest.xpReward} XP)\n` +
        `❌ Click Cancel if you didn't finish (no XP penalty)`
    );

    if (userChoice) {
      handleQuestAction(questId, "complete");
    } else {
      handleQuestAction(questId, "fail");
    }

    // Clean up timer state
    setActiveTimers((prev) => {
      const newTimers = { ...prev };
      delete newTimers[questId];
      return newTimers;
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const handleQuestAction = async (questId, action) => {
    try {
      setActionLoading((prev) => ({ ...prev, [questId]: true }));

      // If starting a quest, start the timer
      if (action === "start") {
        const quest = questPlan.dailyPlans[selectedDay]?.quests?.find(
          (q) => q._id === questId
        );
        if (quest) {
          startQuestTimer(questId, quest.duration);
        }
      }

      // If completing or failing, stop the timer
      if (action === "complete" || action === "fail") {
        stopQuestTimer(questId);
      }

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
        throw new Error(data.error || "Failed to update quest");
      }

      // Show success message
      if (action === "start") {
        const quest = questPlan.dailyPlans[selectedDay]?.quests?.find(
          (q) => q._id === questId
        );
        alert(
          `🚀 Quest started! Timer set for ${quest?.duration || 0} minutes.`
        );
      } else if (action === "complete") {
        alert(`🎉 Quest completed! +${data.xpGained || 0} XP earned!`);
      } else if (action === "fail") {
        alert(
          `😔 Quest failed. ${data.xpLost ? `-${data.xpLost} XP lost` : "No XP penalty this time."}`
        );
      }

      // Refresh quest plan to show updated data
      await fetchQuestPlan();
    } catch (error) {
      console.error("Error updating quest:", error);
      alert(`Failed to ${action} quest: ${error.message}`);

      // Stop timer if there was an error
      if (action === "start") {
        stopQuestTimer(questId);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [questId]: false }));
    }
  };

  const fetchQuestPlan = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching quest plan for:", { goalId, userId });

      const response = await fetch(
        `/api/goals/${goalId}/plan?userId=${userId}`
      );

      console.log("📡 Quest plan fetch response:", {
        status: response.status,
        statusText: response.statusText,
      });

      if (response.status === 404) {
        // No quest plan exists yet
        console.log("📋 No quest plan exists - showing generate button");
        setQuestPlan(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Quest plan fetch failed:", errorData);
        throw new Error(errorData.error || "Failed to fetch quest plan");
      }
      const data = await response.json();
      console.log("✅ Quest plan fetched successfully:", data.questPlan);
      console.log(
        "📊 Daily plans structure:",
        data.questPlan.dailyPlans?.slice(0, 2)
      ); // Show first 2 days for debugging
      setQuestPlan(data.questPlan);
    } catch (err) {
      console.error("❌ Error fetching quest plan:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [goalId, userId]);

  useEffect(() => {
    if (goalId && userId) {
      fetchQuestPlan();
    }
  }, [goalId, userId, fetchQuestPlan]);
  const generateQuestPlan = async (regenerate = false) => {
    try {
      setGenerating(true);
      setError(null);

      console.log("🚀 Starting quest plan generation...", {
        goalId,
        userId,
        regenerate,
      });

      // Add client-side timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

      const response = await fetch(`/api/goals/${goalId}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          regenerate,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Quest plan generation failed:", errorData);
        throw new Error(
          errorData.error ||
            errorData.details ||
            "Failed to generate quest plan"
        );
      }

      const data = await response.json();
      console.log("✅ Quest plan generated successfully:", data);
      setQuestPlan(data.questPlan);
    } catch (err) {
      console.error("❌ Quest plan generation error:", err);
      if (err.name === "AbortError") {
        setError(
          "Quest plan generation timed out. Please try again with a shorter time frame or simpler goal."
        );
      } else {
        setError(`${err.message}. Please check the console for more details.`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "var(--color-success)";
    if (percentage >= 60) return "var(--color-warning)";
    if (percentage >= 40) return "var(--color-primary)";
    return "var(--color-danger)";
  };

  const getDayStatus = (dailyPlan) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const planDate = new Date(dailyPlan.date);
    planDate.setHours(0, 0, 0, 0);

    if (planDate < today) {
      return dailyPlan.status === "completed" ? "completed" : "missed";
    } else if (planDate.getTime() === today.getTime()) {
      return "today";
    } else {
      return "upcoming";
    }
  };

  const getDayStatusColor = (status) => {
    const colors = {
      completed: "var(--color-success)",
      missed: "var(--color-danger)",
      today: "var(--color-primary)",
      upcoming: "var(--color-text-muted)",
    };
    return colors[status] || colors.upcoming;
  };

  const getDayStatusIcon = (status) => {
    const icons = {
      completed: "✅",
      missed: "❌",
      today: "⚡",
      upcoming: "📅",
    };
    return icons[status] || icons.upcoming;
  };

  if (loading) {
    return (
      <div className="card-theme text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
        <p className="mt-4 text-theme-text-secondary">Loading Quest Plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-theme text-center p-8">
        <div className="text-5xl mb-4">😢</div>
        <h3 className="text-xl font-bold text-theme-error mb-2">
          An Error Occurred
        </h3>
        <p className="text-theme-error mb-6">{error}</p>
        <button onClick={fetchQuestPlan} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!questPlan) {
    return (
      <div className="card-theme text-center p-8">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-2xl font-bold text-theme-text mb-4">
          Generate Your Quest Plan
        </h3>
        <p className="text-theme-text-secondary mb-6 max-w-md mx-auto">
          Create a personalized daily quest plan to achieve your goal step by
          step.
        </p>
        <button
          onClick={() => generateQuestPlan(false)}
          disabled={generating}
          className="btn-primary px-8 py-3 text-lg"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Generating Quest Plan...
            </>
          ) : (
            "🎯 Generate Quest Plan"
          )}
        </button>
        {generating && (
          <div className="mt-6 p-4 bg-theme-secondary-lighter rounded-lg text-left">
            <p className="text-sm text-theme-text-secondary">
              🤖 AI is analyzing your goal and creating personalized daily
              quests...
              <br />
              ⏱️ This may take 30-60 seconds for complex goals.
              <br />
              🔍 Check browser console for detailed progress.
            </p>
          </div>
        )}
      </div>
    );
  }

  const progress = questPlan.calculateProgress
    ? questPlan.calculateProgress()
    : 0;
  const totalDays = questPlan.totalDays || 0;
  const completedDays =
    questPlan.dailyPlans?.filter((dp) => dp.status === "completed").length || 0;

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <div className="card-theme p-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-theme-text mb-2">
              {questPlan.title}
            </h2>
            <p className="text-theme-text-secondary mb-4 max-w-prose">
              {questPlan.description}
            </p>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-theme-text-secondary">
              <span>📅 {totalDays} days</span>
              <span>
                🎯 {questPlan.statistics?.totalQuestsGenerated || 0} quests
              </span>
              <span>✅ {completedDays} days completed</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-start md:items-end gap-2">
            <button
              onClick={() => generateQuestPlan(true)}
              disabled={generating}
              className="btn-outline-primary"
            >
              {generating ? "Regenerating..." : "🔄 Regenerate Plan"}
            </button>
            <div className="text-sm text-theme-text-secondary">
              Status:{" "}
              <span className="capitalize font-medium text-theme-text">
                {questPlan.status}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1 text-theme-text-secondary">
            <span>Overall Progress</span>
            <span className="font-bold text-theme-text">{progress}%</span>
          </div>
          <div className="w-full bg-theme-secondary rounded-full h-2.5">
            <div
              className="bg-theme-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Completed Quests"
            value={questPlan.statistics?.completedQuests || 0}
            icon={"✅"}
            theme="success"
          />
          <StatsCard
            title="Skipped Days"
            value={questPlan.statistics?.skippedDays || 0}
            icon={"⏭️"}
            theme="warning"
          />
          <StatsCard
            title="XP Earned"
            value={questPlan.statistics?.totalXPEarned || 0}
            icon={"✨"}
            theme="primary"
          />
          <StatsCard
            title="Avg. Time (min)"
            value={Math.round(questPlan.statistics?.averageCompletionTime || 0)}
            icon={"⏱️"}
            theme="accent"
          />
        </div>
      </div>

      {/* Daily Plans Calendar View */}
      <div className="card-theme p-6">
        <h3 className="text-xl font-bold text-theme-text mb-6">
          Daily Plan Calendar
        </h3>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center font-medium text-theme-text-secondary text-sm py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {questPlan.dailyPlans?.map((dailyPlan, index) => {
            const status = getDayStatus(dailyPlan);
            const date = new Date(dailyPlan.date);

            return (
              <motion.button
                key={dailyPlan.date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() =>
                  setSelectedDay(selectedDay === index ? null : index)
                }
                className={`p-2 md:p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center aspect-square ${
                  selectedDay === index
                    ? "border-theme-primary bg-theme-primary/10"
                    : "border-theme-border/20 hover:border-theme-primary/50 bg-theme-secondary"
                }`}
              >
                <div className="text-base md:text-lg font-bold text-theme-text">
                  {date.getDate()}
                </div>
                <div className="text-lg mt-1">
                  <span style={{ color: getDayStatusColor(status) }}>
                    {getDayStatusIcon(status)}
                  </span>
                </div>
                <div className="text-xs text-theme-text-secondary mt-1">
                  {dailyPlan.completedQuests}/{dailyPlan.totalQuests}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <AnimatePresence>
        {selectedDay !== null && questPlan.dailyPlans?.[selectedDay] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card-theme p-6"
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-theme-text mb-2">
                Day {questPlan.dailyPlans[selectedDay].dayNumber} -{" "}
                {new Date(
                  questPlan.dailyPlans[selectedDay].date
                ).toLocaleDateString()}
              </h3>

              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-theme-text-secondary">
                <span>
                  {getDayStatusIcon(
                    getDayStatus(questPlan.dailyPlans[selectedDay])
                  )}{" "}
                  {getDayStatus(questPlan.dailyPlans[selectedDay])
                    .charAt(0)
                    .toUpperCase() +
                    getDayStatus(questPlan.dailyPlans[selectedDay]).slice(1)}
                </span>
                <span>
                  ⏱️ {questPlan.dailyPlans[selectedDay].estimatedTimeNeeded} min
                </span>
                <span>
                  📋 {questPlan.dailyPlans[selectedDay].completedQuests}/
                  {questPlan.dailyPlans[selectedDay].totalQuests} quests
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {questPlan.dailyPlans[selectedDay].quests &&
              questPlan.dailyPlans[selectedDay].quests.length > 0 ? (
                questPlan.dailyPlans[selectedDay].quests.map(
                  (quest, questIndex) => {
                    const timer = activeTimers[quest._id];
                    const isTimerRunning = timer?.isRunning;

                    return (
                      <div
                        key={questIndex}
                        className="p-4 border rounded-lg bg-background-elevated"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {quest.title}
                            </h4>
                            <p className="text-muted text-sm mt-1">
                              {quest.description}
                            </p>
                            {/* Timer Display */}
                            {isTimerRunning && (
                              <div
                                className={`mt-3 p-3 rounded-lg border ${
                                  timer.remainingSeconds <= 60
                                    ? "bg-red-100 border-red-300 animate-pulse"
                                    : timer.remainingSeconds <= 300
                                      ? "bg-yellow-100 border-yellow-300"
                                      : "bg-primary/10 border-primary/20"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={`text-sm font-medium ${
                                      timer.remainingSeconds <= 60
                                        ? "text-red-600"
                                        : timer.remainingSeconds <= 300
                                          ? "text-yellow-600"
                                          : "text-primary"
                                    }`}
                                  >
                                    {timer.remainingSeconds <= 60
                                      ? "🚨"
                                      : timer.remainingSeconds <= 300
                                        ? "⚠️"
                                        : "⏱️"}{" "}
                                    Timer Active
                                  </span>
                                  <span
                                    className={`text-lg font-bold ${
                                      timer.remainingSeconds <= 60
                                        ? "text-red-600"
                                        : timer.remainingSeconds <= 300
                                          ? "text-yellow-600"
                                          : "text-primary"
                                    }`}
                                  >
                                    {formatTime(timer.remainingSeconds)}
                                  </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
                                      timer.remainingSeconds <= 60
                                        ? "bg-red-500"
                                        : timer.remainingSeconds <= 300
                                          ? "bg-yellow-500"
                                          : "bg-primary"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>

                                <div className="flex justify-between text-xs text-muted mt-1">
                                  <span>Progress: {Math.round(progress)}%</span>
                                  <span>Total: {quest.duration} min</span>
                                </div>

                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => stopQuestTimer(quest._id)}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    ⏹️ Stop Timer
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleQuestAction(quest._id, "complete")
                                    }
                                    disabled={actionLoading[quest._id]}
                                    className="btn btn-success btn-sm"
                                  >
                                    {actionLoading[quest._id]
                                      ? "⏳"
                                      : "✅ Complete Early"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-primary font-bold">
                              +{quest.xpReward} XP
                            </div>
                            <div className="text-xs text-muted">
                              {quest.duration} min
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs">
                            <span
                              className="px-2 py-1 rounded"
                              style={{
                                backgroundColor:
                                  quest.difficulty === "easy"
                                    ? "var(--color-success)"
                                    : quest.difficulty === "hard"
                                      ? "var(--color-danger)"
                                      : "var(--color-warning)",
                                color: "white",
                              }}
                            >
                              {quest.difficulty || "medium"}
                            </span>
                            <span className="text-muted">
                              Type: {quest.type || "main"}
                            </span>
                            {quest.isOptional && (
                              <span className="text-muted">(Optional)</span>
                            )}
                            <span
                              className="px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor:
                                  quest.status === "completed"
                                    ? "var(--color-success)"
                                    : quest.status === "active"
                                      ? "var(--color-primary)"
                                      : quest.status === "failed"
                                        ? "var(--color-danger)"
                                        : "var(--color-text-muted)",
                                color: "white",
                              }}
                            >
                              {quest.status || "available"}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {(!quest.status ||
                              quest.status === "available") && (
                              <button
                                onClick={() =>
                                  handleQuestAction(quest._id, "start")
                                }
                                disabled={actionLoading[quest._id]}
                                className="btn btn-primary btn-sm"
                              >
                                {actionLoading[quest._id] ? "⏳" : "🚀 Start"}
                              </button>
                            )}

                            {quest.status === "active" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleQuestAction(quest._id, "complete")
                                  }
                                  disabled={actionLoading[quest._id]}
                                  className="btn btn-success btn-sm"
                                >
                                  {actionLoading[quest._id]
                                    ? "⏳"
                                    : "✅ Complete"}
                                </button>
                                <button
                                  onClick={() =>
                                    handleQuestAction(quest._id, "fail")
                                  }
                                  disabled={actionLoading[quest._id]}
                                  className="btn btn-danger btn-sm"
                                >
                                  {actionLoading[quest._id] ? "⏳" : "❌ Fail"}
                                </button>
                              </>
                            )}

                            {(quest.status === "completed" ||
                              quest.status === "failed") && (
                              <button
                                onClick={() =>
                                  handleQuestAction(quest._id, "retry")
                                }
                                disabled={actionLoading[quest._id]}
                                className="btn btn-secondary btn-sm"
                              >
                                {actionLoading[quest._id] ? "⏳" : "🔄 Retry"}{" "}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="text-center text-muted py-8">
                  <p>
                    Quest details would be loaded here when quests are
                    populated.
                  </p>
                  <p className="text-sm mt-2">
                    This day has {questPlan.dailyPlans[selectedDay].totalQuests}{" "}
                    quest(s) planned.
                  </p>
                  <p className="text-xs mt-2 text-warning">
                    Debug: Quest data structure may need to be checked.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestones */}
      {questPlan.milestones && questPlan.milestones.length > 0 && (
        <div className="card-theme p-6">
          <h3 className="text-xl font-bold text-theme-text mb-4">Milestones</h3>
          <div className="space-y-3">
            {questPlan.milestones.map((milestone, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  milestone.completed
                    ? "border-theme-success bg-theme-success/10"
                    : "border-theme-border/20 bg-theme-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-theme-text">
                      {milestone.completed ? "✅" : "🎯"} {milestone.title}
                    </h4>
                    <p className="text-sm text-theme-text-secondary">
                      Day {milestone.day}: {milestone.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-bold text-theme-primary">
                      +{milestone.xpReward} XP
                    </div>
                    {milestone.completed && milestone.completedAt && (
                      <div className="text-xs text-theme-text-secondary">
                        {new Date(milestone.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
