import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = app.listen(process.env.PORT || 8080, () => {
  console.log(`Battle Service running on port ${process.env.PORT || 8080}`);
});

const wss = new WebSocketServer({ server });

// Store active connections
const connections = new Map();
const battles = new Map();

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
wss.on('connection', (ws, request) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleMessage(ws, data);
    } catch (error) {      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { message: 'Invalid message format' }
      }));
    }
  });

  ws.on('close', () => {
    // Clean up connection
    for (const [userId, connection] of connections.entries()) {
      if (connection.ws === ws) {
        connections.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

async function handleMessage(ws, data) {
  const { type, payload, token } = data;

  // Verify JWT token for authenticated requests
  if (type !== 'ping' && token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      payload.userId = decoded.userId;
    } catch (error) {      ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { message: 'Invalid token' }
      }));
      return;
    }
  }

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    case 'join_arena':
      handleJoinArena(ws, payload);
      break;

    case 'battle_action':
      handleBattleAction(ws, payload);
      break;

    case 'leave_arena':
      handleLeaveArena(ws, payload);
      break;    case 'get_battle_state':
      handleGetBattleState(ws, payload);
      break;

    case 'chat_message':
      handleChatMessage(ws, payload);
      break;

    default:ws.send(JSON.stringify({ 
        type: 'error', 
        payload: { message: 'Unknown message type' }
      }));
  }
}

function handleJoinArena(ws, payload) {
  const { userId, username, skills, mode, difficulty } = payload;

  // Store user connection
  connections.set(userId, { ws, username, skills });

  if (mode === 'pve') {
    // Create AI battle
    const battleId = `ai_battle_${Date.now()}_${userId}`;
    const battle = createAIBattle(battleId, userId, username, skills, difficulty);
    battles.set(battleId, battle);

    // Notify user that battle is ready
    ws.send(JSON.stringify({
      type: 'battle_ready',
      payload: { battleId, battle }
    }));

  } else if (mode === 'pvp') {
    // Look for available opponent
    const availableOpponent = findAvailableOpponent(userId);
    
    if (availableOpponent) {
      // Create PvP battle
      const battleId = `pvp_battle_${Date.now()}_${userId}_${availableOpponent.userId}`;
      const battle = createPvPBattle(battleId, 
        { userId, username, skills },
        availableOpponent
      );
      battles.set(battleId, battle);

      // Notify both players
      ws.send(JSON.stringify({
        type: 'battle_ready',
        payload: { battleId, battle }
      }));

      const opponentConnection = connections.get(availableOpponent.userId);
      if (opponentConnection) {
        opponentConnection.ws.send(JSON.stringify({
          type: 'battle_ready',
          payload: { battleId, battle }
        }));
      }
    } else {
      // Add to matchmaking queue
      ws.send(JSON.stringify({
        type: 'matchmaking',
        payload: { status: 'searching', queuePosition: 1 }
      }));
    }
  }
}

function handleBattleAction(ws, payload) {
  const { battleId, action, skillId, userId } = payload;
  const battle = battles.get(battleId);
  if (!battle) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Battle not found' }
    }));
    return;
  }

  const player = battle.players.find(p => p.userId === userId);
  const opponent = battle.players.find(p => p.userId !== userId);
  if (!player) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Player not in battle' }
    }));
    return;
  }

  switch (action) {
    case 'use_skill':
      const result = processSkillUse(player, opponent, skillId);
      
      // Update battle state
      battle.rounds.push({
        playerId: userId,
        action: 'use_skill',
        skillId,
        result,
        timestamp: Date.now()
      });

      // Check for battle end
      if (opponent.health <= 0) {
        battle.status = 'finished';
        battle.winner = userId;
        battle.endTime = Date.now();
      }

      // Broadcast battle update to all participants
      broadcastBattleUpdate(battleId, battle);

      // Handle AI response for PvE battles
      if (opponent.isAI && battle.status === 'in_progress') {
        setTimeout(() => {
          handleAITurn(battleId, battle);
        }, 1000 + Math.random() * 2000); // 1-3 second delay
      }
      break;

    case 'forfeit':
      battle.status = 'finished';
      battle.winner = opponent.userId;
      battle.endTime = Date.now();
      broadcastBattleUpdate(battleId, battle);
      break;
  }
}

function handleLeaveArena(ws, payload) {
  const { userId } = payload;
  connections.delete(userId);
  
  // Find and end any active battles for this user
  for (const [battleId, battle] of battles.entries()) {
    const player = battle.players.find(p => p.userId === userId);
    if (player && battle.status === 'in_progress') {
      battle.status = 'finished';
      battle.winner = battle.players.find(p => p.userId !== userId)?.userId;
      battle.endTime = Date.now();
      broadcastBattleUpdate(battleId, battle);
    }
  }
}

function handleGetBattleState(ws, payload) {
  const { battleId } = payload;
  const battle = battles.get(battleId);
  
  if (battle) {
    ws.send(JSON.stringify({
      type: 'battle_state',
      payload: { battleId, battle }
    }));  } else {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Battle not found' }
    }));  }
}

function handleChatMessage(ws, payload) {
  const { battleId, username, message, userId } = payload;
  const battle = battles.get(battleId);
  
  if (!battle) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: 'Battle not found' }
    }));
    return;
  }

  // Broadcast chat message to all players in the battle
  const chatMessage = JSON.stringify({
    type: 'chat_message',
    payload: {
      username,
      message,
      userId,
      timestamp: Date.now()
    }
  });

  battle.players.forEach(player => {
    const connection = connections.get(player.userId);
    if (connection && connection.ws.readyState === 1) { // WebSocket.OPEN
      connection.ws.send(chatMessage);
    }
  });
}

function createAIBattle(battleId, userId, username, skills, difficulty) {
  const difficultySettings = {
    easy: { health: 80, damageMultiplier: 0.8 },
    normal: { health: 100, damageMultiplier: 1.0 },
    hard: { health: 120, damageMultiplier: 1.3 }
  };

  const aiSettings = difficultySettings[difficulty] || difficultySettings.normal;
  const aiSkills = getRandomAISkills();

  return {
    battleId,
    players: [
      {
        userId,
        username,
        skills,
        health: 100,
        maxHealth: 100,
        skillCooldowns: {},
        isAI: false
      },
      {
        userId: 'ai',
        username: `AI (${difficulty})`,
        skills: aiSkills,
        health: aiSettings.health,
        maxHealth: aiSettings.health,
        skillCooldowns: {},
        isAI: true,
        difficulty,
        damageMultiplier: aiSettings.damageMultiplier
      }
    ],
    status: 'in_progress',
    rounds: [],
    createdAt: Date.now()
  };
}

function createPvPBattle(battleId, player1, player2) {
  // Random HP between 80-120 for fair play
  const player1HP = 80 + Math.floor(Math.random() * 41); // 80-120
  const player2HP = 80 + Math.floor(Math.random() * 41); // 80-120

  return {
    battleId,
    players: [
      {
        ...player1,
        health: player1HP,
        maxHealth: player1HP,
        skillCooldowns: {},
        isAI: false
      },
      {
        ...player2,
        health: player2HP,
        maxHealth: player2HP,
        skillCooldowns: {},
        isAI: false
      }
    ],
    status: 'in_progress',
    rounds: [],
    createdAt: Date.now()
  };
}

function findAvailableOpponent(userId) {
  for (const [opponentId, connection] of connections.entries()) {
    if (opponentId !== userId) {
      // Simple matchmaking - just find any available opponent
      // In a real implementation, you'd consider skill level, etc.
      return {
        userId: opponentId,
        username: connection.username,
        skills: connection.skills
      };
    }
  }
  return null;
}

function processSkillUse(player, opponent, skillId) {
  // Basic skill system - in a real implementation, you'd import from shared skills module
  const basicSkills = {
    fireball: { power: 35, type: 'attack', cooldown: 3 },
    lightning_bolt: { power: 30, type: 'attack', cooldown: 2 },
    ice_shard: { power: 25, type: 'attack', cooldown: 2 },
    shadow_strike: { power: 40, type: 'attack', cooldown: 4 },
    shield_wall: { power: 25, type: 'defense', cooldown: 3 },
    dodge_roll: { power: 20, type: 'defense', cooldown: 2 },
    healing_potion: { power: 30, type: 'heal', cooldown: 4 },
    regeneration: { power: 15, type: 'heal', cooldown: 2 },
    fire_resistance: { power: 30, type: 'defense', cooldown: 4 },
    ice_armor: { power: 22, type: 'defense', cooldown: 3 },
    earth_shield: { power: 28, type: 'defense', cooldown: 3 },
    wind_blast: { power: 20, type: 'attack', cooldown: 2 },
    poison_dart: { power: 15, type: 'attack', cooldown: 3 },
    thunder_strike: { power: 35, type: 'attack', cooldown: 4 },
    arcane_blast: { power: 30, type: 'attack', cooldown: 3 },
    holy_light: { power: 25, type: 'heal', cooldown: 3 },
    shadow_heal: { power: 20, type: 'heal', cooldown: 2 },
    nature_blessing: { power: 40, type: 'heal', cooldown: 5 },
    divine_protection: { power: 50, type: 'defense', cooldown: 6 },
    arcane_shield: { power: 35, type: 'defense', cooldown: 5 },
    frost_bite: { power: 30, type: 'attack', cooldown: 3 },
    firestorm: { power: 45, type: 'attack', cooldown: 5 },
    lightning_strike: { power: 40, type: 'attack', cooldown: 4 },
    ice_spike: { power: 35, type: 'attack', cooldown: 3 },
    earthquake: { power: 50, type: 'attack', cooldown: 6 },
    wind_surge: { power: 30, type: 'attack', cooldown: 3 }
  };

  const skill = basicSkills[skillId];
  if (!skill) {
    return { error: 'Invalid skill' };
  }

  // Check cooldown
  const lastUsed = player.skillCooldowns[skillId] || 0;
  const now = Date.now();
  if (now - lastUsed < skill.cooldown * 1000) {
    return { error: 'Skill on cooldown' };
  }

  let damage = 0;
  let healing = 0;
  let effect = '';

  switch (skill.type) {
    case 'attack':
      damage = Math.floor(skill.power + Math.random() * 10);
      if (opponent.damageMultiplier) {
        damage = Math.floor(damage * opponent.damageMultiplier);
      }
      opponent.health = Math.max(0, opponent.health - damage);
      effect = `${skillId} deals ${damage} damage`;
      break;

    case 'heal':
      healing = Math.floor(skill.power + Math.random() * 5);
      player.health = Math.min(player.maxHealth, player.health + healing);
      effect = `${skillId} heals for ${healing} HP`;
      break;

    case 'defense':
      effect = `${skillId} provides protection`;
      break;
  }

  // Set cooldown
  player.skillCooldowns[skillId] = now;

  return { damage, healing, effect };
}

function handleAITurn(battleId, battle) {
  const aiPlayer = battle.players.find(p => p.isAI);
  const humanPlayer = battle.players.find(p => !p.isAI);

  if (!aiPlayer || battle.status !== 'in_progress') return;

  // Simple AI: randomly choose an available skill
  const availableSkills = aiPlayer.skills.filter(skillId => {
    const lastUsed = aiPlayer.skillCooldowns[skillId] || 0;
    const now = Date.now();
    const basicSkills = {
      fireball: { cooldown: 3 },
      lightning_bolt: { cooldown: 2 },
      ice_shard: { cooldown: 2 },
      shield_wall: { cooldown: 3 },
      healing_potion: { cooldown: 4 }
    };
    const skill = basicSkills[skillId];
    return !skill || (now - lastUsed >= skill.cooldown * 1000);
  });

  if (availableSkills.length === 0) return;

  const selectedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
  const result = processSkillUse(aiPlayer, humanPlayer, selectedSkill);

  battle.rounds.push({
    playerId: 'ai',
    action: 'use_skill',
    skillId: selectedSkill,
    result,
    timestamp: Date.now()
  });

  // Check for battle end
  if (humanPlayer.health <= 0) {
    battle.status = 'finished';
    battle.winner = 'ai';
    battle.endTime = Date.now();
  }

  broadcastBattleUpdate(battleId, battle);
}

function broadcastBattleUpdate(battleId, battle) {
  const message = JSON.stringify({
    type: 'battle_update',
    payload: { battleId, battle }
  });

  battle.players.forEach(player => {
    const connection = connections.get(player.userId);
    if (connection && connection.ws.readyState === 1) { // WebSocket.OPEN
      connection.ws.send(message);
    }
  });
}

function getRandomAISkills() {
  const availableSkills = [
    'fireball', 'lightning_bolt', 'ice_shard', 'shield_wall', 'healing_potion'
  ];
  return availableSkills.sort(() => 0.5 - Math.random()).slice(0, 4);
}

// Cleanup inactive battles periodically
setInterval(() => {
  const now = Date.now();
  for (const [battleId, battle] of battles.entries()) {
    // Remove battles older than 1 hour
    if (now - battle.createdAt > 60 * 60 * 1000) {
      battles.delete(battleId);
      console.log(`Cleaned up inactive battle: ${battleId}`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

console.log('Battle Service initialized with WebSocket support');
