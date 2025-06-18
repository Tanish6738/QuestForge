import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import Quest from '../../../../models/Quest.js';
import { authenticateUser } from '../../../../lib/auth.js';
import { XPManager, getLeaderboardStats, getLevelBadgeInfo, getAchievements } from '../../../../lib/xpManager.js';

// GET /api/xp - Get user's XP and level information
async function getUserXP(request) {
  try {
    await connectDB();
    const userId = request.user._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const xpManager = new XPManager(user);
    const levelInfo = xpManager.getLevelInfo();
    const badge = getLevelBadgeInfo(user.level);
    
    // Get user's quests for achievements
    const quests = await Quest.find({ userId });
    const achievements = getAchievements(user, quests);
    
    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        level: user.level,
        totalXP: user.totalXP
      },
      levelInfo,
      badge,
      achievements,
      stats: {
        totalQuests: quests.length,
        completedQuests: quests.filter(q => q.status === 'completed').length,
        failedQuests: quests.filter(q => q.status === 'failed').length,
        activeQuests: quests.filter(q => q.status === 'active').length
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Get XP error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch XP information' },
      { status: 500 }
    );
  }
}

// POST /api/xp - Manually adjust XP (admin function, can be removed in production)
async function adjustXP(request) {
  try {
    await connectDB();
    const userId = request.user._id;
    
    const { amount, action } = await request.json();
    
    if (!amount || !action) {
      return NextResponse.json(
        { error: 'Amount and action are required' },
        { status: 400 }
      );
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const xpManager = new XPManager(user);
    let result;
    
    if (action === 'add') {
      result = xpManager.addXP(amount);
    } else if (action === 'remove') {
      result = xpManager.removeXP(amount);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      );
    }
    
    await user.save();
    
    return NextResponse.json({
      message: `XP ${action}ed successfully`,
      result,
      levelInfo: xpManager.getLevelInfo()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Adjust XP error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust XP' },
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
  return getUserXP(request);
}

export async function POST(request) {
  const authResult = await authenticateUser(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Add user to request for handler
  request.user = authResult.user;
  return adjustXP(request);
}
