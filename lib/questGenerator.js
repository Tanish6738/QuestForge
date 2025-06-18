// Quest generation utilities with Gemini AI integration
import { GoogleGenerativeAI } from '@google/generative-ai';
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

async function generateQuestsWithAI(goal, questType = 'main', count = 3) {  try {
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

export async function generateSubQuests(mainQuest, goal) {  try {
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

export async function generateSideQuests(userId, count = 2) {  try {
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
