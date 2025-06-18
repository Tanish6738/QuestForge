'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    title: 'Sign Up',
    description: 'Create your free QuestForge account in seconds.',
    emoji: '📝',
  },
  {
    title: 'Set Your Goals',
    description: 'Define your ambitions and break them into quests.',
    emoji: '🎯',
  },
  {
    title: 'Start Questing',
    description: 'Complete tasks, earn XP, and level up your life!',
    emoji: '⚡',
  },
  {
    title: 'Track Progress',
    description: 'View your stats, achievements, and leaderboard rank.',
    emoji: '📈',
  },
];

const HowToUse = () => {
  return (
    <section id="howtouse" className="py-20 bg-theme-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">How QuestForge Works</h2>
          <p className="max-w-2xl mx-auto mt-4 text-lg text-theme-text-secondary">
            Get started in just a few simple steps and begin your journey to greatness.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: idx * 0.1 }}
              className="card-theme p-6 flex flex-col items-center text-center shadow-lg"
            >
              <div className="text-4xl mb-4">{step.emoji}</div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-theme-text-secondary">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToUse;
