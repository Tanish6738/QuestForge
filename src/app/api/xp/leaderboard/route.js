import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { authenticateUser } from '../../../../../lib/auth.js';
import { getLeaderboardStats } from '../../../../../lib/xpManager.js';

// GET /api/xp/leaderboard - Get leaderboard of top users
async function getLeaderboard(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;
    
    // Get top users by XP
    const users = await User.find({}, 'username totalXP level avatar createdAt')
      .sort({ totalXP: -1 })
      .skip(skip)
      .limit(limit);
      const leaderboard = getLeaderboardStats(users);
    
    // Get current user's rank
    const currentUserId = request.user._id;
    const currentUser = await User.findById(currentUserId, 'username totalXP level');
    
    // Count users with higher XP to determine rank
    const higherXPCount = await User.countDocuments({ 
      totalXP: { $gt: currentUser.totalXP } 
    });
    
    const currentUserRank = higherXPCount + 1;
    
    return NextResponse.json({
      leaderboard,
      currentUser: {
        ...currentUser.toObject(),
        rank: currentUserRank
      },
      pagination: {
        currentPage: page,
        limit,
        hasMore: users.length === limit
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
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
  return getLeaderboard(request);
}
