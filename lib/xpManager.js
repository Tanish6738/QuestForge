// XP and level management utilities

export function calculateLevelFromXP(totalXP) {
  // Level formula: level = floor(sqrt(totalXP / 100)) + 1
  // This creates a curve where higher levels require more XP
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

export function getXPRequiredForLevel(level) {
  // XP required for specific level: (level - 1)^2 * 100
  return Math.pow(level - 1, 2) * 100;
}

export function getXPRequiredForNextLevel(currentLevel) {
  // XP required for next level
  return Math.pow(currentLevel, 2) * 100;
}

export function getLevelProgress(totalXP, currentLevel) {
  const currentLevelXP = getXPRequiredForLevel(currentLevel);
  const nextLevelXP = getXPRequiredForNextLevel(currentLevel);
  
  const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.max(0, Math.min(100, progress));
}

export function getXPToNextLevel(totalXP, currentLevel) {
  const nextLevelXP = getXPRequiredForNextLevel(currentLevel);
  return Math.max(0, nextLevelXP - totalXP);
}

export class XPManager {
  constructor(user) {
    this.user = user;
    this.initialXP = user.totalXP;
    this.initialLevel = user.level;
  }

  addXP(amount) {
    this.user.totalXP += amount;
    this.updateLevel();
    return {
      xpGained: amount,
      newXP: this.user.totalXP,
      oldLevel: this.initialLevel,
      newLevel: this.user.level,
      leveledUp: this.user.level > this.initialLevel
    };
  }

  removeXP(amount) {
    this.user.totalXP = Math.max(0, this.user.totalXP - amount);
    this.updateLevel();
    return {
      xpLost: amount,
      newXP: this.user.totalXP,
      oldLevel: this.initialLevel,
      newLevel: this.user.level,
      leveledDown: this.user.level < this.initialLevel
    };
  }

  updateLevel() {
    this.user.level = calculateLevelFromXP(this.user.totalXP);
  }

  getLevelInfo() {
    return {
      currentLevel: this.user.level,
      totalXP: this.user.totalXP,
      currentLevelXP: getXPRequiredForLevel(this.user.level),
      nextLevelXP: getXPRequiredForNextLevel(this.user.level),
      progress: getLevelProgress(this.user.totalXP, this.user.level),
      xpToNext: getXPToNextLevel(this.user.totalXP, this.user.level)
    };
  }

  static calculateQuestXP(baseXP, difficulty, isCompleted, retryCount = 0) {
    let xp = baseXP;
    
    // Apply difficulty multiplier
    const difficultyMultipliers = {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5,
      expert: 2.0
    };
    
    xp *= difficultyMultipliers[difficulty] || 1.0;
    
    // Apply completion bonus
    if (isCompleted) {
      xp *= 1.1; // 10% completion bonus
    }
    
    // Apply retry penalty
    if (retryCount > 0) {
      xp *= Math.max(0.5, 1 - (retryCount * 0.25)); // 25% reduction per retry, min 50%
    }
    
    return Math.floor(xp);
  }

  static calculateFailurePenalty(questXP, difficulty) {
    // Remove XP based on difficulty
    const penaltyMultipliers = {
      easy: 0.5,
      medium: 0.75,
      hard: 1.0,
      expert: 1.25
    };
    
    return Math.floor(questXP * (penaltyMultipliers[difficulty] || 0.75));
  }
}

export function getLeaderboardStats(users) {
  return users
    .sort((a, b) => b.totalXP - a.totalXP)
    .map((user, index) => ({
      rank: index + 1,
      username: user.username,
      level: user.level,
      totalXP: user.totalXP,
      avatar: user.avatar
    }));
}

export function getLevelBadgeInfo(level) {
  const badges = {
    1: { name: "Novice", color: "#64748b", icon: "🌱" },
    5: { name: "Explorer", color: "#059669", icon: "🗺️" },
    10: { name: "Adventurer", color: "#0284c7", icon: "⚔️" },
    15: { name: "Hero", color: "#7c3aed", icon: "🦸" },
    20: { name: "Champion", color: "#dc2626", icon: "🏆" },
    25: { name: "Legend", color: "#ea580c", icon: "👑" },
    30: { name: "Master", color: "#facc15", icon: "⭐" },
    50: { name: "Grandmaster", color: "#a855f7", icon: "💎" },
    75: { name: "Mythic", color: "#ec4899", icon: "🔮" },
    100: { name: "Transcendent", color: "#8b5cf6", icon: "✨" }
  };
  
  // Find the highest badge the user has earned
  const availableLevels = Object.keys(badges).map(Number).sort((a, b) => b - a);
  const earnedLevel = availableLevels.find(badgeLevel => level >= badgeLevel) || 1;
  
  return badges[earnedLevel];
}

export function getAchievements(user, quests) {
  const achievements = [];
  
  // XP-based achievements
  if (user.totalXP >= 1000) achievements.push({ name: "XP Collector", description: "Earned 1,000 XP" });
  if (user.totalXP >= 5000) achievements.push({ name: "XP Master", description: "Earned 5,000 XP" });
  if (user.totalXP >= 10000) achievements.push({ name: "XP Legend", description: "Earned 10,000 XP" });
  
  // Level-based achievements
  if (user.level >= 10) achievements.push({ name: "Rising Star", description: "Reached level 10" });
  if (user.level >= 25) achievements.push({ name: "Veteran", description: "Reached level 25" });
  if (user.level >= 50) achievements.push({ name: "Elite", description: "Reached level 50" });
  
  // Quest-based achievements
  const completedQuests = quests.filter(q => q.status === 'completed');
  if (completedQuests.length >= 10) achievements.push({ name: "Quest Starter", description: "Completed 10 quests" });
  if (completedQuests.length >= 50) achievements.push({ name: "Quest Master", description: "Completed 50 quests" });
  if (completedQuests.length >= 100) achievements.push({ name: "Quest Legend", description: "Completed 100 quests" });
  
  // Streak-based achievements (would need to track streaks)
  // Side quest achievements
  const completedSideQuests = completedQuests.filter(q => q.type === 'side');
  if (completedSideQuests.length >= 5) achievements.push({ name: "Side Quest Explorer", description: "Completed 5 side quests" });
  
  return achievements;
}
