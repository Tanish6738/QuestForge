import mongoose from 'mongoose';

const ArenaPlayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: String,
  selectedSkills: [{
    type: String,
    required: true
  }],
  isInQueue: {
    type: Boolean,
    default: false
  },
  preferredMode: {
    type: String,
    enum: ['pvp', 'pve', 'any'],
    default: 'any'
  },
  currentBattleId: {
    type: String,
    default: null
  },
  queueJoinTime: Date,
  skillsConfirmed: {
    type: Boolean,
    default: false
  },
  level: Number,
  totalXP: Number
}, {
  timestamps: true
});

// Add index for efficient matchmaking queries
ArenaPlayerSchema.index({ isInQueue: 1, preferredMode: 1, level: 1 });

export default mongoose.models.ArenaPlayer || mongoose.model('ArenaPlayer', ArenaPlayerSchema);
