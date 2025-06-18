import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  totalXP: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  avatar: {
    type: String,
    default: ''
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

// Calculate level based on XP
UserSchema.methods.calculateLevel = function() {
  // Level formula: level = floor(sqrt(totalXP / 100)) + 1
  // Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, etc.
  const level = Math.floor(Math.sqrt(this.totalXP / 100)) + 1;
  this.level = level;
  return level;
};

// Get XP needed for next level
UserSchema.methods.getXPForNextLevel = function() {
  const currentLevel = this.level;
  const nextLevelXP = Math.pow(currentLevel, 2) * 100;
  return nextLevelXP;
};

// Get XP progress for current level
UserSchema.methods.getLevelProgress = function() {
  const currentLevel = this.level;
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
  const nextLevelXP = Math.pow(currentLevel, 2) * 100;
  const progress = ((this.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.max(0, Math.min(100, progress));
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
