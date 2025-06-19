export const SKILLS_DECK = [
  // Attack Skills
  {
    id: "fireball",
    name: "Fireball",
    type: "attack",
    power: 35,
    cooldown: 3,
    description: "A powerful fire spell that deals high damage",
    icon: "🔥",
    element: "fire"
  },
  {
    id: "lightning_bolt",
    name: "Lightning Bolt",
    type: "attack",
    power: 30,
    cooldown: 2,
    description: "Fast electric attack with medium damage",
    icon: "⚡",
    element: "electric"
  },
  {
    id: "ice_shard",
    name: "Ice Shard",
    type: "attack",
    power: 25,
    cooldown: 2,
    description: "Ice projectile that can slow enemies",
    icon: "❄️",
    element: "ice"
  },
  {
    id: "shadow_strike",
    name: "Shadow Strike",
    type: "attack",
    power: 40,
    cooldown: 4,
    description: "Dark magic attack with critical hit chance",
    icon: "🌑",
    element: "dark"
  },
  {
    id: "holy_smite",
    name: "Holy Smite",
    type: "attack",
    power: 32,
    cooldown: 3,
    description: "Divine attack effective against dark enemies",
    icon: "✨",
    element: "light"
  },
  {
    id: "earth_spike",
    name: "Earth Spike",
    type: "attack",
    power: 28,
    cooldown: 2,
    description: "Ground-based attack that can stun",
    icon: "🌿",
    element: "earth"
  },

  // Defense Skills
  {
    id: "shield_wall",
    name: "Shield Wall",
    type: "defense",
    power: 25,
    cooldown: 3,
    description: "Creates a protective barrier",
    icon: "🛡️",
    element: "neutral"
  },
  {
    id: "dodge_roll",
    name: "Dodge Roll",
    type: "defense",
    power: 20,
    cooldown: 2,
    description: "Quick evasive maneuver",
    icon: "💨",
    element: "neutral"
  },
  {
    id: "fire_resistance",
    name: "Fire Resistance",
    type: "defense",
    power: 30,
    cooldown: 4,
    description: "Reduces fire damage significantly",
    icon: "🔴",
    element: "fire"
  },
  {
    id: "ice_armor",
    name: "Ice Armor",
    type: "defense",
    power: 22,
    cooldown: 3,
    description: "Frozen protection that reflects damage",
    icon: "🧊",
    element: "ice"
  },

  // Healing Skills
  {
    id: "healing_potion",
    name: "Healing Potion",
    type: "heal",
    power: 30,
    cooldown: 4,
    description: "Restores health instantly",
    icon: "🧪",
    element: "neutral"
  },
  {
    id: "regeneration",
    name: "Regeneration",
    type: "heal",
    power: 15,
    cooldown: 2,
    description: "Gradual health recovery over time",
    icon: "💚",
    element: "nature"
  },
  {
    id: "divine_heal",
    name: "Divine Heal",
    type: "heal",
    power: 40,
    cooldown: 5,
    description: "Powerful holy healing magic",
    icon: "🌟",
    element: "light"
  },

  // Special/Utility Skills
  {
    id: "mana_steal",
    name: "Mana Steal",
    type: "special",
    power: 15,
    cooldown: 3,
    description: "Drains opponent's energy while dealing damage",
    icon: "🔮",
    element: "dark"
  },
  {
    id: "speed_boost",
    name: "Speed Boost",
    type: "buff",
    power: 0,
    cooldown: 4,
    description: "Increases action speed temporarily",
    icon: "🚀",
    element: "neutral"
  },
  {
    id: "poison_dart",
    name: "Poison Dart",
    type: "attack",
    power: 20,
    cooldown: 2,
    description: "Low damage but causes poison over time",
    icon: "☠️",
    element: "poison"
  }
];

export const getSkillById = (id) => {
  return SKILLS_DECK.find(skill => skill.id === id);
};

export const getSkillsByIds = (ids) => {
  return ids.map(id => getSkillById(id)).filter(Boolean);
};

export const DIFFICULTY_LEVELS = {
  easy: {
    name: "Easy",
    aiHealth: 80,
    aiDamageMultiplier: 0.8,
    aiSpeedMultiplier: 1.2,
    description: "Good for beginners"
  },
  normal: {
    name: "Normal", 
    aiHealth: 100,
    aiDamageMultiplier: 1.0,
    aiSpeedMultiplier: 1.0,
    description: "Balanced challenge"
  },
  hard: {
    name: "Hard",
    aiHealth: 120,
    aiDamageMultiplier: 1.3,
    aiSpeedMultiplier: 0.8,
    description: "For experienced fighters"
  }
};
