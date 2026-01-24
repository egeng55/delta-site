"use client";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import ImageBackground from "@/components/ImageBackground";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero with Background Image */}
        <ImageBackground
          src="/images/hero/river-blooms.jpg"
          alt="About Delta"
          overlay="medium"

          priority
          className="min-h-[60vh] flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.45 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto px-8 pt-32 pb-20"
          >
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.1 }}
              className="text-primary font-medium text-sm tracking-wider uppercase"
            >
              About Us
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold mt-4 mb-6"
            >
              Making Health
              <br />
              <span className="text-primary">Personal</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.2 }}
              className="text-muted text-lg leading-relaxed"
            >
              We believe everyone deserves access to personalized health guidance.
              Delta combines cutting-edge AI with deep behavioral science to help
              you build lasting healthy habits.
            </motion.p>
          </motion.div>
        </ImageBackground>

        {/* Story section */}
        <div className="max-w-4xl mx-auto px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            className="p-8 bg-card rounded-3xl"
          >
            <h2 className="text-2xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <p>
                Delta started from a personal constraint, not a market thesis.
                While working in China at Geely Auto International's global AI research center on vision transformers, I was training seriously as a lifter in an environment that wasn't built for it. The cafeteria food was optimized for a typical local diet, not high-protein intake. To meet my nutrition needs, I walked daily to KFC and Starbucks, manually stripping chicken skin to control fat and piecing together meals through trial and error. I ran several kilometers each day to a small hotel gym because I didn't have a car, adapting my training to whatever equipment was available.
              </p>
              <p>
                I relied heavily on ChatGPT and search to manage nutrition, training, and recovery—but I kept running into the same fundamental problems. ChatGPT had no persistent memory. It forgot my goals, my diet, and my constraints unless I re-explained them. Its context window broke continuity. It had no real sense of time, so daily macros and patterns drifted. Long conversations degraded, hallucinations crept in, and restarting sessions meant rebuilding state from scratch.
                That friction revealed the real problem: health intelligence can't live inside a stateless chatbot or generic search tool. It needs persistent memory, temporal awareness, and the ability to reason over patterns across days, weeks, and months without being reminded.
              </p>
              <p>
                Delta was born as a dedicated health intelligence system—one that maintains continuity, understands personal constraints, tracks change over time, and generates insights from real patterns rather than one-off prompts. Not a generic health app, and not a chatbot wrapper, but a system designed from the ground up to support real life as it happens.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Mission & Vision with Background */}
        <ImageBackground
          src="/images/hero/willow-water.jpg"
          alt="Our mission"
          overlay="heavy"

          className="py-20"
        >
          <div className="max-w-4xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                className="p-8 bg-card/80 backdrop-blur-sm rounded-3xl border border-border"
              >
                <h3 className="text-xl font-bold mb-4">Our Mission</h3>
                <p className="text-muted leading-relaxed">
                  To make personalized health guidance accessible to everyone, helping
                  people build sustainable habits that last a lifetime.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                className="p-8 bg-card/80 backdrop-blur-sm rounded-3xl border border-border"
              >
                <h3 className="text-xl font-bold mb-4">Our Vision</h3>
                <p className="text-muted leading-relaxed">
                  A world where everyone has a personal health companion that understands
                  them deeply and guides them toward their best self.
                </p>
              </motion.div>
            </div>
          </div>
        </ImageBackground>

        {/* Stats */}
        <div className="py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            className="max-w-4xl mx-auto px-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-card rounded-3xl border border-border">
              {[
                { value: "10k+", label: "Active Users" },
                { value: "500k+", label: "Conversations" },
                { value: "95%", label: "Satisfaction" },
                { value: "2023", label: "Founded" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.4 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-muted text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
