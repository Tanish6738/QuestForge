"use client";

import { motion } from "framer-motion";

export function XPBar({ currentXP, level, levelProgress, xpToNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-theme p-4 md:p-6 mb-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-theme-primary/10 text-theme-primary p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 11l7-7 7 7M5 19l7-7 7 7"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-theme-text-secondary">
              Level {level}
            </p>
            <p className="text-2xl font-bold text-theme-text">
              {currentXP.toLocaleString()}{" "}
              <span className="text-lg font-medium text-theme-text-secondary">
                XP
              </span>
            </p>
          </div>
        </div>

        <div className="text-sm text-theme-text-secondary w-full sm:w-auto text-left sm:text-right">
          <p>
            <span className="font-bold text-theme-text">
              {xpToNext.toLocaleString()}
            </span>{" "}
            XP to Level {level + 1}
          </p>
        </div>
      </div>

      <div className="w-full bg-theme-secondary rounded-full h-2.5">
        <motion.div
          className="bg-theme-primary h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${levelProgress}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="flex justify-end text-xs text-theme-text-muted mt-2">
        <span>{Math.round(levelProgress)}%</span>
      </div>
    </motion.div>
  );
}

export function StatsCard({ title, value, subtitle, icon, theme = "primary" }) {
  const themeClasses = {
    primary: "text-theme-primary bg-theme-primary/10",
    success: "text-theme-success bg-theme-success/10",
    warning: "text-theme-warning bg-theme-warning/10",
    error: "text-theme-error bg-theme-error/10",
    accent: "text-theme-accent bg-theme-accent/10",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="card-theme p-4 flex flex-col items-center justify-center text-center h-full"
    >
      <div className={`p-3 rounded-full mb-3 ${themeClasses[theme]}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-theme-text">{value}</p>
      <p className="font-medium text-theme-text-secondary mb-1">{title}</p>
      {subtitle && <p className="text-sm text-theme-text-muted">{subtitle}</p>}
    </motion.div>
  );
}

export function LevelBadge({ level, badge }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 2 }}
      className="card-theme flex items-center gap-3 p-3 cursor-pointer"
      title={`${badge.name} (Level ${level})`}
    >
      <div className="text-3xl" style={{ color: badge.color }}>
        {badge.icon}
      </div>
      <div>
        <p className="font-bold text-theme-text">{badge.name}</p>
        <p className="text-sm text-theme-text-secondary">Level {level}</p>
      </div>
    </motion.div>
  );
}

export function AchievementCard({ achievement }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      className="card-theme p-4 flex items-center gap-4 border-l-4 border-theme-success"
    >
      <div className="text-3xl text-theme-success">🏆</div>
      <div>
        <h4 className="font-bold text-theme-text">{achievement.name}</h4>
        <p className="text-sm text-theme-text-secondary">
          {achievement.description}
        </p>
      </div>
    </motion.div>
  );
}
