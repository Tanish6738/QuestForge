"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuestCard({
  quest,
  onStart,
  onComplete,
  onFail,
  onAccept,
  onReject,
  onRetry,
}) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (quest.status === "active" && quest.deadline) {
      const interval = setInterval(() => {
        const now = new Date();
        const deadline = new Date(quest.deadline);
        const remaining = deadline - now;

        if (remaining <= 0) {
          setIsExpired(true);
          setTimeRemaining(0);
          onFail && onFail(quest._id);
        } else {
          setTimeRemaining(remaining);
          setIsExpired(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quest.status, quest.deadline, quest._id, onFail]);

  const formatTime = (ms) => {
    if (!ms) return "00:00:00";

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getStatusClasses = () => {
    switch (quest.status) {
      case "available":
        return "border-l-quest-available";
      case "active":
        return "border-l-quest-active";
      case "completed":
        return "border-l-quest-completed";
      case "failed":
        return "border-l-quest-failed";
      default:
        return "border-l-border";
    }
  };

  const getDifficultyClasses = () => {
    switch (quest.difficulty) {
      case "easy":
        return "badge-success";
      case "medium":
        return "badge-warning";
      case "hard":
        return "badge-danger";
      case "expert":
        return "badge-accent";
      default:
        return "badge-neutral";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`card border-l-4 ${getStatusClasses()} ${quest.type === "side" ? "bg-background-elevated" : ""}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-lg text-text-primary">
              {quest.title}
            </h3>
            {quest.type === "side" && (
              <span className="badge badge-accent">Side Quest</span>
            )}
          </div>
          <p className="text-sm text-text-secondary">{quest.description}</p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`badge ${getDifficultyClasses()}`}>
            {quest.difficulty.toUpperCase()}
          </span>
          <span className="text-xl font-bold text-primary">
            {quest.xpReward} XP
          </span>
        </div>
      </div>

      {quest.status === "active" && timeRemaining !== null && (
        <div className="mb-4">
          <div
            className={`flex items-center gap-2 font-mono text-lg p-2 rounded-lg ${isExpired ? "text-danger bg-danger/10" : "text-warning bg-warning/10"}`}
          >
            <span>⏰</span>
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span>⏱ {quest.duration} min</span>
          {quest.retryCount > 0 && (
            <span className="text-warning">
              🔄 Retry {quest.retryCount}/{quest.maxRetries}
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {quest.status === "available" && quest.type !== "side" && (
            <button
              onClick={() => onStart(quest._id)}
              className="btn btn-primary btn-sm"
            >
              Start Quest
            </button>
          )}

          {quest.status === "available" && quest.type === "side" && (
            <>
              <button
                onClick={() => onReject(quest._id)}
                className="btn btn-secondary btn-sm"
              >
                Reject
              </button>
              <button
                onClick={() => onAccept(quest._id)}
                className="btn btn-success btn-sm"
              >
                Accept
              </button>
            </>
          )}

          {quest.status === "active" && !isExpired && (
            <>
              <button
                onClick={() => onFail(quest._id)}
                className="btn btn-danger btn-sm"
              >
                Give Up
              </button>
              <button
                onClick={() => onComplete(quest._id)}
                className="btn btn-success btn-sm"
              >
                Complete
              </button>
            </>
          )}

          {quest.status === "failed" && quest.retryCount < quest.maxRetries && (
            <button
              onClick={() => onRetry(quest._id)}
              className="btn btn-primary btn-sm"
            >
              Retry Quest
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
