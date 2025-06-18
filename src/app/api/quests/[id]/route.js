import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import Quest from '../../../../../models/Quest.js';
import User from '../../../../../models/User.js';
import DailyLimit from '../../../../../models/DailyLimit.js';
import { createAuthenticatedHandler } from '../../../../../lib/auth.js';
import { XPManager } from '../../../../../lib/xpManager.js';

// GET /api/quests/[id] - Get specific quest
async function getQuest(request, { params }) {
  try {
    await connectDB();
    const userId = request.user._id;
    const questId = params.id;
    
    const quest = await Quest.findOne({ _id: questId, userId })
      .populate('goalId', 'title category')
      .populate('parentQuestId', 'title');
    
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }
    
    // If quest is a main quest, get its sub-quests
    let subQuests = [];
    if (quest.type === 'main') {
      subQuests = await Quest.find({ parentQuestId: quest._id, userId });
    }
    
    return NextResponse.json({ 
      quest,
      subQuests 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Get quest error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quest' },
      { status: 500 }
    );
  }
}

// PUT /api/quests/[id] - Update quest (start, complete, fail, accept, reject)
async function updateQuest(request, { params }) {
  try {
    await connectDB();
    const userId = request.user._id;
    const questId = params.id;
    
    const { action, ...updateData } = await request.json();
    
    const quest = await Quest.findOne({ _id: questId, userId });
    
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }
    
    const user = await User.findById(userId);
    const xpManager = new XPManager(user);
    let result = {};
    
    switch (action) {
      case 'start':
        // Check daily limits
        const dailyLimit = await DailyLimit.getOrCreateForToday(userId);
        
        if (!dailyLimit.canStartQuest()) {
          return NextResponse.json(
            { error: 'Daily quest limit reached' },
            { status: 429 }
          );
        }
        
        // Start the quest
        quest.start();
        await quest.save();
        
        // Update daily limits
        dailyLimit.incrementQuestStarted();
        await dailyLimit.save();
        
        result = { message: 'Quest started successfully', quest };
        break;
        
      case 'complete':
        if (quest.status !== 'active') {
          return NextResponse.json(
            { error: 'Only active quests can be completed' },
            { status: 400 }
          );
        }
        
        // Check if quest is not expired
        if (quest.isExpired) {
          return NextResponse.json(
            { error: 'Quest has expired and cannot be completed' },
            { status: 400 }
          );
        }
        
        // Calculate XP reward
        const xpReward = XPManager.calculateQuestXP(
          quest.xpReward,
          quest.difficulty,
          true,
          quest.retryCount
        );
        
        // Add XP to user
        const xpResult = xpManager.addXP(xpReward);
        
        // Complete the quest
        quest.complete();
        await quest.save();
        await user.save();
        
        // Update daily limits
        const dailyLimitComplete = await DailyLimit.getOrCreateForToday(userId);
        dailyLimitComplete.incrementQuestCompleted(xpReward);
        await dailyLimitComplete.save();
        
        result = { 
          message: 'Quest completed successfully',
          quest,
          xpGained: xpReward,
          levelInfo: xpResult
        };
        break;
        
      case 'fail':
        if (quest.status !== 'active') {
          return NextResponse.json(
            { error: 'Only active quests can be failed' },
            { status: 400 }
          );
        }
        
        // Calculate XP penalty
        const xpPenalty = XPManager.calculateFailurePenalty(quest.xpReward, quest.difficulty);
        
        // Remove XP from user
        const xpLossResult = xpManager.removeXP(xpPenalty);
        
        // Fail the quest
        quest.fail();
        await quest.save();
        await user.save();
        
        // Update daily limits
        const dailyLimitFail = await DailyLimit.getOrCreateForToday(userId);
        dailyLimitFail.incrementQuestFailed(xpPenalty);
        await dailyLimitFail.save();
        
        result = { 
          message: 'Quest failed',
          quest,
          xpLost: xpPenalty,
          levelInfo: xpLossResult
        };
        break;
        
      case 'accept':
        if (quest.type !== 'side' || quest.status !== 'available') {
          return NextResponse.json(
            { error: 'Only available side quests can be accepted' },
            { status: 400 }
          );
        }
        
        quest.accept();
        await quest.save();
        
        result = { message: 'Side quest accepted successfully', quest };
        break;
        
      case 'reject':
        if (quest.type !== 'side' || quest.status !== 'available') {
          return NextResponse.json(
            { error: 'Only available side quests can be rejected' },
            { status: 400 }
          );
        }
        
        quest.reject();
        await quest.save();
        
        result = { message: 'Side quest rejected', quest };
        break;
        
      case 'retry':
        if (quest.status !== 'failed' || quest.retryCount >= quest.maxRetries) {
          return NextResponse.json(
            { error: 'Quest cannot be retried' },
            { status: 400 }
          );
        }
        
        quest.retryCount += 1;
        quest.status = 'available';
        quest.failedAt = null;
        await quest.save();
        
        result = { message: 'Quest reset for retry', quest };
        break;
        
      default:
        // Regular update
        Object.assign(quest, updateData);
        quest.updatedAt = new Date();
        await quest.save();
        
        result = { message: 'Quest updated successfully', quest };
    }
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('Update quest error:', error);
    return NextResponse.json(
      { error: 'Failed to update quest' },
      { status: 500 }
    );
  }
}

// DELETE /api/quests/[id] - Delete quest
async function deleteQuest(request, { params }) {
  try {
    await connectDB();
    const userId = request.user._id;
    const questId = params.id;
    
    const quest = await Quest.findOne({ _id: questId, userId });
    
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }
    
    // If it's a main quest, also delete sub-quests
    if (quest.type === 'main') {
      await Quest.deleteMany({ parentQuestId: quest._id, userId });
    }
    
    await Quest.findByIdAndDelete(questId);
    
    return NextResponse.json({
      message: 'Quest deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Delete quest error:', error);
    return NextResponse.json(
      { error: 'Failed to delete quest' },
      { status: 500 }
    );
  }
}

export const GET = createAuthenticatedHandler(getQuest);
export const PUT = createAuthenticatedHandler(updateQuest);
export const DELETE = createAuthenticatedHandler(deleteQuest);
