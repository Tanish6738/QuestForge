'use client';

import { motion } from 'framer-motion';
import { FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-theme-background border-t border-theme-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h3 className="text-xl font-bold">QuestForge</h3>
            <p className="text-theme-text-secondary">© 2025 QuestForge. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <motion.a whileHover={{ scale: 1.1 }} href="#" className="text-theme-text-secondary hover:text-theme-primary transition-colors">
              <FiTwitter size={24} />
            </motion.a>
            <motion.a whileHover={{ scale: 1.1 }} href="#" className="text-theme-text-secondary hover:text-theme-primary transition-colors">
              <FiGithub size={24} />
            </motion.a>
            <motion.a whileHover={{ scale: 1.1 }} href="#" className="text-theme-text-secondary hover:text-theme-primary transition-colors">
              <FiLinkedin size={24} />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
