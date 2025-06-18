'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would typically send the form data to your backend or an email service
  };

  return (
    <section id="contact" className="py-20 bg-theme-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">Contact Us</h2>
          <p className="max-w-xl mx-auto mt-4 text-lg text-theme-text-secondary">
            Have questions, feedback, or partnership ideas? We&apos;d love to hear from you!
          </p>
        </div>
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="card-theme p-8 shadow-lg space-y-6"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-theme-primary text-lg font-semibold text-center"
            >
              Thank you for reaching out! We&apos;ll get back to you soon.
            </motion.div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-theme-text-secondary">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-theme w-full"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-theme-text-secondary">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-theme w-full"
                  placeholder="you@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-theme-text-secondary">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className="input-theme w-full min-h-[120px]"
                  placeholder="How can we help you?"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full px-4 py-2 rounded ">Send Message</button>
            </>
          )}
        </motion.form>
      </div>
    </section>
  );
};

export default Contact;
