// Quest generation utilities with proper error handling and debugging
import { GoogleGenerativeAI } from '@google/generative-ai';
import Goal from '../models/Goal.js';
import Quest from '../models/Quest.js';
import QuestPlan from '../models/QuestPlan.js';

const API_KEY = ''
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || API_KEY);

const QUEST_TEMPLATES = {
  health: [
    { title: "Morning Workout", description: "Complete a 30-minute workout session", duration: 30, xp: 50 },
    { title: "Hydration Check", description: "Drink 8 glasses of water today", duration: 15, xp: 25 },
    { title: "Healthy Meal Prep", description: "Prepare a nutritious meal", duration: 45, xp: 75 },
    { title: "Meditation Session", description: "Practice mindfulness for 15 minutes", duration: 15, xp: 40 },
    { title: "Sleep Schedule", description: "Go to bed before 11 PM", duration: 10, xp: 30 }
  ],
  career: [
    { title: "Skill Practice", description: "Practice a professional skill for 1 hour", duration: 60, xp: 100 },
    { title: "Network Building", description: "Reach out to a professional contact", duration: 20, xp: 60 },
    { title: "Resume Update", description: "Update your resume with recent achievements", duration: 30, xp: 50 },
    { title: "Industry Reading", description: "Read an industry-related article", duration: 25, xp: 40 },
    { title: "Project Planning", description: "Plan next steps for a current project", duration: 45, xp: 70 }
  ],
  education: [
    { title: "Course Study", description: "Study course material for 1 hour", duration: 60, xp: 80 },
    { title: "Practice Problems", description: "Complete 10 practice problems", duration: 45, xp: 65 },
    { title: "Research Session", description: "Research a topic for 30 minutes", duration: 30, xp: 50 },
    { title: "Note Review", description: "Review and organize study notes", duration: 25, xp: 40 },
    { title: "Quiz Practice", description: "Take a practice quiz", duration: 20, xp: 45 }
  ],
  personal: [
    { title: "Self Reflection", description: "Journal about your day and goals", duration: 20, xp: 35 },
    { title: "Habit Tracking", description: "Update your habit tracker", duration: 10, xp: 20 },
    { title: "Goal Review", description: "Review progress on personal goals", duration: 30, xp: 50 },
    { title: "Mindfulness Practice", description: "Practice being present for 15 minutes", duration: 15, xp: 30 },
    { title: "Gratitude List", description: "Write down 5 things you're grateful for", duration: 10, xp: 25 }
  ],
  finance: [
    { title: "Budget Review", description: "Review and update your monthly budget", duration: 30, xp: 60 },
    { title: "Expense Tracking", description: "Log all expenses for the day", duration: 15, xp: 25 },
    { title: "Investment Research", description: "Research potential investment opportunities", duration: 45, xp: 70 },
    { title: "Bill Organization", description: "Organize and schedule bill payments", duration: 20, xp: 40 },
    { title: "Savings Goal", description: "Transfer money to savings account", duration: 10, xp: 50 }
  ]
};

// Main function for generating comprehensive quest plan
export async function generateComprehensiveQuestPlan(goalId, userId) {
  console.log('🚀 Starting comprehensive quest plan generation for goalId:', goalId, 'userId:', userId);
  
  try {
    // Get the goal
    const goal = await Goal.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    console.log('📋 Goal found:', goal.title);

    // Calculate timeline
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const totalDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    console.log('📅 Quest plan duration:', totalDays, 'days');
    
    if (totalDays <= 0) {
      throw new Error('Goal deadline has already passed');
    }

    if (totalDays > 90) {
      throw new Error('Goal deadline too far in the future (max 90 days for initial version)');
    }

    const dailyTimeAvailable = goal.dailyTimeAvailable || 60;
    console.log('⏰ Daily time available:', dailyTimeAvailable, 'minutes');
    
    // Create quest plan document first
    const plan = new QuestPlan({
      userId,
      goalId,
      title: `Quest Plan: ${goal.title}`,
      description: `Daily quest plan to achieve "${goal.title}" by ${deadline.toDateString()}`,
      startDate: today,
      endDate: deadline,
      totalDays,
      dailyPlans: [],
      status: 'draft',
      statistics: {
        totalQuestsGenerated: 0,
        completedQuests: 0,
        totalXpAvailable: 0
      },
      milestones: []
    });

    console.log('📝 Creating daily plans and quests...');
    
    // Limit initial generation to prevent timeouts
    const maxDaysToGenerate = Math.min(totalDays, 14); // Start with 2 weeks
    
    for (let day = 1; day <= maxDaysToGenerate; day++) {
      console.log(`🗓️ Generating day ${day}/${maxDaysToGenerate}`);
      
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + (day - 1));
      
      // Generate template-based quests to avoid AI timeouts
      const dailyQuests = generateTemplateDailyQuests(goal, day, totalDays, dailyTimeAvailable);
      
      // Create quest documents
      const createdQuests = [];
      for (const questData of dailyQuests) {
        // Map any invalid type (like 'bonus') to 'side'
        let questType = questData.type;
        if (questType === 'bonus') questType = 'side';
        if (!['main', 'sub', 'side'].includes(questType)) questType = 'main';
        const quest = new Quest({
          userId,
          goalId,
          questPlanId: plan._id,
          title: questData.title,
          description: questData.description,
          type: questType || 'main',
          xpReward: questData.xpReward,
          duration: questData.duration,
          difficulty: questData.difficulty,
          scheduledDate: currentDate,
          dayNumber: day,
          isOptional: questData.isOptional || false
        });
        
        await quest.save();
        createdQuests.push(quest._id);
      }
      
      // Create daily plan
      const dailyPlan = {
        date: currentDate,
        dayNumber: day,
        estimatedTimeNeeded: dailyQuests.reduce((total, q) => total + q.duration, 0),
        quests: createdQuests,
        totalQuests: createdQuests.length,
        status: 'pending'
      };
      
      plan.dailyPlans.push(dailyPlan);
    }

    // Update statistics
    plan.statistics.totalQuestsGenerated = plan.dailyPlans.reduce((total, dp) => total + dp.totalQuests, 0);
    plan.statistics.totalXpAvailable = plan.dailyPlans.reduce((total, dp) => {
      return total + dp.quests.length * 50; // Approximate XP
    }, 0);

    // Generate simple milestones
    plan.milestones = [
      {
        day: Math.ceil(maxDaysToGenerate * 0.25),
        title: "First Week Complete",
        description: "You've completed your first week of quests!",
        xpReward: 100
      },
      {
        day: Math.ceil(maxDaysToGenerate * 0.5),
        title: "Halfway Point",
        description: "You're halfway to your goal!",
        xpReward: 200
      },
      {
        day: maxDaysToGenerate,
        title: "Quest Plan Complete",
        description: "You've completed all your planned quests!",
        xpReward: 500
      }
    ];
    
    console.log('💾 Saving quest plan...');
    await plan.save();
    
    console.log('🎉 Quest plan generated successfully! Total quests:', plan.statistics.totalQuestsGenerated);
    return plan;
    
  } catch (error) {
    console.error('❌ Error generating comprehensive quest plan:', error);
    throw error;
  }
}

// Template-based daily quest generation (fallback)
function generateTemplateDailyQuests(goal, dayNumber, totalDays, dailyTimeAvailable) {
  console.log(`Generating template quests for day ${dayNumber}`);
  
  const questCount = Math.min(4, Math.max(2, Math.floor(dailyTimeAvailable / 20)));
  const avgDuration = Math.floor(dailyTimeAvailable / questCount);
  
  const quests = [];
  const progressPercentage = ((dayNumber - 1) / (totalDays - 1)) * 100;
  
  // Base quest types based on category
  const categoryTemplates = QUEST_TEMPLATES[goal.category] || QUEST_TEMPLATES.personal;
  
  for (let i = 0; i < questCount; i++) {
    const template = categoryTemplates[i % categoryTemplates.length];
    const duration = Math.max(10, Math.floor(avgDuration + (Math.random() * 10 - 5))); // ±5 min variation
    
    let difficulty = 'easy';
    if (progressPercentage > 66) difficulty = 'hard';
    else if (progressPercentage > 33) difficulty = 'medium';
    
    quests.push({
      title: `Day ${dayNumber}: ${template.title}`,
      description: `${template.description} (Focus: ${goal.title})`,
      duration: duration,
      xpReward: Math.floor(template.xp * (1 + progressPercentage / 100)),
      difficulty,
      // Ensure only valid quest types are used
      type: i === 0 ? 'main' : (i === questCount - 1 ? 'side' : 'sub'),
      isOptional: i === questCount - 1 // Last quest is optional
    });
  }
  
  console.log(`Generated ${quests.length} template quests for day ${dayNumber}`);
  return quests;
}

// Get today's quests with enhanced debugging
export async function getTodaysQuests(userId) {
  try {
    console.log('🔍 getTodaysQuests called for userId:', userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    console.log('📅 Searching for quests between:', today, 'and', todayEnd);
    
    const query = {
      userId,
      scheduledDate: {
        $gte: today,
        $lte: todayEnd
      },
      status: { $in: ['available', 'active'] }
    };
    
    console.log('🔍 Query:', JSON.stringify(query, null, 2));
    
    const quests = await Quest.find(query).populate('goalId').sort({ dayNumber: 1, type: 1 });
    
    console.log(`📊 Found ${quests.length} quests for today`);
    
    if (quests.length === 0) {
      // Check if user has any goals
      const totalGoals = await Goal.countDocuments({ userId });
      const totalQuests = await Quest.countDocuments({ userId });
      const totalQuestPlans = await QuestPlan.countDocuments({ userId });
      
      console.log('📈 User stats:', {
        totalGoals,
        totalQuests,
        totalQuestPlans
      });
      
      if (totalGoals > 0 && totalQuestPlans === 0) {
        console.log('⚠️ User has goals but no quest plans generated!');
      }
    }
    
    return quests;
    
  } catch (error) {
    console.error('Error getting today\'s quests:', error);
    throw error;
  }
}

// Additional helper functions for backward compatibility
export async function generateMainQuests(goal) {
  return generateTemplateDailyQuests(goal, 1, 30, goal.dailyTimeAvailable || 60);
}

export async function generateDailyQuests(userId, userLevel) {
  console.log('generateDailyQuests called - this is deprecated, use quest plans instead');
  return [];
}
