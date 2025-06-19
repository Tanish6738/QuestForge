import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Battle from '../../../../../models/Battle';
import User from '../../../../../models/User';
import ArenaPlayer from '../../../../../models/ArenaPlayer';
import connectDB from '../../../../../lib/mongodb';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { battleId } = params;
    
    const battle = await Battle.findOne({ battleId })
      .populate('players.userId', 'username level totalXP');

    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    // Check if user is part of this battle
    const isParticipant = battle.players.some(p => 
      p.userId.toString() === userId || p.userId === 'ai'
    );

    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized to view this battle' }, { status: 403 });
    }

    return NextResponse.json({ battle });

  } catch (error) {
    console.error('Battle fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { battleId } = params;
    const { action, skillId, target } = await request.json();

    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    const playerIndex = battle.players.findIndex(p => 
      p.userId.toString() === userId
    );

    if (playerIndex === -1) {
      return NextResponse.json({ error: 'Not a participant in this battle' }, { status: 403 });
    }

    const player = battle.players[playerIndex];
    const opponent = battle.players[1 - playerIndex];

    // Process the action based on type
    switch (action) {
      case 'use_skill':
        const result = await processSkillUse(battle, player, opponent, skillId);
        
        // Update battle state
        battle.rounds.push({
          playerAction: {
            playerId: player.userId,
            skillUsed: skillId,
            damage: result.damage || 0,
            healing: result.healing || 0,
            timestamp: new Date()
          }
        });

        // Check if battle is over
        if (opponent.health <= 0) {
          battle.status = 'finished';
          battle.winner = player.userId;
          battle.endTime = new Date();
          
          // Award XP
          const xpRewards = battle.calculateXPReward(player.userId, opponent.userId);
          await awardBattleXP(player.userId, xpRewards.winner);
          
          // Clean up arena players
          await ArenaPlayer.updateMany(
            { currentBattleId: battleId },
            { 
              currentBattleId: null,
              isInQueue: false 
            }
          );
        }

        await battle.save();
        
        return NextResponse.json({ 
          success: true, 
          battle,
          actionResult: result
        });

      case 'ready':
        player.isReady = true;
        
        // Check if all players are ready
        if (battle.players.every(p => p.isReady)) {
          battle.status = 'in_progress';
        }
        
        await battle.save();
        return NextResponse.json({ success: true, battle });

      case 'forfeit':
        battle.status = 'finished';
        battle.winner = opponent.userId;
        battle.endTime = new Date();
        
        // Award partial XP to both players
        const forfeitXP = battle.calculateXPReward(opponent.userId, player.userId);
        await awardBattleXP(opponent.userId, forfeitXP.winner);
        await awardBattleXP(player.userId, forfeitXP.loser);
        
        // Clean up arena players
        await ArenaPlayer.updateMany(
          { currentBattleId: battleId },
          { 
            currentBattleId: null,
            isInQueue: false 
          }
        );
        
        await battle.save();
        return NextResponse.json({ success: true, battle });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Battle action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processSkillUse(battle, player, opponent, skillId) {
  // Import skills data
  const { getSkillById, DIFFICULTY_LEVELS } = await import('../../../../../lib/skills');
  const skill = getSkillById(skillId);
  
  if (!skill) {
    throw new Error('Invalid skill');
  }

  // Check if skill is on cooldown
  const lastUsed = player.skillCooldowns?.get(skillId) || 0;
  const now = Date.now();
  if (now - lastUsed < skill.cooldown * 1000) {
    throw new Error('Skill on cooldown');
  }

  let damage = 0;
  let healing = 0;
  let effect = '';

  // Calculate skill effects based on type
  switch (skill.type) {
    case 'attack':
      damage = Math.floor(skill.power + Math.random() * 10);
      opponent.health = Math.max(0, opponent.health - damage);
      effect = `${skill.name} deals ${damage} damage!`;
      break;
      
    case 'heal':
      healing = Math.floor(skill.power + Math.random() * 5);
      player.health = Math.min(player.maxHealth, player.health + healing);
      effect = `${skill.name} heals for ${healing} HP!`;
      break;
      
    case 'defense':
      // For defense skills, reduce incoming damage on next turn
      effect = `${skill.name} provides protection!`;
      break;
      
    default:
      effect = `${skill.name} activated!`;
  }

  // Set cooldown
  if (!player.skillCooldowns) {
    player.skillCooldowns = new Map();
  }
  player.skillCooldowns.set(skillId, now);

  return { damage, healing, effect };
}

async function awardBattleXP(userId, xpAmount) {
  if (userId === 'ai') return;
  
  try {
    const user = await User.findById(userId);
    if (user) {
      user.totalXP += xpAmount;
      user.level = user.calculateLevel();
      await user.save();
    }
  } catch (error) {
    console.error('Error awarding XP:', error);
  }
}
