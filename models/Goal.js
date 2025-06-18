import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['health', 'career', 'education', 'personal', 'finance', 'relationships', 'hobbies', 'other']
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dailyTimeAvailable: {
    type: Number, // minutes per day user can dedicate to this goal
    required: true,
    min: 15,
    max: 720 // max 12 hours per day
  },
  preferredTimeSlots: [{
    start: String, // e.g., "09:00"
    end: String,   // e.g., "10:30"
    days: [String] // e.g., ["monday", "wednesday", "friday"]
  }],
  questGenerationPreferences: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed'
    },
    sessionLength: {
      type: String,
      enum: ['short', 'medium', 'long', 'flexible'], // short: 15-30min, medium: 30-60min, long: 60-120min
      default: 'flexible'
    },
    breakdownStyle: {
      type: String,
      enum: ['detailed', 'moderate', 'minimal'],
      default: 'moderate'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  completedAt: {
    type: Date
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
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, deadline: 1 });
GoalSchema.index({ userId: 1, category: 1 });

export default mongoose.models.Goal || mongoose.model('Goal', GoalSchema);
