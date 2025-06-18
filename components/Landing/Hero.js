'use client';

import { motion } from 'framer-motion';

const Hero = ({ onLoginClick }) => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28 bg-theme-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4"
        >
          <span style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            QuestForge
          </span>
          : Turn Your Ambitions into Epic Adventures
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-theme-text-secondary mb-8"
        >
          Stop dreaming, start achieving. QuestForge is a gamified productivity app that transforms your goals into exciting quests, helping you build momentum, stay motivated, and conquer your wildest ambitions.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button 
            onClick={onLoginClick}
            className="btn btn-primary btn-lg shadow-lg px-4 py-2 rounded"
          >
            Start Your First Quest
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
