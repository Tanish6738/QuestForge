import mongoose from 'mongoose';

const BattleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    required: true,
    unique: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    skills: [String], // Array of skill IDs
    health: {
      type: Number,
      default: 100
    },
    maxHealth: {
      type: Number,
      default: 100
    },
    isReady: {
      type: Boolean,
      default: false
    },
    isAI: {
      type: Boolean,
      default: false
    },
    difficulty: String, // for AI opponents
    skillCooldowns: {
      type: Map,
      of: Number,
      default: new Map()
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'ready', 'in_progress', 'finished'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  battleType: {
    type: String,
    enum: ['pvp', 'pve'],
    required: true
  },
  rounds: [{
    playerAction: {
      playerId: mongoose.Schema.Types.ObjectId,
      skillUsed: String,
      damage: Number,
      healing: Number,
      timestamp: Date
    },
    opponentAction: {
      playerId: mongoose.Schema.Types.ObjectId,
      skillUsed: String,
      damage: Number,
      healing: Number,
      timestamp: Date
    }
  }],
  startTime: Date,
  endTime: Date,
  xpReward: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate XP reward based on battle outcome and difficulty
BattleSchema.methods.calculateXPReward = function(winnerId, loserId) {
  let baseXP = 50;
  
  if (this.battleType === 'pve') {
    const aiPlayer = this.players.find(p => p.isAI);
    if (aiPlayer) {
      switch(aiPlayer.difficulty) {
        case 'easy': baseXP = 30; break;
        case 'normal': baseXP = 50; break;
        case 'hard': baseXP = 80; break;
      }
    }
  }
  
  // Winner gets full XP, loser gets 20% of base XP
  return {
    winner: baseXP,
    loser: Math.floor(baseXP * 0.2)
  };
};

export default mongoose.models.Battle || mongoose.model('Battle', BattleSchema);
