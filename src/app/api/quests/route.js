import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import Quest from '../../../../models/Quest.js';
import User from '../../../../models/User.js';
import DailyLimit from '../../../../models/DailyLimit.js';
import { createAuthenticatedHandler } from '../../../../lib/auth.js';
import { XPManager } from '../../../../lib/xpManager.js';
import { generateDailyQuests } from '../../../../lib/questGenerator.js';

// GET /api/quests - Get all quests for user with filtering
async function getQuests(request) {
  try {
    await connectDB();
    const userId = request.user._id;
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const goalId = searchParams.get('goalId');
    
    let filter = { userId };
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (goalId) filter.goalId = goalId;
    
    const quests = await Quest.find(filter)
      .populate('goalId', 'title category')
      .sort({ createdAt: -1 });
    
    // Check for expired active quests and update them
    const now = new Date();
    const expiredQuests = quests.filter(q => 
      q.status === 'active' && q.deadline && q.deadline < now
    );
    
    // Update expired quests and handle XP penalty
    for (const quest of expiredQuests) {
      const user = await User.findById(userId);
      const xpManager = new XPManager(user);
      
      // Calculate XP penalty for failed quest
      const xpPenalty = XPManager.calculateFailurePenalty(quest.xpReward, quest.difficulty);
      xpManager.removeXP(xpPenalty);
      
      // Update quest status
      quest.fail();
      await quest.save();
      await user.save();
      
      // Update daily limits
      const dailyLimit = await DailyLimit.getOrCreateForToday(userId);
      dailyLimit.incrementQuestFailed(xpPenalty);
      await dailyLimit.save();
    }
    
    // Refresh quest data after updates
    const updatedQuests = await Quest.find(filter)
      .populate('goalId', 'title category')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ quests: updatedQuests }, { status: 200 });
    
  } catch (error) {
    console.error('Get quests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}

// POST /api/quests - Create custom quest or generate daily quests
async function createQuest(request) {
  try {
    await connectDB();
    const userId = request.user._id;
    
    const body = await request.json();
    
    // If generating daily quests
    if (body.action === 'generateDaily') {
      const user = await User.findById(userId);
      const dailyQuests = generateDailyQuests(userId, user.level);
      
      const createdQuests = [];
      for (const questData of dailyQuests) {
        const quest = new Quest(questData);
        await quest.save();
        createdQuests.push(quest);
      }
      
      return NextResponse.json({
        message: 'Daily quests generated successfully',
        quests: createdQuests
      }, { status: 201 });
    }
    
    // Create custom quest
    const { title, description, type = 'main', goalId, xpReward, duration, difficulty = 'medium' } = body;
    
    if (!title || !description || !xpReward || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, xpReward, duration' },
        { status: 400 }
      );
    }
    
    const quest = new Quest({
      userId,
      goalId: goalId || null,
      title,
      description,
      type,
      xpReward,
      duration,
      difficulty
    });
    
    await quest.save();
    
    const populatedQuest = await Quest.findById(quest._id).populate('goalId', 'title category');
    
    return NextResponse.json({
      message: 'Quest created successfully',
      quest: populatedQuest
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create quest error:', error);
    return NextResponse.json(
      { error: 'Failed to create quest' },
      { status: 500 }
    );
  }
}

export const GET = createAuthenticatedHandler(getQuests);
export const POST = createAuthenticatedHandler(createQuest);
