// Quest generation utilities with Gemini AI integration
import { GoogleGenerativeAI } from '@google/generative-ai';
import Goal from '../models/Goal.js';
import Quest from '../models/Quest.js';
import QuestPlan from '../models/QuestPlan.js';

const API_KEY = 'AIzaSyBHVhK69JfkelhLAXp2bepUFwv3ohw4VoY'
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

const SIDE_QUEST_TEMPLATES = [
  { title: "Random Act of Kindness", description: "Do something nice for someone today", duration: 15, xp: 75 },
  { title: "Creative Break", description: "Spend 20 minutes on a creative activity", duration: 20, xp: 60 },
  { title: "Nature Walk", description: "Take a 15-minute walk outside", duration: 15, xp: 45 },
  { title: "Learn Something New", description: "Spend 10 minutes learning about a random topic", duration: 10, xp: 35 },
  { title: "Organize Space", description: "Tidy up your workspace or living area", duration: 25, xp: 50 },
  { title: "Call a Friend", description: "Have a meaningful conversation with someone", duration: 20, xp: 55 },
  { title: "Digital Detox", description: "Stay off social media for 2 hours", duration: 120, xp: 100 },
  { title: "Skill Challenge", description: "Try to learn a new micro-skill", duration: 30, xp: 80 }
];

async function generateQuestsWithAI(goal, questType = 'main', count = 3) {
  try {
    if (!process.env.GEMINI_API_KEY || API_KEY === 'AIzaSyBHVhK69JfkelhLAXp2bepUFwv3ohw4VoY') {
      console.warn('Gemini API key not found, using template quests');
      return generateTemplateQuests(goal, questType, count);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Generate ${count} ${questType} quests for achieving this goal:
Title: ${goal.title}
Description: ${goal.description}
Category: ${goal.category}
Deadline: ${goal.deadline}

Requirements:
- Each quest should be actionable and specific
- Duration should be between 10-120 minutes
- XP rewards should be between 20-150 based on difficulty
- Include variety in difficulty levels
- Make quests engaging and gamified
- Focus on breaking down the goal into manageable tasks

Return as JSON array with this format:
[
  {
    "title": "Quest Title",
    "description": "Detailed description of what to do",
    "duration": 45,
    "xpReward": 80,
    "difficulty": "medium"
  }
]

Only return the JSON array, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const generatedQuests = JSON.parse(cleanedText);
    
    return generatedQuests.map(quest => ({
      ...quest,
      type: questType,
      isOptional: questType === 'side'
    }));
    
  } catch (error) {
    console.error('Error generating quests with AI:', error);
    // Fallback to template quests
    return generateTemplateQuests(goal, questType, count);
  }
}

function generateTemplateQuests(goal, questType = 'main', count = 3) {
  const templates = questType === 'side' 
    ? SIDE_QUEST_TEMPLATES 
    : QUEST_TEMPLATES[goal.category] || QUEST_TEMPLATES.personal;
  
  const numQuests = Math.min(count, templates.length);
  
  // Randomly select templates
  const selectedTemplates = templates
    .sort(() => 0.5 - Math.random())
    .slice(0, numQuests);
    
  return selectedTemplates.map((template, index) => ({
    title: template.title,
    description: `${template.description} (Goal: ${goal.title})`,
    type: questType,
    xpReward: template.xp,
    duration: template.duration,
    difficulty: index === 0 ? 'easy' : index === 1 ? 'medium' : 'hard',
    isOptional: questType === 'side'
  }));
}

export async function generateMainQuests(goal) {
  try {
    return await generateQuestsWithAI(goal, 'main', 3);
  } catch (error) {
    console.error('Error generating main quests with AI:', error);
    // Fallback to template quests
    return generateTemplateQuests(goal, 'main', 3);
  }
}

export async function generateSubQuests(mainQuest, goal) {
  try {
    if (!process.env.GEMINI_API_KEY || API_KEY === 'AIzaSyBHVhK69JfkelhLAXp2bepUFwv3ohw4VoY') {
      return generateTemplateSubQuests(mainQuest, goal);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Break down this main quest into 2-4 smaller sub-quests:

Main Quest: ${mainQuest.title}
Description: ${mainQuest.description}
Duration: ${mainQuest.duration} minutes
XP Reward: ${mainQuest.xpReward}

Goal Context:
Title: ${goal.title}
Category: ${goal.category}

Requirements:
- Create 2-4 sub-quests that together complete the main quest
- Each sub-quest should be 10-30 minutes
- Total XP should roughly equal the main quest XP
- Make each step specific and actionable
- Maintain logical sequence

Return as JSON array:
[
  {
    "title": "Sub-quest Title",
    "description": "Specific action to take",
    "duration": 20,
    "xpReward": 35,
    "difficulty": "easy"
  }
]

Only return the JSON array, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const generatedSubQuests = JSON.parse(cleanedText);
    
    return generatedSubQuests.map(quest => ({
      ...quest,
      type: 'sub',
      parentQuestId: mainQuest._id,
      isOptional: false
    }));
    
  } catch (error) {
    console.error('Error generating sub-quests with AI:', error);
    return generateTemplateSubQuests(mainQuest, goal);
  }
}

function generateTemplateSubQuests(mainQuest, goal) {
  const subQuestCount = Math.floor(Math.random() * 3) + 2; // 2-4 sub-quests
  const baseXP = Math.floor(mainQuest.xpReward / subQuestCount);
  const baseDuration = Math.floor(mainQuest.duration / subQuestCount);
  
  const subQuests = [];
  
  for (let i = 0; i < subQuestCount; i++) {
    const stepNumber = i + 1;
    const xpVariation = Math.floor(Math.random() * 20) - 10; // ±10 XP variation
    const durationVariation = Math.floor(Math.random() * 10) - 5; // ±5 min variation
    
    subQuests.push({
      title: `${mainQuest.title} - Step ${stepNumber}`,
      description: `Complete step ${stepNumber} of "${mainQuest.title}"`,
      type: 'sub',
      parentQuestId: mainQuest._id,
      xpReward: Math.max(10, baseXP + xpVariation),
      duration: Math.max(5, baseDuration + durationVariation),
      difficulty: mainQuest.difficulty,
      isOptional: false
    });
  }
  
  return subQuests;
}

export async function generateSideQuests(userId, count = 2) {
  try {
    if (!process.env.GEMINI_API_KEY || API_KEY === 'AIzaSyBHVhK69JfkelhLAXp2bepUFwv3ohw4VoY') {
      return generateTemplateSideQuests(userId, count);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Generate ${count} engaging side quests for a productivity app user. These should be:

- Optional bonus activities
- Fun and motivating
- Quick wins (10-60 minutes)
- Variety of categories (wellness, creativity, learning, social, etc.)
- Generous XP rewards (50-120 XP)
- Not tied to specific goals

Return as JSON array:
[
  {
    "title": "Side Quest Title",
    "description": "Fun activity description",
    "duration": 25,
    "xpReward": 75,
    "difficulty": "medium"
  }
]

Only return the JSON array, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const generatedQuests = JSON.parse(cleanedText);
    
    return generatedQuests.map(quest => ({
      userId,
      goalId: null, // Side quests aren't tied to specific goals
      title: quest.title,
      description: quest.description,
      type: 'side',
      xpReward: quest.xpReward + Math.floor(Math.random() * 20), // Bonus XP variation
      duration: quest.duration,
      difficulty: quest.difficulty || 'medium',
      isOptional: true
    }));
    
  } catch (error) {
    console.error('Error generating side quests with AI:', error);
    return generateTemplateSideQuests(userId, count);
  }
}

function generateTemplateSideQuests(userId, count = 2) {
  const selectedTemplates = SIDE_QUEST_TEMPLATES
    .sort(() => 0.5 - Math.random())
    .slice(0, count);
    
  return selectedTemplates.map(template => ({
    userId,
    goalId: null, // Side quests aren't tied to specific goals
    title: template.title,
    description: template.description,
    type: 'side',
    xpReward: template.xp + Math.floor(Math.random() * 20), // Bonus XP variation
    duration: template.duration,
    difficulty: 'medium',
    isOptional: true
  }));
}

export function calculateQuestDifficulty(duration, xpReward) {
  const ratio = xpReward / duration;
  
  if (ratio < 1) return 'easy';
  if (ratio < 2) return 'medium';
  if (ratio < 3) return 'hard';
  return 'expert';
}

export function adjustXPForRetry(originalXP, retryCount) {
  // Reduce XP by 25% for each retry, minimum 10 XP
  const reduction = originalXP * 0.25 * retryCount;
  return Math.max(10, originalXP - reduction);
}

export function getXPMultiplier(difficulty) {
  const multipliers = {
    easy: 1.0,
    medium: 1.2,
    hard: 1.5,
    expert: 2.0
  };
  
  return multipliers[difficulty] || 1.0;
}

export function generateDailyQuests(userId, userLevel = 1) {
  // Generate 1-2 side quests per day based on user level
  const sideQuestCount = userLevel > 5 ? 2 : 1;
  return generateSideQuests(userId, sideQuestCount);
}

// NEW: Comprehensive daily quest plan generator based on goal and deadline
export async function generateComprehensiveQuestPlan(goalId, userId) {
  try {
    console.log('🚀 Starting comprehensive quest plan generation for goalId:', goalId, 'userId:', userId);
    
    const goal = await Goal.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    console.log('📋 Goal found:', goal.title);

    const today = new Date();
    const deadline = new Date(goal.deadline);
    const totalDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    console.log('📅 Quest plan duration:', totalDays, 'days');
    
    if (totalDays <= 0) {
      throw new Error('Goal deadline has already passed');
    }

    if (totalDays > 365) {
      throw new Error('Goal deadline too far in the future (max 365 days)');
    }

    const dailyTimeAvailable = goal.dailyTimeAvailable || 60; // default 1 hour
    
    console.log('⏰ Daily time available:', dailyTimeAvailable, 'minutes');
    
    // Generate AI-powered quest plan
    console.log('🤖 Generating AI quest plan...');
    const questPlan = await generateAIQuestPlan(goal, totalDays, dailyTimeAvailable);
    console.log('✅ AI quest plan generated');
    
    // Create the quest plan document
    const plan = new QuestPlan({
      userId,
      goalId,
      title: `Quest Plan: ${goal.title}`,
      description: `AI-generated daily quest plan to achieve "${goal.title}" by ${deadline.toDateString()}`,
      startDate: today,
      endDate: deadline,
      totalDays,
      dailyPlans: [],
      status: 'draft'
    });

    console.log('📝 Creating daily plans and quests...');
    
    // Generate daily plans and quests
    for (let day = 1; day <= Math.min(totalDays, 30); day++) { // Limit to 30 days initially to prevent timeouts
      console.log(`🗓️ Generating day ${day}/${Math.min(totalDays, 30)}`);
      
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + (day - 1));
      
      const dailyQuests = await generateDailyQuestsForPlan(goal, day, totalDays, dailyTimeAvailable);
      
      // Create quest documents
      const createdQuests = [];
      for (const questData of dailyQuests) {
        const quest = new Quest({
          userId,
          goalId,
          questPlanId: plan._id,
          title: questData.title,
          description: questData.description,
          type: questData.type || 'main',
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
        totalQuests: createdQuests.length
      };
      
      plan.dailyPlans.push(dailyPlan);
    }

    // Generate milestones
    plan.milestones = generateMilestones(Math.min(totalDays, 30));
    plan.statistics.totalQuestsGenerated = plan.dailyPlans.reduce((total, dp) => total + dp.totalQuests, 0);
    
    console.log('💾 Saving quest plan...');
    await plan.save();
    
    console.log('🎉 Quest plan generated successfully! Total quests:', plan.statistics.totalQuestsGenerated);
    return plan;
    
  } catch (error) {
    console.error('❌ Error generating comprehensive quest plan:', error);
    throw error;
  }
}

async function generateAIQuestPlan(goal, totalDays, dailyTimeAvailable) {
  try {
    console.log('🤖 Starting AI quest plan generation...');
    
    if (!process.env.GEMINI_API_KEY || API_KEY === 'AIzaSyBHVhK69JfkelhLAXp2bepUFwv3ohw4VoY') {
      console.log('⚠️ No valid Gemini API key, using template quest plan');
      return generateTemplateQuestPlan(goal, totalDays, dailyTimeAvailable);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Create a comprehensive ${totalDays}-day quest plan to achieve this goal:

Goal: ${goal.title}
Description: ${goal.description}
Category: ${goal.category}
Daily Time Available: ${dailyTimeAvailable} minutes
Priority: ${goal.priority}
Deadline: ${goal.deadline}

Requirements:
1. Break down the goal into logical daily progression
2. Each day should have 2-4 quests totaling around ${dailyTimeAvailable} minutes
3. Start with easier tasks and gradually increase complexity
4. Include variety: learning, practice, application, review
5. Make quests specific, actionable, and measurable
6. Consider the goal category and create relevant activities
7. Build momentum with early wins
8. Include checkpoint/review days
9. Plan for potential setbacks with buffer time
10. End with goal completion/presentation/evaluation

Return a JSON object with this structure:
{
  "strategy": "Brief explanation of the overall approach",
  "phases": [
    {
      "name": "Phase name (e.g., Foundation, Development, Mastery)",
      "startDay": 1,
      "endDay": 7,
      "focus": "What this phase focuses on",
      "keyOutcomes": ["Expected outcome 1", "Expected outcome 2"]
    }
  ],
  "dailyThemes": [
    {
      "day": 1,
      "theme": "Getting Started",
      "focus": "Foundation building",
      "questTypes": ["research", "planning", "initial_action"]
    }
  ]
}

Only return the JSON object, no additional text.`;

    console.log('📡 Sending request to Gemini API...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini API timeout after 30 seconds')), 30000)
    );
    
    const aiPromise = model.generateContent(prompt);
    
    const result = await Promise.race([aiPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Received response from Gemini API');
    
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsedResult = JSON.parse(cleanedText);
    
    console.log('✅ Successfully parsed AI quest plan');
    return parsedResult;
    
  } catch (error) {
    console.error('❌ Error generating AI quest plan:', error.message);
    console.log('🔄 Falling back to template quest plan');
    return generateTemplateQuestPlan(goal, totalDays, dailyTimeAvailable);
  }
}

async function generateDailyQuestsForPlan(goal, dayNumber, totalDays, dailyTimeAvailable) {
  try {
    console.log(`Generating daily quests for day ${dayNumber}`);
    
    if (!process.env.GEMINI_API_KEY || API_KEY === 'AIzaSyBHVhK69JfkelhLAXp2bepUFwv3ohw4VoY') {
      console.log('No valid Gemini API key, using template daily quests');
      return generateTemplateDailyQuests(goal, dayNumber, totalDays, dailyTimeAvailable);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const progressPercentage = ((dayNumber - 1) / (totalDays - 1)) * 100;
    const isEarlyStage = progressPercentage < 33;
    const isMidStage = progressPercentage >= 33 && progressPercentage < 66;
    const isLateStage = progressPercentage >= 66;
    
    let stageGuidance = "";
    if (isEarlyStage) {
      stageGuidance = "Focus on foundation building, learning basics, and easy wins to build momentum.";
    } else if (isMidStage) {
      stageGuidance = "Focus on skill development, practice, and intermediate challenges.";
    } else {
      stageGuidance = "Focus on advanced application, refinement, and goal completion preparation.";
    }
      const prompt = `Generate daily quests for Day ${dayNumber} of ${totalDays} to achieve this goal:

Goal: ${goal.title}
Description: ${goal.description}
Category: ${goal.category}
Available Time: ${dailyTimeAvailable} minutes
Progress: Day ${dayNumber}/${totalDays} (${Math.round(progressPercentage)}% through timeline)
Stage Guidance: ${stageGuidance}

CRITICAL REQUIREMENTS:
1. Generate 2-4 quests that total EXACTLY around ${dailyTimeAvailable} minutes (±5 minutes max)
2. Each quest duration must be realistic and match the task complexity
3. If a quest says "30-minute workout", the duration MUST be 30 minutes, not less
4. Make quest titles and descriptions match the allocated time
5. Consider the progression - what should happen on day ${dayNumber}?
6. Include different types of activities (research, practice, create, review)
7. Adjust difficulty based on progress stage
8. XP rewards should reflect actual time and effort (1.5-2 XP per minute)
9. Include one optional bonus quest (15-20 minutes)

TIME ALLOCATION EXAMPLE:
- Quest 1: 25 minutes → title should reflect 25-minute activity
- Quest 2: 20 minutes → title should reflect 20-minute activity  
- Quest 3: 15 minutes → title should reflect 15-minute activity
Total: 60 minutes (matches available time)

Return as JSON array:
[
  {
    "title": "Specific quest title matching the duration",
    "description": "Detailed description that matches the time allocated",
    "duration": 25,
    "xpReward": 50,
    "difficulty": "medium",
    "type": "main",
    "isOptional": false
  }
]

Only return the JSON array, no additional text.`;

    console.log(`Sending daily quest request to Gemini API for day ${dayNumber}...`);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Daily quest generation timeout for day ${dayNumber}`)), 20000)
    );
    
    const aiPromise = model.generateContent(prompt);
    
    const result = await Promise.race([aiPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();
    
    console.log(`Received daily quests for day ${dayNumber}`);
    
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsedQuests = JSON.parse(cleanedText);
    
    console.log(`Successfully parsed ${parsedQuests.length} quests for day ${dayNumber}`);
    return parsedQuests;
      } catch (error) {
    console.error(`Error generating daily quests for day ${dayNumber}:`, error.message);
    console.log(`Falling back to template daily quests for day ${dayNumber}`);
    return generateTemplateDailyQuests(goal, dayNumber, totalDays, dailyTimeAvailable);
  }
}

function generateTemplateDailyQuests(goal, dayNumber, totalDays, dailyTimeAvailable) {
  const questCount = Math.min(4, Math.max(2, Math.floor(dailyTimeAvailable / 20)));
  const totalTimeToAllocate = Math.floor(dailyTimeAvailable * 0.9); // Use 90% of available time for buffer
  const avgDuration = Math.floor(totalTimeToAllocate / questCount);
  
  const quests = [];
  const progressPercentage = ((dayNumber - 1) / (totalDays - 1)) * 100;
  
  // Base quest types based on category
  const categoryTemplates = QUEST_TEMPLATES[goal.category] || QUEST_TEMPLATES.personal;
  
  let remainingTime = totalTimeToAllocate;
  
  for (let i = 0; i < questCount; i++) {
    const template = categoryTemplates[i % categoryTemplates.length];
    
    // Calculate duration more intelligently
    let questDuration;
    if (i === questCount - 1) {
      // Last quest gets remaining time
      questDuration = Math.max(10, remainingTime);
    } else {
      // Vary duration but keep it reasonable
      const variation = Math.floor(Math.random() * 10) - 5; // ±5 min variation
      questDuration = Math.max(15, Math.min(avgDuration + variation, remainingTime - (questCount - i - 1) * 15));
    }
    
    remainingTime -= questDuration;
    
    let difficulty = 'easy';
    if (progressPercentage > 66) difficulty = 'hard';
    else if (progressPercentage > 33) difficulty = 'medium';
    
    // Adjust XP based on both duration and difficulty
    const baseXP = Math.floor(questDuration * 1.5); // 1.5 XP per minute base
    const difficultyMultiplier = { easy: 1, medium: 1.3, hard: 1.6 };
    const finalXP = Math.floor(baseXP * difficultyMultiplier[difficulty]);
    
    quests.push({
      title: `Day ${dayNumber}: ${template.title}`,
      description: `${template.description} (Goal: ${goal.title})`,
      duration: questDuration,
      xpReward: Math.max(20, Math.min(150, finalXP)),
      difficulty,
      type: 'main',
      isOptional: i === questCount - 1 // Last quest is optional
    });
  }
  
  return quests;
}

function generateTemplateQuestPlan(goal, totalDays, dailyTimeAvailable) {
  return {
    strategy: `Progressive approach to achieving ${goal.title} over ${totalDays} days`,
    phases: [
      {
        name: "Foundation",
        startDay: 1,
        endDay: Math.ceil(totalDays * 0.3),
        focus: "Learning basics and building momentum",
        keyOutcomes: ["Understanding fundamentals", "Initial progress"]
      },
      {
        name: "Development",
        startDay: Math.ceil(totalDays * 0.3) + 1,
        endDay: Math.ceil(totalDays * 0.7),
        focus: "Skill building and practice",
        keyOutcomes: ["Core competency", "Consistent progress"]
      },
      {
        name: "Mastery",
        startDay: Math.ceil(totalDays * 0.7) + 1,
        endDay: totalDays,
        focus: "Goal completion and refinement",
        keyOutcomes: ["Goal achievement", "Quality results"]
      }
    ]
  };
}

function generateMilestones(totalDays) {
  const milestones = [];
  
  // Quarter milestones
  const quarterDays = [
    Math.ceil(totalDays * 0.25),
    Math.ceil(totalDays * 0.5),
    Math.ceil(totalDays * 0.75),
    totalDays
  ];
  
  const milestoneNames = ["First Quarter", "Halfway Point", "Final Stretch", "Goal Achievement"];
  const milestoneRewards = [100, 200, 300, 500];
  
  quarterDays.forEach((day, index) => {
    if (day <= totalDays) {
      milestones.push({
        day,
        title: milestoneNames[index],
        description: `Milestone ${index + 1}: ${milestoneNames[index]} reached!`,
        xpReward: milestoneRewards[index]
      });
    }
  });
  
  return milestones;
}

// NEW: Get today's quests for a user
export async function getTodaysQuests(userId) {
  try {
    console.log('🔍 getTodaysQuests called for userId:', userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    console.log('📅 Searching for quests between:', today, 'and', todayEnd);
    
    // First, try to find quests scheduled for today
    let quests = await Quest.find({
      userId,
      scheduledDate: {
        $gte: today,
        $lte: todayEnd
      },
      status: { $in: ['available', 'active'] }
    }).populate('goalId').sort({ dayNumber: 1, type: 1 });
    
    console.log(`� Found ${quests.length} quests scheduled for today`);
    
    // If no quests found for today, try to find quests from active quest plans
    if (quests.length === 0) {
      console.log('🔍 No quests found for today, checking quest plans...');
      
      // Find active quest plans
      const questPlans = await QuestPlan.find({ 
        userId, 
        status: { $in: ['draft', 'active'] }
      }).populate('dailyPlans.quests');
      
      console.log(`📋 Found ${questPlans.length} active quest plans`);
      
      // For each quest plan, find today's quests
      for (const plan of questPlans) {
        const todaysPlan = plan.dailyPlans.find(dailyPlan => {
          const planDate = new Date(dailyPlan.date);
          planDate.setHours(0, 0, 0, 0);
          return planDate.getTime() === today.getTime();
        });
        
        if (todaysPlan && todaysPlan.quests) {
          console.log(`� Found today's plan with ${todaysPlan.quests.length} quests`);
          
          // Populate quest details
          const todaysQuests = await Quest.find({
            _id: { $in: todaysPlan.quests },
            status: { $in: ['available', 'active'] }
          }).populate('goalId');
          
          quests = quests.concat(todaysQuests);
        }
      }
      
      console.log(`📊 Total quests found from quest plans: ${quests.length}`);
    }
    
    // If still no quests, provide helpful debug info
    if (quests.length === 0) {
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
      } else if (totalQuestPlans > 0 && totalQuests === 0) {
        console.log('⚠️ User has quest plans but no quests generated!');
      }
    }
    
    return quests;
    
  } catch (error) {
    console.error('Error getting today\'s quests:', error);
    throw error;
  }
}

// NEW: Update quest plan based on progress
export async function updateQuestPlanProgress(questPlanId) {
  try {
    const plan = await QuestPlan.findById(questPlanId);
    if (!plan) {
      throw new Error('Quest plan not found');
    }
    
    plan.updateStatistics();
    await plan.save();
    
    return plan;
    
  } catch (error) {
    console.error('Error updating quest plan progress:', error);
    throw error;
  }
}
