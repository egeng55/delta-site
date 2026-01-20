"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.45 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto px-8 mb-20"
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

        {/* Story section */}
        <div className="max-w-4xl mx-auto px-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            className="p-8 bg-card rounded-3xl"
          >
            <h2 className="text-2xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <p>
                Delta started with a simple observation: traditional health apps treat
                everyone the same. They give you generic advice, rigid tracking systems,
                and one-size-fits-all goals. But health is deeply personal.
              </p>
              <p>
                We founded Delta to change that. By combining advanced AI with a
                conversational interface, we created a health companion that actually
                understands you—your patterns, your preferences, your life.
              </p>
              <p>
                Our team includes engineers from Google and Spotify, doctors from Stanford,
                and designers from Apple. We're united by a belief that technology should
                adapt to people, not the other way around.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Mission & Vision */}
        <div className="max-w-4xl mx-auto px-8 mb-20">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              className="p-8 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl"
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
              className="p-8 bg-gradient-to-br from-accent/10 to-transparent rounded-3xl"
            >
              <h3 className="text-xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted leading-relaxed">
                A world where everyone has a personal health companion that understands
                them deeply and guides them toward their best self.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
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
      </main>
      <Footer />
    </>
  );
}
