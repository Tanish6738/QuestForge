import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getTodaysQuests } from '../../../../../lib/questGenerator.js';
import Quest from '../../../../../models/Quest.js';

// GET: Get today's quests for a user
export async function GET(request) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🎯 Today\'s quests API called for userId:', userId);
    
    const todaysQuests = await getTodaysQuests(userId);
    
    // Group quests by goal
    const questsByGoal = {};
    todaysQuests.forEach(quest => {
      const goalId = quest.goalId?._id?.toString() || 'no-goal';
      if (!questsByGoal[goalId]) {
        questsByGoal[goalId] = {
          goal: quest.goalId,
          quests: []
        };
      }
      questsByGoal[goalId].quests.push(quest);
    });

    const response = {
      success: true,
      date: new Date().toISOString().split('T')[0],
      totalQuests: todaysQuests.length,
      questsByGoal: Object.values(questsByGoal),
      allQuests: todaysQuests
    };
    
    console.log('📤 Returning response:', {
      totalQuests: response.totalQuests,
      questsByGoalCount: response.questsByGoal.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting today\'s quests:', error);
    return NextResponse.json({ 
      error: 'Failed to get today\'s quests',
      details: error.message 
    }, { status: 500 });
  }
}

// POST: Mark quest as started/completed or generate additional quests
export async function POST(request) {
  try {
    await connectDB();
    
    const { action, questId, userId, generateAdditional } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (action === 'startQuest' && questId) {
      const quest = await Quest.findById(questId);
      if (!quest) {
        return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
      }
      
      if (quest.userId.toString() !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      quest.start();
      await quest.save();
      
      return NextResponse.json({
        success: true,
        message: 'Quest started',
        quest: quest
      });
    }

    if (action === 'completeQuest' && questId) {
      const quest = await Quest.findById(questId);
      if (!quest) {
        return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
      }
      
      if (quest.userId.toString() !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      quest.complete();
      await quest.save();
      
      return NextResponse.json({
        success: true,
        message: 'Quest completed',
        quest: quest,
        xpEarned: quest.xpReward
      });
    }

    if (generateAdditional) {
      // TODO: Generate additional side quests for today
      return NextResponse.json({ 
        error: 'Additional quest generation not yet implemented' 
      }, { status: 501 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error processing quest action:', error);
    return NextResponse.json({ 
      error: 'Failed to process quest action',
      details: error.message 
    }, { status: 500 });
  }
}
