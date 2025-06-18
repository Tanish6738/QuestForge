import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import DailyLimit from '../../../../models/DailyLimit.js';
import { authenticateUser } from '../../../../lib/auth.js';

// GET /api/limit - Get current user's daily limits and usage
async function getDailyLimit(request) {
  try {
    await connectDB();
    const userId = request.user._id;
    
    const dailyLimit = await DailyLimit.getOrCreateForToday(userId);
    
    return NextResponse.json({
      dailyLimit: {
        date: dailyLimit.date,
        questsStarted: dailyLimit.questsStarted,
        questsCompleted: dailyLimit.questsCompleted,
        questsFailed: dailyLimit.questsFailed,
        xpEarned: dailyLimit.xpEarned,
        xpLost: dailyLimit.xpLost,
        maxQuestsPerDay: dailyLimit.maxQuestsPerDay,
        canStartMore: dailyLimit.canStartQuest(),
        remainingQuests: Math.max(0, dailyLimit.maxQuestsPerDay - dailyLimit.questsStarted)
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Get daily limit error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily limits' },
      { status: 500 }
    );
  }
}

// PUT /api/limit - Update daily quest limit (user preference)
async function updateDailyLimit(request) {
  try {
    await connectDB();
    const userId = request.user._id;
    
    const { maxQuestsPerDay } = await request.json();
    
    if (!maxQuestsPerDay || maxQuestsPerDay < 1 || maxQuestsPerDay > 50) {
      return NextResponse.json(
        { error: 'Max quests per day must be between 1 and 50' },
        { status: 400 }
      );
    }
    
    const dailyLimit = await DailyLimit.getOrCreateForToday(userId);
    dailyLimit.maxQuestsPerDay = maxQuestsPerDay;
    await dailyLimit.save();
    
    return NextResponse.json({
      message: 'Daily quest limit updated successfully',
      dailyLimit: {
        date: dailyLimit.date,
        questsStarted: dailyLimit.questsStarted,
        maxQuestsPerDay: dailyLimit.maxQuestsPerDay,
        canStartMore: dailyLimit.canStartQuest(),
        remainingQuests: Math.max(0, dailyLimit.maxQuestsPerDay - dailyLimit.questsStarted)
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Update daily limit error:', error);
    return NextResponse.json(
      { error: 'Failed to update daily limit' },
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
  return getDailyLimit(request);
}

export async function PUT(request) {
  const authResult = await authenticateUser(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Add user to request for handler
  request.user = authResult.user;
  return updateDailyLimit(request);
}
