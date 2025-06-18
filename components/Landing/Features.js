'use client';

import { motion } from 'framer-motion';
import { FiTarget, FiTrendingUp, FiClock, FiAward, FiUsers, FiShield } from 'react-icons/fi';

const features = [
  {
    icon: <FiTarget className="w-10 h-10 text-theme-primary" />,
    title: 'Gamified Goal Setting',
    description: 'Transform your goals into epic quests and break them down into manageable tasks. The journey to success has never been more exciting.',
  },
  {
    icon: <FiTrendingUp className="w-10 h-10 text-theme-primary" />,
    title: 'XP & Leveling System',
    description: 'Earn experience points (XP) for completing tasks and level up your skills. Watch your progress materialize in a tangible and motivating way.',
  },
  {
    icon: <FiClock className="w-10 h-10 text-theme-primary" />,
    title: 'Time-based Challenges',
    description: 'Add a sense of urgency with optional time limits for your quests. Beat the clock and earn bonus rewards for your efficiency.',
  },
  {
    icon: <FiAward className="w-10 h-10 text-theme-primary" />,
    title: 'Achievements & Rewards',
    description: 'Unlock unique achievements and collect rewards as you progress. Celebrate your victories and build a legacy of success.',
  },
  {
    icon: <FiUsers className="w-10 h-10 text-theme-primary" />,
    title: 'Community Leaderboards',
    description: 'Compete with friends and other users on the XP leaderboard. Climb the ranks and become a legendary QuestForger.',
  },
  {
    icon: <FiShield className="w-10 h-10 text-theme-primary" />,
    title: 'Secure & Private',
    description: 'Your goals and data are yours alone. We use robust security measures to ensure your information is always safe and private.',
  },
];

const Features = () => {
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="features" className="py-20 bg-theme-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">Why You&apos;ll Love QuestForge</h2>
          <p className="max-w-2xl mx-auto mt-4 text-lg text-theme-text-secondary">
            QuestForge is more than just a to-do list. It&apos;s a complete system for personal growth.
          </p>
        </div>
        <motion.div 
          variants={featureVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="card-theme p-6 shadow-lg flex flex-col items-start"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-theme-text-secondary">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
