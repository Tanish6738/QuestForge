"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DIFFICULTY_LEVELS, getSkillsByIds } from "../lib/skills";

export default function ArenaComponent({ 
  selectedSkills, 
  onBack, 
  onBattleComplete,
  user 
}) {
  const [step, setStep] = useState("choose-mode"); // choose-mode, choose-difficulty, waiting, battle
  const [battleMode, setBattleMode] = useState(null); // pvp, pve
  const [difficulty, setDifficulty] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [matchmakingTimer, setMatchmakingTimer] = useState(0);
  const timerRef = useRef(null);

  const skills = getSkillsByIds(selectedSkills);

  useEffect(() => {
    if (step === "waiting") {
      timerRef.current = setInterval(() => {
        setMatchmakingTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        setMatchmakingTimer(0);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [step]);

  const connectToArena = async () => {
    try {
      setConnectionStatus("connecting");
      
      // For now, we'll simulate the connection
      // In production, this would connect to the WebSocket server on Render
      
      if (battleMode === "pve") {
        // Simulate AI battle setup
        setTimeout(() => {
          setStep("battle");
          setBattleState({
            battleId: `ai_battle_${Date.now()}`,
            players: [
              {
                userId: user._id,
                username: user.username,
                health: 100,
                maxHealth: 100,
                skills: selectedSkills,
                isAI: false
              },
              {
                userId: "ai",
                username: `AI (${DIFFICULTY_LEVELS[difficulty].name})`,
                health: DIFFICULTY_LEVELS[difficulty].aiHealth,
                maxHealth: DIFFICULTY_LEVELS[difficulty].aiHealth,
                skills: getRandomAISkills(),
                isAI: true,
                difficulty
              }
            ],
            currentTurn: 0,
            status: "in_progress"
          });
          setConnectionStatus("connected");
        }, 2000);
      } else {
        // For PvP, we would implement actual matchmaking
        setConnectionStatus("connected");
      }
    } catch (error) {
      console.error("Failed to connect to arena:", error);
      setConnectionStatus("error");
    }
  };

  const getRandomAISkills = () => {
    const availableSkills = ["fireball", "lightning_bolt", "shield_wall", "healing_potion"];
    return availableSkills.sort(() => 0.5 - Math.random()).slice(0, 4);
  };

  const handleModeSelect = (mode) => {
    setBattleMode(mode);
    if (mode === "pve") {
      setStep("choose-difficulty");
    } else {
      setStep("waiting");
      connectToArena();
    }
  };

  const handleDifficultySelect = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setStep("waiting");
    connectToArena();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === "choose-mode") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Choose Battle Mode
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Select how you want to fight
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModeSelect("pvp")}
            className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg cursor-pointer text-white shadow-lg"
          >
            <div className="text-4xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold mb-2">Player vs Player</h3>
            <p className="text-blue-100">
              Battle against real players in competitive matches
            </p>
            <div className="mt-4 text-sm text-blue-200">
              • Real-time battles
              • Ranking system
              • Skill-based matchmaking
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModeSelect("pve")}
            className="p-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg cursor-pointer text-white shadow-lg"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">Player vs Computer</h3>
            <p className="text-green-100">
              Practice against AI opponents with adjustable difficulty
            </p>
            <div className="mt-4 text-sm text-green-200">
              • Multiple difficulty levels
              • Practice mode
              • Guaranteed matches
            </div>
          </motion.div>
        </div>

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

  if (step === "choose-difficulty") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Choose AI Difficulty
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Select the challenge level for your AI opponent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(DIFFICULTY_LEVELS).map(([key, diff]) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDifficultySelect(key)}
              className={`p-6 rounded-lg cursor-pointer text-white shadow-lg ${
                key === "easy" ? "bg-gradient-to-br from-green-400 to-green-600" :
                key === "normal" ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                "bg-gradient-to-br from-red-500 to-red-700"
              }`}
            >
              <h3 className="text-xl font-bold mb-2">{diff.name}</h3>
              <p className="text-sm opacity-90 mb-4">{diff.description}</p>
              <div className="text-xs space-y-1 opacity-80">
                <div>Health: {diff.aiHealth}</div>
                <div>Damage: {Math.round(diff.aiDamageMultiplier * 100)}%</div>
                <div>Speed: {Math.round(diff.aiSpeedMultiplier * 100)}%</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const difficulties = ["easy", "normal", "hard"];
              const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
              handleDifficultySelect(randomDiff);
            }}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg"
          >
            🎲 Random Difficulty
          </motion.button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setStep("choose-mode")}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Back to Mode Selection
          </button>
        </div>
      </div>
    );
  }

  if (step === "waiting") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {battleMode === "pvp" ? "Finding Opponent..." : "Preparing AI Battle..."}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {battleMode === "pvp" 
              ? "Searching for a player with similar skill level"
              : `Setting up ${DIFFICULTY_LEVELS[difficulty]?.name} AI opponent`
            }
          </p>
        </div>

        <div className="mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4"
          />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Time elapsed: {formatTime(matchmakingTimer)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Status: {connectionStatus}
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Your Selected Skills:</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm flex items-center gap-1"
              >
                <span>{skill.icon}</span>
                {skill.name}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => setStep("choose-mode")}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Cancel & Go Back
        </button>
      </div>
    );
  }

  if (step === "battle" && battleState) {
    return (
      <BattleInterface 
        battleState={battleState} 
        onBattleComplete={onBattleComplete}
        userSkills={skills}
      />
    );
  }

  return null;
}

// Battle Interface Component
function BattleInterface({ battleState, onBattleComplete, userSkills }) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [skillCooldowns, setSkillCooldowns] = useState({});

  const player = battleState.players[0];
  const opponent = battleState.players[1];

      const handleUseSkill = useCallback(async (skill) => {
    if (skillCooldowns[skill.id] > 0) return;

    // Simulate battle action
    const damage = Math.floor(skill.power + Math.random() * 10);
    const newLog = `${player.username} used ${skill.name} for ${damage} damage!`;

    setActionLog(prev => [...prev, newLog]);

    // Set cooldown
    setSkillCooldowns(prev => ({
      ...prev,
      [skill.id]: skill.cooldown
    }));

    // Simulate AI response (basic implementation)
    setTimeout(() => {
      const aiSkill = userSkills[Math.floor(Math.random() * userSkills.length)];
      const aiDamage = Math.floor(aiSkill.power * 0.8);
      setActionLog(prev => [...prev, `${opponent.username} used ${aiSkill.name} for ${aiDamage} damage!`]);
    }, 1500);
      }, [skillCooldowns, player.username, opponent.username, userSkills]);

  useEffect(() => {
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Info */}
        <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2">{player.username}</h3>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
            />
          </div>
          <p className="text-sm">{player.health}/{player.maxHealth} HP</p>
        </div>

        {/* Battle Log */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2">Battle Log</h3>
          <div className="h-32 overflow-y-auto text-sm space-y-1">
            {actionLog.map((log, index) => (
              <div key={index} className="text-gray-700 dark:text-gray-300">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Opponent Info */}
        <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2">{opponent.username}</h3>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
            />
          </div>
          <p className="text-sm">{opponent.health}/{opponent.maxHealth} HP</p>
        </div>
      </div>

      {/* Skills */}
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-4">Your Skills</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {userSkills.map((skill) => {
            const cooldown = skillCooldowns[skill.id] || 0;
            const isOnCooldown = cooldown > 0;

            return (
              <motion.button
                key={skill.id}
                whileHover={{ scale: isOnCooldown ? 1 : 1.05 }}
                whileTap={{ scale: isOnCooldown ? 1 : 0.95 }}
                onClick={() => !isOnCooldown && handleUseSkill(skill)}
                disabled={isOnCooldown}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isOnCooldown
                    ? "bg-gray-300 border-gray-400 cursor-not-allowed opacity-50"
                    : "bg-white dark:bg-gray-800 border-blue-300 hover:border-blue-500 hover:shadow-lg cursor-pointer"
                }`}
              >
                <div className="text-2xl mb-2">{skill.icon}</div>
                <div className="font-semibold text-sm">{skill.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {isOnCooldown ? `${cooldown}s` : `${skill.power} power`}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => onBattleComplete({ winner: player.username, xp: 50 })}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
        >
          Forfeit Battle
        </button>
      </div>
    </div>
  );
}
