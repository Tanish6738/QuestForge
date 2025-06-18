import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import Goal from '../../../../models/Goal.js';
import Quest from '../../../../models/Quest.js';
import { authenticateUser } from '../../../../lib/auth.js';
import { generateMainQuests, generateSubQuests } from '../../../../lib/questGenerator.js';

// GET /api/goals - Get all goals for authenticated user
async function getGoals(request) {
  try {
    await connectDB();
    const userId = request.user._id;
    
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ goals }, { status: 200 });
  } catch (error) {
    console.error('Get goals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create new goal and generate quests
async function createGoal(request) {
  try {
    await connectDB();
    const userId = request.user._id;
    
    const { title, description, category, deadline, priority = 'medium', tags = [] } = await request.json();
    
    // Validation
    if (!title || !description || !category || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, deadline' },
        { status: 400 }
      );
    }
    
    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return NextResponse.json(
        { error: 'Deadline must be in the future' },
        { status: 400 }
      );
    }
    
    // Create goal
    const goal = new Goal({
      userId,
      title,
      description,
      category,
      deadline: deadlineDate,
      priority,
      tags
    });
      await goal.save();
    
    // Generate main quests for this goal
    const mainQuestTemplates = await generateMainQuests(goal);
    const mainQuests = [];
    
    for (const questTemplate of mainQuestTemplates) {
      const quest = new Quest({
        userId,
        goalId: goal._id,
        ...questTemplate
      });
        await quest.save();
      mainQuests.push(quest);
      
      // Generate sub-quests for each main quest
      const subQuestTemplates = await generateSubQuests(quest, goal);
      const subQuests = [];
      
      for (const subQuestTemplate of subQuestTemplates) {
        const subQuest = new Quest({
          userId,
          goalId: goal._id,
          ...subQuestTemplate,
          parentQuestId: quest._id
        });
        
        await subQuest.save();
        subQuests.push(subQuest);
      }
    }
    
    // Fetch the complete goal with quests
    const completeGoal = await Goal.findById(goal._id);
    const goalQuests = await Quest.find({ goalId: goal._id });
    
    return NextResponse.json({
      message: 'Goal created successfully',
      goal: completeGoal,
      quests: goalQuests
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const authResult = await authenticateUser(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Add user to request for handler
  request.user = authResult.user;
  return getGoals(request);
}

export async function POST(request) {
  const authResult = await authenticateUser(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Add user to request for handler
  request.user = authResult.user;
  return createGoal(request);
}
