"use client";

import { useState, useEffect, useRef,useCallback } from "react";
import { getSkillsByIds } from "../lib/skills";

export default function WebSocketArenaComponent({ 
  selectedSkills, 
  onBack, 
  onBattleComplete,
  user 
}) {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");  
  const [battleState, setBattleState] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [skillCooldowns, setSkillCooldowns] = useState({});
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const skills = getSkillsByIds(selectedSkills);

  // Define handleWebSocketMessage first to avoid the circular dependency
  const handleWebSocketMessage = useCallback((data) => {
    const { type, payload, message } = data;

    switch (type) {
      case 'pong':
        console.log('WebSocket connection verified');
        break;

      case 'battle_ready':
        if (payload && payload.battle) {
          setBattleState(payload.battle);
          setActionLog(['Battle started!']);
        }
        break;

      case 'battle_update':
        if (payload && payload.battle) {
          setBattleState(payload.battle);

          // Add action to log
          const latestRound = payload.battle.rounds[payload.battle.rounds.length - 1];
          if (latestRound) {
            const playerName = latestRound.playerId === user.id ? user.username : 
                             latestRound.playerId === 'ai' ? 'AI' : 'Opponent';
            setActionLog(prev => [...prev, `${playerName}: ${latestRound.result.effect}`]);
          }

          // Check if battle ended
          if (payload.battle.status === 'finished') {
            const isWinner = payload.battle.winner === user.id;
            const xpGained = isWinner ? 50 : 20; // Basic XP calculation

            setTimeout(() => {
              onBattleComplete({
                winner: isWinner ? user.username : 'Opponent',
                xp: xpGained,
                battleId: payload.battle.battleId
              });
            }, 2000);
          }
        }
        break;

      case 'matchmaking':
        if (payload) {
          console.log('Matchmaking status:', payload.status);
        }
        break;      
      case 'error':
        const errorMessage = (payload && payload.message) || message || 'Unknown error';
        console.error('Battle service error:', errorMessage);
        setActionLog(prev => [...prev, `Error: ${errorMessage}`]);
        break;

      case 'chat_message':
        if (payload) {
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            username: payload.username,
            message: payload.message,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }, [user.id, user.username, onBattleComplete]);

  // Define connectToWebSocket with useCallback to avoid recreation on each render
  const connectToWebSocket = useCallback(() => {
    // Prevent reconnecting if already connecting or connected
    if (connectionStatus === "connecting" || connectionStatus === "connected") {
      return;
    }

    try {
      setConnectionStatus("connecting");

      // In production, replace with your Render WebSocket URL
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_BATTLE_WS_URL || 'https://questforge-battlesevice-v0.onrender.com'
        : 'ws://localhost:8080';

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to Battle Service');
        setConnectionStatus("connected");
        setSocket(ws);
        reconnectAttempts.current = 0;

        // Send ping to verify connection
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from Battle Service');
        setConnectionStatus("disconnected");
        setSocket(null);

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttempts.current}`);
            connectToWebSocket();
          }, 2000 * reconnectAttempts.current);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus("error");
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus("error");
    }
  }, [handleWebSocketMessage]);

  useEffect(() => {
    // Only connect if no connection exists
    if (!socket && connectionStatus !== "connecting") {
      connectToWebSocket();
    }

    // Cleanup function
    return () => {
      if (socket) {
        // Prevent the onclose handler from triggering reconnect
        reconnectAttempts.current = maxReconnectAttempts;
        socket.close();
      }
    };
  }, [connectToWebSocket]);

  useEffect(() => {
    // Update skill cooldowns every second
    const interval = setInterval(() => {
      setSkillCooldowns(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(skillId => {
          if (updated[skillId] > 0) {
            updated[skillId]--;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const joinArenaBattle = (mode, difficulty = null) => {
    if (!socket || connectionStatus !== "connected") {
      console.error('WebSocket not connected');
      return;
    }

    const token = localStorage.getItem("token");
    
    socket.send(JSON.stringify({
      type: 'join_arena',
      token,
      payload: {
        userId: user.id,
        username: user.username,
        skills: selectedSkills,
        mode,
        difficulty
      }
    }));
  };

  const handleUseSkill = useCallback((skillId) => {
    if (!socket || !battleState || connectionStatus !== "connected") return;

    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;

    // Check cooldown
    if (skillCooldowns[skillId] > 0) return;

    const token = localStorage.getItem("token");

    socket.send(JSON.stringify({
      type: 'battle_action',
      token,
      payload: {
        battleId: battleState.battleId,
        action: 'use_skill',
        skillId,
        userId: user.id
      }
    }));

    // Set local cooldown
    setSkillCooldowns(prev => ({
      ...prev,
      [skillId]: skill.cooldown
    }));
  }, [socket, battleState, connectionStatus, skills, skillCooldowns, user.id]);
  const forfeitBattle = () => {
    if (!socket || !battleState) return;

    const token = localStorage.getItem("token");
    
    socket.send(JSON.stringify({
      type: 'battle_action',
      token,
      payload: {
        battleId: battleState.battleId,
        action: 'forfeit',
        userId: user.id
      }
    }));
  };

  const sendChatMessage = () => {
    if (!socket || !newMessage.trim() || !battleState) return;

    const token = localStorage.getItem("token");
    
    socket.send(JSON.stringify({
      type: 'chat_message',
      token,
      payload: {
        battleId: battleState.battleId,
        username: user.username,
        message: newMessage.trim(),
        userId: user.id
      }
    }));

    setNewMessage('');
  };

  const selectDifficulty = (difficulty) => {
    setShowDifficultyModal(false);
    joinArenaBattle('pve', difficulty);
  };

  // Show connection status while connecting
  if (connectionStatus === "connecting" || connectionStatus === "disconnected") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Connecting to Battle Service...
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {connectionStatus === "connecting" ? "Establishing connection..." : "Reconnecting..."}
          </p>
        </div>

        <div className="mb-8">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Status: {connectionStatus}
          </p>
          {reconnectAttempts.current > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reconnection attempt: {reconnectAttempts.current}/{maxReconnectAttempts}
            </p>
          )}
        </div>

        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Show error state
  if (connectionStatus === "error") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-red-600 mb-2">Connection Failed</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Unable to connect to the Battle Service. Please try again later.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={connectToWebSocket}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Retry Connection
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  // Show battle interface if battle is active
  if (battleState) {
    const player = battleState.players.find(p => p.userId === user.id);
    const opponent = battleState.players.find(p => p.userId !== user.id);

    // Debug logging
    console.log('Battle State:', battleState);
    console.log('User ID:', user.id);
    console.log('Player found:', player);
    console.log('Opponent found:', opponent);
    console.log('All players:', battleState.players);

    if (!player || !opponent) {
      return (
        <div className="max-w-2xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Battle State Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Unable to load battle participants properly.
          </p>
          <div className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Players in battle:</strong></p>
            {battleState.players.map((p, i) => (
              <div key={i} className="ml-4">
                <p>Player {i+1}: {p.username} (ID: {p.userId})</p>
              </div>
            ))}
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Battle Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Battle Arena
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Battle ID: {battleState.battleId}
          </p>
        </div>        {/* Player vs Opponent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Player Info */}
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{player?.username} (You)</h3>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, (player?.health / player?.maxHealth) * 100)}%` }}
              />
            </div>
            <p className="text-sm">{player?.health}/{player?.maxHealth} HP</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Level: {user.level || 1}
            </p>
          </div>

          {/* Battle Log & Chat Toggle */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">
                {showChat ? 'Chat' : 'Battle Log'}
              </h3>
              <button
                onClick={() => setShowChat(!showChat)}
                className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
              >
                {showChat ? '📋 Log' : '💬 Chat'}
              </button>
            </div>
            
            {!showChat ? (
              <div className="h-32 overflow-y-auto text-sm space-y-1">
                {actionLog.map((log, index) => (
                  <div key={index} className="text-gray-700 dark:text-gray-300">
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex flex-col">
                <div className="flex-1 overflow-y-auto text-sm space-y-1 mb-2">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {msg.username}:
                      </span>
                      <span className="ml-1">{msg.message}</span>
                      <span className="text-xs text-gray-500 ml-2">{msg.timestamp}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="flex-1 text-xs px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Opponent Info */}
          <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{opponent?.username}</h3>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, (opponent?.health / opponent?.maxHealth) * 100)}%` }}
              />
            </div>
            <p className="text-sm">{opponent?.health}/{opponent?.maxHealth} HP</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {opponent?.isAI ? `AI Difficulty: ${opponent?.difficulty}` : 'Player'}
            </p>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">Your Skills</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {skills.map((skill) => {
              const cooldown = skillCooldowns[skill.id] || 0;
              const isOnCooldown = cooldown > 0;

              return (
                <button
                  key={skill.id}
                  onClick={() => !isOnCooldown && handleUseSkill(skill.id)}
                  disabled={isOnCooldown || battleState.status !== 'in_progress'}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isOnCooldown || battleState.status !== 'in_progress'
                      ? "bg-gray-300 border-gray-400 cursor-not-allowed opacity-50"
                      : "bg-white dark:bg-gray-800 border-blue-300 hover:border-blue-500 hover:shadow-lg cursor-pointer"
                  }`}
                >
                  <div className="text-2xl mb-2">{skill.icon}</div>
                  <div className="font-semibold text-sm">{skill.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {isOnCooldown ? `${cooldown}s` : `${skill.power} power`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Battle Controls */}
        <div className="text-center">
          <button
            onClick={forfeitBattle}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Forfeit Battle
          </button>
        </div>
      </div>
    );
  }
  // Show mode selection if no battle is active
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Choose Battle Mode
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Real-time battles powered by WebSocket
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          onClick={() => joinArenaBattle('pvp')}
          className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg cursor-pointer text-white shadow-lg hover:scale-105 transition-transform"
        >
          <div className="text-4xl mb-4">⚔️</div>
          <h3 className="text-xl font-bold mb-2">Player vs Player</h3>
          <p className="text-blue-100">
            Battle against real players in live matches
          </p>
          <p className="text-blue-200 text-sm mt-2">
            💬 Chat enabled • 🎲 Random HP (80-120)
          </p>
        </div>

        <div
          onClick={() => setShowDifficultyModal(true)}
          className="p-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg cursor-pointer text-white shadow-lg hover:scale-105 transition-transform"
        >
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-bold mb-2">Player vs AI</h3>
          <p className="text-green-100">
            Practice against AI opponents
          </p>
          <p className="text-green-200 text-sm mt-2">
            🎯 Choose difficulty • 🔧 Custom HP settings
          </p>
        </div>
      </div>

      {/* Difficulty Selection Modal */}
      {showDifficultyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Select AI Difficulty
            </h3>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => selectDifficulty('easy')}
                className="w-full p-4 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-green-800 dark:text-green-200">🟢 Easy</div>
                <div className="text-sm text-green-600 dark:text-green-300">
                  AI: 80 HP • Damage: -20% • Slower reactions
                </div>
              </button>
              
              <button
                onClick={() => selectDifficulty('normal')}
                className="w-full p-4 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-yellow-800 dark:text-yellow-200">🟡 Normal</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-300">
                  AI: 100 HP • Damage: Normal • Balanced gameplay
                </div>
              </button>
              
              <button
                onClick={() => selectDifficulty('hard')}
                className="w-full p-4 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-red-800 dark:text-red-200">🔴 Hard</div>
                <div className="text-sm text-red-600 dark:text-red-300">
                  AI: 120 HP • Damage: +30% • Faster reactions
                </div>
              </button>
              
              <button
                onClick={() => selectDifficulty(['easy', 'normal', 'hard'][Math.floor(Math.random() * 3)])}
                className="w-full p-4 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-purple-800 dark:text-purple-200">🎲 Random</div>
                <div className="text-sm text-purple-600 dark:text-purple-300">
                  Surprise me! Random difficulty each battle
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowDifficultyModal(false)}
              className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Back to Skill Selection
        </button>
      </div>
    </div>
  );
}
