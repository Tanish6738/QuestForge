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
    
    const { 
      title, 
      description, 
      category, 
      deadline, 
      priority = 'medium', 
      tags = [],
      dailyTimeAvailable = 60,
      preferredTimeSlots = [],
      questGenerationPreferences = {
        difficulty: 'mixed',
        sessionLength: 'flexible',
        breakdownStyle: 'moderate'
      }
    } = await request.json();
    
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
    
    // Validate daily time available
    if (dailyTimeAvailable < 15 || dailyTimeAvailable > 720) {
      return NextResponse.json(
        { error: 'Daily time available must be between 15 and 720 minutes' },
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
      tags,
      dailyTimeAvailable,
      preferredTimeSlots,
      questGenerationPreferences
    });
    
    await goal.save();    
    // Note: We no longer auto-generate quests here - they will be generated 
    // through the quest plan API when the user is ready
    
    return NextResponse.json({
      message: 'Goal created successfully. Use the quest plan API to generate daily quests.',
      goal: goal,
      nextSteps: {
        message: 'To generate your personalized quest plan, call:',
        endpoint: `POST /api/goals/${goal._id}/plan`,
        payload: { userId: userId }
      }
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
