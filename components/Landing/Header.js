
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

const Header = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={variants}
      className="fixed top-0 left-0 right-0 z-50 bg-theme-background bg-opacity-80 backdrop-blur-md"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QuestForge ⚔️
            </h1>
          </div>
          <div className="hidden md:block">
            <nav className="flex items-center space-x-8">
              <a href="#features" className="text-theme-text-secondary hover:text-theme-primary transition-colors">Features</a>
              <a href="#howtouse" className="text-theme-text-secondary hover:text-theme-primary transition-colors">How to Use</a>
              <a href="#pricing" className="text-theme-text-secondary hover:text-theme-primary transition-colors">Pricing</a>
              <a href="#contact" className="text-theme-text-secondary hover:text-theme-primary transition-colors">Contact</a>
              <button
                onClick={onLoginClick}
                className="btn btn-secondary"
              >
                Login / Register
              </button>
            </nav>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-theme-text">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-theme-text-secondary hover:text-theme-primary hover:bg-theme-secondary">Features</a>
            <a href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-theme-text-secondary hover:text-theme-primary hover:bg-theme-secondary">Pricing</a>
            <a href="#contact" className="block px-3 py-2 rounded-md text-base font-medium text-theme-text-secondary hover:text-theme-primary hover:bg-theme-secondary">Contact</a>
            <button
              onClick={onLoginClick}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-theme-text-secondary hover:text-theme-primary hover:bg-theme-secondary"
            >
              Login / Register
            </button>
          </nav>
        </div>
      )}
    </motion.header>
  );
};

export default Header;
