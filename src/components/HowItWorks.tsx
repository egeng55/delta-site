"use client";

import { motion, easeOut } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Start a Conversation",
    description:
      "Simply tell Delta about your health goals, current habits, and what you want to achieve. No forms, just chat.",
  },
  {
    number: "02",
    title: "Delta Learns You",
    description:
      "As you interact, Delta builds a comprehensive understanding of your patterns, preferences, and what motivates you.",
  },
  {
    number: "03",
    title: "Get Personalized Guidance",
    description:
      "Receive tailored recommendations, check-ins, and insights that evolve as you progress on your journey.",
  },
  {
    number: "04",
    title: "Achieve Your Goals",
    description:
      "With consistent, adaptive support, you'll build lasting habits and see real, sustainable results.",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px", amount: 0.35 });

  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />

      <div className="max-w-5xl mx-auto px-8 relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span className="text-primary font-medium text-sm tracking-wider uppercase">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Simple Steps to a
            <br />
            <span className="text-primary">Healthier You</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div ref={ref} className="relative">
          {/* Connecting line */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 1.5, ease: easeOut }}
            className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary origin-top hidden md:block"
          />

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.2,
                  ease: easeOut,
                }}
                className="flex gap-8 items-start"
              >
                {/* Number circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.2 + 0.3,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="relative flex-shrink-0"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="text-white text-2xl font-bold">
                      {step.number}
                    </span>
                  </div>
                  {/* Glow effect */}
                  <motion.div
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                    className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10"
                  />
                </motion.div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.2 + 0.4 }}
                    className="text-2xl font-semibold mb-3"
                  >
                    {step.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.2 + 0.5 }}
                    className="text-muted text-lg leading-relaxed"
                  >
                    {step.description}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
