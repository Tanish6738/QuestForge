'use client';

import { motion } from 'framer-motion';

export default function XPBar({ currentXP, level, levelProgress, xpToNext }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card mb-6 bg-gradient text-white"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="level-badge mb-2">
            ✨ Level {level}
          </div>
          <p className="text-white/90">
            <strong>{currentXP.toLocaleString()}</strong> XP
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-white/90 text-sm">
            {xpToNext.toLocaleString()} XP to next level
          </p>
        </div>
      </div>
      
      <div className="xp-bar bg-white/20">
        <motion.div 
          className="xp-progress"
          initial={{ width: 0 }}
          animate={{ width: `${levelProgress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-white/80 mt-2">
        <span>{Math.round(levelProgress)}% complete</span>
        <span>Level {level + 1}</span>
      </div>
    </motion.div>
  );
}

export function StatsCard({ title, value, subtitle, icon, color = 'var(--color-primary)' }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="card text-center"
    >
      <div 
        className="text-2xl mb-2"
        style={{ color }}
      >
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </h3>
      <p className="font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

export function LevelBadge({ level, badge }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="level-badge cursor-pointer"
      style={{ backgroundColor: badge.color }}
      title={`${badge.name} (Level ${level})`}
    >
      <span className="text-lg">{badge.icon}</span>
      <span>Level {level}</span>
      <span className="text-xs opacity-90">{badge.name}</span>
    </motion.div>
  );
}

export function AchievementCard({ achievement }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="card border-l-4"
      style={{ borderLeftColor: 'var(--color-success)' }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="text-2xl"
          style={{ color: 'var(--color-success)' }}
        >
          🏆
        </div>
        <div>
          <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {achievement.name}
          </h4>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {achievement.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
