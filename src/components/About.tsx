"use client";

import { motion, useScroll, useTransform, easeInOut } from "framer-motion";
import { useRef } from "react";

export default function About() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      id="about"
      ref={containerRef}
      className="py-32 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Visual */}
          <motion.div style={{ y }} className="relative">
            {/* Main card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ duration: 0.7 }}
              className="relative z-10 bg-gradient-to-br from-card to-background p-8 rounded-3xl border border-border shadow-2xl"
            >
              {/* Simulated chat interface */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-end"
                >
                  <div className="bg-primary text-white px-4 py-3 rounded-2xl rounded-tr-md max-w-[80%]">
                    I've been feeling tired lately and want to improve my energy
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-start"
                >
                  <div className="bg-border px-4 py-3 rounded-2xl rounded-tl-md max-w-[80%]">
                    I understand. Based on our previous conversations, I noticed
                    you've been sleeping less than 6 hours. Let's work on a sleep
                    optimization plan together.
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ delay: 0.7 }}
                  className="flex justify-end"
                >
                  <div className="bg-primary text-white px-4 py-3 rounded-2xl rounded-tr-md max-w-[80%]">
                    That sounds great, what should I start with?
                  </div>
                </motion.div>

                {/* Typing indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ delay: 0.9 }}
                  className="flex gap-1 px-4 py-3"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                      className="w-2 h-2 rounded-full bg-primary/60"
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: easeInOut }}
              className="absolute -top-8 -right-8 w-32 h-32 border border-primary/20 rounded-full"
            />
            <motion.div
              animate={{
                rotate: [360, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: easeInOut }}
              className="absolute -bottom-4 -left-4 w-24 h-24 border border-accent/20 rounded-full"
            />
          </motion.div>

          {/* Right - Content */}
          <motion.div style={{ opacity }}>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              className="text-primary font-medium text-sm tracking-wider uppercase"
            >
              About Delta
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mt-4 mb-6"
            >
              Your Health,{" "}
              <span className="text-primary">Understood</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ delay: 0.2 }}
              className="text-muted text-lg leading-relaxed mb-6"
            >
              We built Delta because we believe health guidance should be
              personal, adaptive, and accessible to everyone. Traditional apps
              treat you like a number. Delta treats you like a person.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ delay: 0.3 }}
              className="text-muted text-lg leading-relaxed mb-8"
            >
              By combining advanced AI with a deep understanding of behavioral
              science, Delta provides guidance that actually sticks. No
              judgement, just support.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-8"
            >
              {[
                { value: "2026", label: "Founded" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="text-3xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-muted text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
