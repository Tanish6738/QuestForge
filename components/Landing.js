'use client';

import Header from './Landing/Header';
import Hero from './Landing/Hero';
import Features from './Landing/Features';
import Footer from './Landing/Footer';
import HowToUse from './Landing/HowToUse';
import Pricing from './Landing/Pricing';
import Contact from './Landing/Contact';

const Landing = ({ onLoginClick }) => {
  return (
    <div className="bg-theme-background text-theme-text">
      <Header onLoginClick={onLoginClick} />
      <main>
        <Hero onLoginClick={onLoginClick} />
        <Features />
        <HowToUse/>
        <Pricing/>
        <Contact/>
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
