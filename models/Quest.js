import mongoose from 'mongoose';

const QuestSchema = new mongoose.Schema({
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
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['main', 'sub', 'side'],
    default: 'main'
  },
  parentQuestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest',
    default: null
  },
  xpReward: {
    type: Number,
    required: true,
    min: 10,
    max: 1000
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 5,
    max: 480 // 8 hours max
  },
  status: {
    type: String,
    enum: ['available', 'active', 'completed', 'failed', 'rejected'],
    default: 'available'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },  deadline: {
    type: Date
  },
  scheduledDate: {
    type: Date // The specific date this quest is scheduled for
  },
  scheduledTime: {
    start: String, // e.g., "09:00"
    end: String    // e.g., "10:30"
  },
  questPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestPlan'
  },
  dayNumber: {
    type: Number // Which day of the plan this belongs to
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest'
  }],
  failedAt: {
    type: Date
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
QuestSchema.index({ userId: 1, status: 1 });
QuestSchema.index({ userId: 1, goalId: 1 });
QuestSchema.index({ userId: 1, type: 1 });
QuestSchema.index({ userId: 1, deadline: 1 });
QuestSchema.index({ goalId: 1, parentQuestId: 1 });

// Virtual for time remaining
QuestSchema.virtual('timeRemaining').get(function() {
  if (!this.deadline || this.status !== 'active') return null;
  const now = new Date();
  const remaining = this.deadline - now;
  return Math.max(0, remaining);
});

// Virtual for is expired
QuestSchema.virtual('isExpired').get(function() {
  if (!this.deadline || this.status !== 'active') return false;
  return new Date() > this.deadline;
});

// Method to start quest
QuestSchema.methods.start = function() {
  this.status = 'active';
  this.startedAt = new Date();
  this.deadline = new Date(this.startedAt.getTime() + (this.duration * 60 * 1000));
  return this;
};

// Method to complete quest
QuestSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this;
};

// Method to fail quest
QuestSchema.methods.fail = function() {
  this.status = 'failed';
  this.failedAt = new Date();
  return this;
};

// Method to accept side quest
QuestSchema.methods.accept = function() {
  if (this.type === 'side' && this.status === 'available') {
    this.acceptedAt = new Date();
    return this;
  }
  throw new Error('Only available side quests can be accepted');
};

// Method to reject side quest
QuestSchema.methods.reject = function() {
  if (this.type === 'side' && this.status === 'available') {
    this.status = 'rejected';
    this.rejectedAt = new Date();
    return this;
  }
  throw new Error('Only available side quests can be rejected');
};

export default mongoose.models.Quest || mongoose.model('Quest', QuestSchema);
