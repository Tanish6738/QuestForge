"use client";

import { useState } from "react";
import { SKILLS_DECK } from "../lib/skills";
import { motion, AnimatePresence } from "framer-motion";

export default function SkillSelector({ onConfirm, initialSkills = [] }) {
  const [selectedSkills, setSelectedSkills] = useState(initialSkills);
  const [filterType, setFilterType] = useState("all");

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill.id)) {
      setSelectedSkills(selectedSkills.filter((id) => id !== skill.id));
    } else if (selectedSkills.length < 4) {
      setSelectedSkills([...selectedSkills, skill.id]);
    }
  };

  const filteredSkills = filterType === "all" 
    ? SKILLS_DECK 
    : SKILLS_DECK.filter(skill => skill.type === filterType);

  const getTypeColor = (type) => {
    switch(type) {
      case 'attack': return 'bg-red-500';
      case 'defense': return 'bg-blue-500';
      case 'heal': return 'bg-green-500';
      case 'special': return 'bg-purple-500';
      case 'buff': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getElementColor = (element) => {
    switch(element) {
      case 'fire': return 'border-red-400';
      case 'ice': return 'border-blue-400';
      case 'electric': return 'border-yellow-400';
      case 'earth': return 'border-green-400';
      case 'dark': return 'border-purple-400';
      case 'light': return 'border-white';
      case 'poison': return 'border-green-600';
      default: return 'border-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Choose Your Battle Skills
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select exactly 4 skills for battle ({selectedSkills.length}/4)
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {["all", "attack", "defense", "heal", "special", "buff"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === type
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Selected Skills Display */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
          Selected Skills:
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedSkills.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No skills selected</p>
          ) : (
            selectedSkills.map((skillId) => {
              const skill = SKILLS_DECK.find(s => s.id === skillId);
              return (
                <motion.div
                  key={skillId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm ${getTypeColor(skill.type)}`}
                >
                  <span>{skill.icon}</span>
                  <span>{skill.name}</span>
                  <button
                    onClick={() => toggleSkill(skill)}
                    className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <AnimatePresence>
          {filteredSkills.map((skill) => {
            const isSelected = selectedSkills.includes(skill.id);
            const isDisabled = !isSelected && selectedSkills.length >= 4;

            return (
              <motion.div
                key={skill.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? `${getElementColor(skill.element)} bg-blue-50 dark:bg-blue-900/20 shadow-md`
                    : isDisabled
                    ? "border-gray-300 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed"
                    : `${getElementColor(skill.element)} bg-white dark:bg-gray-800 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700`
                }`}
                onClick={() => !isDisabled && toggleSkill(skill)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{skill.icon}</span>
                  <span className={`px-2 py-1 rounded text-xs text-white ${getTypeColor(skill.type)}`}>
                    {skill.type}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                  {skill.name}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {skill.description}
                </p>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Power: {skill.power}</span>
                  <span>Cooldown: {skill.cooldown}s</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm Button */}
      <div className="text-center">
        <motion.button
          whileHover={{ scale: selectedSkills.length === 4 ? 1.05 : 1 }}
          whileTap={{ scale: selectedSkills.length === 4 ? 0.95 : 1 }}
          onClick={() => selectedSkills.length === 4 && onConfirm(selectedSkills)}
          disabled={selectedSkills.length !== 4}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
            selectedSkills.length === 4
              ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
          }`}
        >
          {selectedSkills.length === 4 ? "Confirm Skills & Enter Arena" : `Select ${4 - selectedSkills.length} more skill${4 - selectedSkills.length !== 1 ? 's' : ''}`}
        </motion.button>
      </div>
    </div>
  );
}
