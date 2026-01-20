"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: "🧠",
    title: "Intelligent Memory",
    description:
      "Delta remembers your preferences, patterns, and progress over time, providing increasingly personalized guidance.",
  },
  {
    icon: "📊",
    title: "Pattern Recognition",
    description:
      "Advanced AI analyzes your habits to identify what works best for you and suggests optimizations.",
  },
  {
    icon: "💬",
    title: "Natural Conversations",
    description:
      "Chat naturally about your health goals. No complicated forms or rigid tracking systems.",
  },
  {
    icon: "🎯",
    title: "Adaptive Goals",
    description:
      "Your targets evolve with you. Delta adjusts recommendations based on your progress and feedback.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    description:
      "Your health data stays yours. End-to-end encryption ensures your information remains confidential.",
  },
  {
    icon: "⚡",
    title: "Real-time Insights",
    description:
      "Get instant feedback and suggestions based on your current state and recent activities.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px", amount: 0.35 });

  return (
    <section id="features" className="py-32 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm tracking-wider uppercase">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Everything You Need to
            <br />
            <span className="text-primary">Succeed</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Powerful features designed to make your health journey effortless
            and effective.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group p-8 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <motion.div
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl mb-6"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
