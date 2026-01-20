"use client";

import { motion, easeInOut } from "framer-motion";
import Navigation from "@/components/Navigation";
import ChatDemo from "@/components/ChatDemo";
import Footer from "@/components/Footer";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollSection";

const features = [
  {
    icon: "🧠",
    title: "Intelligent Memory",
    description: "Delta remembers your preferences, patterns, and progress over time.",
  },
  {
    icon: "📊",
    title: "Pattern Recognition",
    description: "Advanced AI analyzes your habits to identify what works best for you.",
  },
  {
    icon: "💬",
    title: "Natural Conversations",
    description: "Chat naturally about your health goals. No complicated forms.",
  },
  {
    icon: "🎯",
    title: "Adaptive Goals",
    description: "Your targets evolve with you based on your progress and feedback.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    description: "Your health data stays yours with end-to-end encryption.",
  },
  {
    icon: "⚡",
    title: "Real-time Insights",
    description: "Get instant feedback and suggestions based on your current state.",
  },
];

const steps = [
  {
    number: "01",
    title: "Start a Conversation",
    description: "Tell Delta about your health goals and what you want to achieve.",
  },
  {
    number: "02",
    title: "Delta Learns You",
    description: "As you interact, Delta builds understanding of your patterns and preferences.",
  },
  {
    number: "03",
    title: "Get Personalized Guidance",
    description: "Receive tailored recommendations that evolve as you progress.",
  },
  {
    number: "04",
    title: "Achieve Your Goals",
    description: "Build lasting habits and see real, sustainable results.",
  },
];

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        {/* Hero with Chat */}
        <section id="home" className="min-h-screen flex flex-col items-center justify-center py-32 px-8 relative overflow-hidden">
          {/* Animated background gradients */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: easeInOut,
            }}
            className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: easeInOut,
            }}
            className="absolute bottom-1/4 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          />

          {/* Header content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 relative z-10"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.6 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              Your AI Health
              <br />
              <span className="text-primary">Companion</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.6 }}
              transition={{ delay: 0.15 }}
              className="text-muted text-lg max-w-xl mx-auto"
            >
              Ask Delta anything about nutrition, fitness, sleep, or building healthy habits.
            </motion.p>
          </motion.div>

          {/* Chat interface */}
          <div className="w-full max-w-3xl relative z-10">
            <ChatDemo />
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.8 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: easeInOut }}
              className="w-6 h-10 border-2 border-muted/30 rounded-full flex justify-center pt-2"
            >
              <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" />
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

          <div className="max-w-6xl mx-auto px-8">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="text-primary font-medium text-sm tracking-wider uppercase">
                  Features
                </span>
                <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                  Everything You Need to
                  <br />
                  <span className="text-primary">Succeed</span>
                </h2>
                <p className="text-muted text-lg max-w-2xl mx-auto">
                  Powerful features designed to make your health journey effortless and effective.
                </p>
              </div>
            </ScrollReveal>

            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <StaggerItem key={feature.title}>
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="group p-8 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all h-full"
                  >
                    <motion.div
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
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />

          <div className="max-w-5xl mx-auto px-8 relative">
            <ScrollReveal>
              <div className="text-center mb-20">
                <span className="text-primary font-medium text-sm tracking-wider uppercase">
                  How It Works
                </span>
                <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                  Simple Steps to a
                  <br />
                  <span className="text-primary">Healthier You</span>
                </h2>
              </div>
            </ScrollReveal>

            <div className="space-y-12">
              {steps.map((step, index) => (
                <ScrollReveal
                  key={step.number}
                  delay={index * 0.1}
                  direction={index % 2 === 0 ? "left" : "right"}
                >
                  <div className="flex gap-8 items-start">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="relative flex-shrink-0"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30">
                        <span className="text-white text-2xl font-bold">
                          {step.number}
                        </span>
                      </div>
                    </motion.div>

                    <div className="flex-1 pt-2">
                      <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                      <p className="text-muted text-lg leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Visual */}
              <ScrollReveal direction="left">
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative z-10 bg-gradient-to-br from-card to-background p-8 rounded-3xl border border-border shadow-2xl"
                  >
                    {/* Simulated chat interface */}
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <div className="bg-primary text-white px-4 py-3 rounded-2xl rounded-tr-md max-w-[80%]">
                          I've been feeling tired lately and want to improve my energy
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-border px-4 py-3 rounded-2xl rounded-tl-md max-w-[80%]">
                          I understand. Based on our previous conversations, I noticed
                          you've been sleeping less than 6 hours. Let's work on a sleep
                          optimization plan together.
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-primary text-white px-4 py-3 rounded-2xl rounded-tr-md max-w-[80%]">
                          That sounds great, what should I start with?
                        </div>
                      </div>
                      {/* Typing indicator */}
                      <div className="flex gap-1 px-4 py-3">
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
                      </div>
                    </div>
                  </motion.div>

                  {/* Decorative elements */}
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: easeInOut }}
                    className="absolute -top-8 -right-8 w-32 h-32 border border-primary/20 rounded-full"
                  />
                  <motion.div
                    animate={{ rotate: [360, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: easeInOut }}
                    className="absolute -bottom-4 -left-4 w-24 h-24 border border-accent/20 rounded-full"
                  />
                </div>
              </ScrollReveal>

              {/* Right - Content */}
              <ScrollReveal direction="right">
                <div>
                  <span className="text-primary font-medium text-sm tracking-wider uppercase">
                    About Delta
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                    Your Health, <span className="text-primary">Understood</span>
                  </h2>
                  <p className="text-muted text-lg leading-relaxed mb-6">
                    We built Delta because we believe health guidance should be
                    personal, adaptive, and accessible to everyone. Traditional apps
                    treat you like a number. Delta treats you like a person.
                  </p>
                  <p className="text-muted text-lg leading-relaxed mb-8">
                    By combining advanced AI with a deep understanding of behavioral
                    science, Delta provides guidance that actually sticks.
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-8">
                    {[
                      { value: "10k+", label: "Active Users" },
                      { value: "95%", label: "Satisfaction" },
                      { value: "24/7", label: "Support" },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="text-3xl font-bold text-primary">
                          {stat.value}
                        </div>
                        <div className="text-muted text-sm">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="download" className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-accent opacity-90" />

          {/* Animated shapes */}
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: easeInOut }}
            className="absolute top-10 left-10 w-64 h-64 border border-white/10 rounded-full"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: easeInOut }}
            className="absolute bottom-10 right-10 w-48 h-48 border border-white/10 rounded-full"
          />

          <ScrollReveal className="max-w-4xl mx-auto px-8 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Transform
              <br />
              Your Health?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of people who have already started their journey with
              Delta. Your future self will thank you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-shadow"
              >
                Get Started Free
              </motion.a>
              <motion.a
                href="/pricing"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                View Pricing
              </motion.a>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure & Private
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free 14-Day Trial
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Cancel Anytime
              </span>
            </div>
          </ScrollReveal>
        </section>

        <Footer />
      </main>
    </>
  );
}
