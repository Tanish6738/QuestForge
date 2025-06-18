import mongoose from 'mongoose';

const DailyPlanSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  dayNumber: {
    type: Number, // Day 1, Day 2, etc. of the plan
    required: true
  },
  estimatedTimeNeeded: {
    type: Number, // minutes
    required: true
  },
  quests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest'
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'skipped'],
    default: 'pending'
  },
  completedQuests: {
    type: Number,
    default: 0
  },
  totalQuests: {
    type: Number,
    default: 0
  }
});

const QuestPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  dailyPlans: [DailyPlanSchema],
  milestones: [{
    day: Number,
    title: String,
    description: String,
    xpReward: Number,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  adaptiveSettings: {
    adjustDifficultyBasedOnProgress: {
      type: Boolean,
      default: true
    },
    allowSkippedDayMakeup: {
      type: Boolean,
      default: true
    },
    autoGenerateAlternatives: {
      type: Boolean,
      default: true
    }
  },
  statistics: {
    totalQuestsGenerated: {
      type: Number,
      default: 0
    },
    completedQuests: {
      type: Number,
      default: 0
    },
    skippedDays: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
    },
    totalXPEarned: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'paused', 'cancelled'],
    default: 'draft'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
QuestPlanSchema.index({ userId: 1, goalId: 1 });
QuestPlanSchema.index({ userId: 1, status: 1 });
QuestPlanSchema.index({ 'dailyPlans.date': 1 });

// Method to get current day's plan
QuestPlanSchema.methods.getCurrentDayPlan = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.dailyPlans.find(plan => {
    const planDate = new Date(plan.date);
    planDate.setHours(0, 0, 0, 0);
    return planDate.getTime() === today.getTime();
  });
};

// Method to get plan for specific date
QuestPlanSchema.methods.getPlanForDate = function(date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return this.dailyPlans.find(plan => {
    const planDate = new Date(plan.date);
    planDate.setHours(0, 0, 0, 0);
    return planDate.getTime() === targetDate.getTime();
  });
};

// Method to calculate overall progress
QuestPlanSchema.methods.calculateProgress = function() {
  const totalQuests = this.statistics.totalQuestsGenerated;
  const completedQuests = this.statistics.completedQuests;
  
  if (totalQuests === 0) return 0;
  return Math.round((completedQuests / totalQuests) * 100);
};

// Method to update statistics
QuestPlanSchema.methods.updateStatistics = function() {
  let totalQuests = 0;
  let completedQuests = 0;
  let totalXP = 0;
  let skippedDays = 0;

  this.dailyPlans.forEach(dailyPlan => {
    totalQuests += dailyPlan.totalQuests;
    completedQuests += dailyPlan.completedQuests;
    
    if (dailyPlan.status === 'skipped') {
      skippedDays++;
    }
  });

  this.statistics.totalQuestsGenerated = totalQuests;
  this.statistics.completedQuests = completedQuests;
  this.statistics.skippedDays = skippedDays;
  this.lastUpdated = new Date();
};

export default mongoose.models.QuestPlan || mongoose.model('QuestPlan', QuestPlanSchema);
