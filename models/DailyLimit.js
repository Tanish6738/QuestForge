import mongoose from 'mongoose';

const DailyLimitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  questsStarted: {
    type: Number,
    default: 0
  },
  questsCompleted: {
    type: Number,
    default: 0
  },
  questsFailed: {
    type: Number,
    default: 0
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  xpLost: {
    type: Number,
    default: 0
  },
  maxQuestsPerDay: {
    type: Number,
    default: 10
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

// Compound index for user and date
DailyLimitSchema.index({ userId: 1, date: 1 }, { unique: true });

// Method to check if user can start more quests today
DailyLimitSchema.methods.canStartQuest = function() {
  return this.questsStarted < this.maxQuestsPerDay;
};

// Method to increment quest started count
DailyLimitSchema.methods.incrementQuestStarted = function() {
  if (this.canStartQuest()) {
    this.questsStarted += 1;
    return this;
  }
  throw new Error('Daily quest limit reached');
};

// Method to increment quest completed count
DailyLimitSchema.methods.incrementQuestCompleted = function(xp) {
  this.questsCompleted += 1;
  this.xpEarned += xp;
  return this;
};

// Method to increment quest failed count
DailyLimitSchema.methods.incrementQuestFailed = function(xpLost) {
  this.questsFailed += 1;
  this.xpLost += xpLost;
  return this;
};

// Static method to get or create daily limit for user
DailyLimitSchema.statics.getOrCreateForToday = async function(userId) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  let dailyLimit = await this.findOne({ userId, date: today });
  
  if (!dailyLimit) {
    dailyLimit = new this({
      userId,
      date: today
    });
    await dailyLimit.save();
  }
  
  return dailyLimit;
};

export default mongoose.models.DailyLimit || mongoose.model('DailyLimit', DailyLimitSchema);
