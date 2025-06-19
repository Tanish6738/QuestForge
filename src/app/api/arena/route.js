import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import ArenaPlayer from '../../../../models/ArenaPlayer';
import Battle from '../../../../models/Battle';
import User from '../../../../models/User';
import connectDB from '../../../../lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { skills, mode, difficulty } = await request.json();

    if (!skills || skills.length !== 4) {
      return NextResponse.json({ error: 'Must select exactly 4 skills' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or create arena player
    const arenaPlayer = await ArenaPlayer.findOneAndUpdate(
      { userId },
      {
        userId,
        username: user.username,
        selectedSkills: skills,
        isInQueue: mode === 'pvp',
        preferredMode: mode,
        skillsConfirmed: true,
        queueJoinTime: mode === 'pvp' ? new Date() : null,
        level: user.level,
        totalXP: user.totalXP
      },
      { upsert: true, new: true }
    );

    if (mode === 'pve') {
      // Create AI battle immediately
      const battleId = `battle_${Date.now()}_${userId}`;
      
      const battle = new Battle({
        battleId,
        players: [
          {
            userId,
            username: user.username,
            skills,
            health: 100,
            maxHealth: 100,
            isReady: true,
            isAI: false
          },
          {
            userId: 'ai',
            username: `AI (${difficulty})`,
            skills: getRandomAISkills(),
            health: getDifficultyHealth(difficulty),
            maxHealth: getDifficultyHealth(difficulty),
            isReady: true,
            isAI: true,
            difficulty
          }
        ],
        status: 'ready',
        battleType: 'pve',
        startTime: new Date()
      });

      await battle.save();
      
      // Update arena player with battle ID
      arenaPlayer.currentBattleId = battleId;
      arenaPlayer.isInQueue = false;
      await arenaPlayer.save();

      return NextResponse.json({ 
        success: true, 
        battleId,
        message: 'AI battle created' 
      });
    } else {
      // PvP matchmaking logic
      const opponent = await ArenaPlayer.findOne({
        userId: { $ne: userId },
        isInQueue: true,
        preferredMode: { $in: ['pvp', 'any'] },
        skillsConfirmed: true,
        currentBattleId: null
      }).sort({ queueJoinTime: 1 });

      if (opponent) {
        // Match found, create battle
        const battleId = `battle_${Date.now()}_${userId}_${opponent.userId}`;
        
        const battle = new Battle({
          battleId,
          players: [
            {
              userId,
              username: user.username,
              skills,
              health: 100,
              maxHealth: 100,
              isReady: false,
              isAI: false
            },
            {
              userId: opponent.userId,
              username: opponent.username,
              skills: opponent.selectedSkills,
              health: 100,
              maxHealth: 100,
              isReady: false,
              isAI: false
            }
          ],
          status: 'waiting',
          battleType: 'pvp',
          startTime: new Date()
        });

        await battle.save();

        // Update both players
        await ArenaPlayer.updateMany(
          { userId: { $in: [userId, opponent.userId] } },
          { 
            currentBattleId: battleId,
            isInQueue: false 
          }
        );

        return NextResponse.json({ 
          success: true, 
          battleId,
          opponent: opponent.username,
          message: 'Match found!' 
        });
      } else {
        // No match found, stay in queue
        return NextResponse.json({ 
          success: true, 
          message: 'Added to matchmaking queue',
          queuePosition: await getQueuePosition(userId)
        });
      }
    }

  } catch (error) {
    console.error('Arena join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const arenaPlayer = await ArenaPlayer.findOne({ userId });
    
    if (!arenaPlayer) {
      return NextResponse.json({ error: 'Player not in arena' }, { status: 404 });
    }

    const response = {
      isInQueue: arenaPlayer.isInQueue,
      currentBattleId: arenaPlayer.currentBattleId,
      queueTime: arenaPlayer.queueJoinTime ? 
        Math.floor((new Date() - arenaPlayer.queueJoinTime) / 1000) : 0
    };

    if (arenaPlayer.currentBattleId) {
      const battle = await Battle.findOne({ 
        battleId: arenaPlayer.currentBattleId 
      }).populate('players.userId', 'username level');
      
      response.battle = battle;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Arena status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getRandomAISkills() {
  const availableSkills = [
    "fireball", "lightning_bolt", "ice_shard", "shadow_strike",
    "shield_wall", "dodge_roll", "healing_potion", "regeneration"
  ];
  return availableSkills.sort(() => 0.5 - Math.random()).slice(0, 4);
}

function getDifficultyHealth(difficulty) {
  const healthMap = {
    easy: 80,
    normal: 100,
    hard: 120
  };
  return healthMap[difficulty] || 100;
}

async function getQueuePosition(userId) {
  const playersAhead = await ArenaPlayer.countDocuments({
    isInQueue: true,
    queueJoinTime: { 
      $lt: (await ArenaPlayer.findOne({ userId }))?.queueJoinTime 
    }
  });
  return playersAhead + 1;
}
