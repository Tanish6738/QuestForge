'use client';

import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Free',
    price: '0',
    features: [
      'Unlimited quests & goals',
      'XP & leveling system',
      'Achievements & rewards',
      'Community leaderboards',
      'Basic support',
    ],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '4.99',
    features: [
      'Everything in Free',
      'Advanced analytics',
      'Custom quest templates',
      'Priority support',
      'Early access to new features',
    ],
    highlight: true,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-theme-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">Simple, Transparent Pricing</h2>
          <p className="max-w-2xl mx-auto mt-4 text-lg text-theme-text-secondary">
            Start for free. Upgrade anytime for more power and features.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: idx * 0.15 }}
              className={`card-theme p-8 shadow-lg flex flex-col items-center border-2 ${plan.highlight ? 'border-theme-primary scale-105 z-10' : 'border-transparent'}`}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-extrabold mb-4">
                {plan.price === '0' ? 'Free' : `$${plan.price}/mo`}
              </div>
              <ul className="mb-6 space-y-2 text-theme-text-secondary">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-theme-primary">✔</span> {feature}
                  </li>
                ))}
              </ul>
              <button className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'} border border-theme-secondary px-4 py-2 rounded w-full`} disabled>
                {plan.price === '0' ? 'Current Plan' : 'Coming Soon'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
