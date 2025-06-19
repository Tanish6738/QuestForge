"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SkillSelector from "../../../components/SkillSelector";
import WebSocketArenaComponent from "../../../components/WebSocketArenaComponent";

export default function ArenaPage() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("select-skills"); // select-skills, arena, battle-complete
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [battleResult, setBattleResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    setUser(JSON.parse(userData));
    
    // Load previously selected skills if any
    const savedSkills = localStorage.getItem("arenaSkills");
    if (savedSkills) {
      setSelectedSkills(JSON.parse(savedSkills));
    }
  }, [router]);

  const handleSkillConfirm = (skills) => {
    setSelectedSkills(skills);
    localStorage.setItem("arenaSkills", JSON.stringify(skills));
    setStep("arena");
  };

  const handleBackToSkills = () => {
    setStep("select-skills");
  };

  const handleBattleComplete = async (result) => {
    setBattleResult(result);
    setStep("battle-complete");
    
    // Award XP to user
    if (result.xp > 0) {
      try {
        const token = localStorage.getItem("token");
        await fetch("/api/xp", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            xpGained: result.xp,
            source: "arena_battle",
            description: `Arena battle - ${result.winner === user?.username ? "Victory" : "Defeat"}`
          })
        });
      } catch (error) {
        console.error("Failed to award XP:", error);
      }
    }
  };

  const handlePlayAgain = () => {
    setBattleResult(null);
    setStep("arena");
  };

  const handleReturnToDashboard = () => {
    router.push("/dashboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleReturnToDashboard}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </button>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                ⚔️ Battle Arena
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, <span className="font-semibold">{user.username}</span>
              </div>
              <div className="text-sm bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                Level {user.level || 1}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {step === "select-skills" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SkillSelector 
              onConfirm={handleSkillConfirm} 
              initialSkills={selectedSkills}
            />
          </motion.div>
        )}        {step === "arena" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <WebSocketArenaComponent
              selectedSkills={selectedSkills}
              onBack={handleBackToSkills}
              onBattleComplete={handleBattleComplete}
              user={user}
            />
          </motion.div>
        )}

        {step === "battle-complete" && battleResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto p-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
              <div className="text-6xl mb-4">
                {battleResult.winner === user.username ? "🏆" : "💀"}
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
                {battleResult.winner === user.username ? "Victory!" : "Defeat!"}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {battleResult.winner === user.username 
                  ? "Congratulations! You emerged victorious from the battle."
                  : "Don't give up! Learn from this battle and try again."
                }
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-6">
                <div className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  XP Gained: +{battleResult.xp}
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handlePlayAgain}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Battle Again
                </button>
                <button
                  onClick={handleBackToSkills}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Change Skills
                </button>
                <button
                  onClick={handleReturnToDashboard}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
