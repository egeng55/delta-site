"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollSection";

const researchAreas = [
  {
    title: "Behavioral Science",
    description: "Understanding how habits form and how to create lasting change through evidence-based behavioral interventions.",
    image: "/images/hero/waterfall-stones.jpg",
  },
  {
    title: "AI & Machine Learning",
    description: "Developing adaptive algorithms that learn individual patterns to provide personalized health guidance.",
    image: "/images/hero/aerial-glaciers.jpg",
  },
  {
    title: "Nutritional Science",
    description: "Researching the complex relationships between diet, metabolism, and long-term health outcomes.",
    image: "/images/hero/coastal-wildflowers.jpg",
  },
  {
    title: "Sleep & Recovery",
    description: "Studying sleep architecture and recovery patterns to optimize rest and enhance daily performance.",
    image: "/images/hero/sunset-shore.jpg",
  },
];

const publications = [
  {
    title: "Personalized Health Interventions Through Conversational AI",
    journal: "Nature Digital Medicine",
    year: "2025",
    abstract: "Exploring how natural language interfaces can improve adherence to health recommendations.",
  },
  {
    title: "Adaptive Goal Setting in Digital Health Applications",
    journal: "Journal of Medical Internet Research",
    year: "2025",
    abstract: "A study on dynamic goal adjustment based on user behavior and physiological feedback.",
  },
  {
    title: "Memory-Augmented AI for Longitudinal Health Tracking",
    journal: "NPJ Digital Medicine",
    year: "2024",
    abstract: "Building AI systems that maintain context over extended timeframes for better health insights.",
  },
];

export default function ResearchPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/images/hero/lake-sunset.jpg"
              alt="Research background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 text-center max-w-4xl mx-auto px-8 pt-32 pb-20"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-primary font-medium text-sm tracking-wider uppercase"
            >
              Our Research
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-5xl md:text-7xl font-bold mt-4 mb-6"
            >
              Science-Driven
              <br />
              <span className="text-primary">Health Innovation</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted max-w-2xl mx-auto"
            >
              At Delta, we combine cutting-edge AI research with behavioral science
              to create health tools that actually work for real people.
            </motion.p>
          </motion.div>
        </section>

        {/* Research Philosophy */}
        <section className="py-24 relative">
          <div className="max-w-6xl mx-auto px-8">
            <ScrollReveal>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <span className="text-primary font-medium text-sm tracking-wider uppercase">
                    Our Approach
                  </span>
                  <h2 className="text-4xl font-bold mt-4 mb-6">
                    Research That <span className="text-primary">Matters</span>
                  </h2>
                  <p className="text-muted text-lg leading-relaxed mb-6">
                    We believe that meaningful health improvement comes from understanding
                    the whole person—not just their data points. Our research focuses on
                    the intersection of technology, psychology, and human behavior.
                  </p>
                  <p className="text-muted text-lg leading-relaxed">
                    Every feature in Delta is backed by rigorous research and continuously
                    validated through real-world outcomes. We publish our findings to
                    advance the field and maintain transparency with our users.
                  </p>
                </div>
                <div className="relative h-[400px] rounded-3xl overflow-hidden">
                  <Image
                    src="/images/hero/aerial-ice.jpg"
                    alt="Nature and science"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Research Areas */}
        <section className="py-24 bg-card/50">
          <div className="max-w-6xl mx-auto px-8">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="text-primary font-medium text-sm tracking-wider uppercase">
                  Focus Areas
                </span>
                <h2 className="text-4xl font-bold mt-4 mb-6">
                  What We <span className="text-primary">Study</span>
                </h2>
                <p className="text-muted text-lg max-w-2xl mx-auto">
                  Our multidisciplinary research spans several key domains essential
                  to building effective health technology.
                </p>
              </div>
            </ScrollReveal>

            <StaggerContainer className="grid md:grid-cols-2 gap-8">
              {researchAreas.map((area) => (
                <StaggerItem key={area.title}>
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="group relative h-[300px] rounded-2xl overflow-hidden"
                  >
                    <Image
                      src={area.image}
                      alt={area.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-semibold mb-2">{area.title}</h3>
                      <p className="text-muted text-sm">{area.description}</p>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Publications */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-8">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="text-primary font-medium text-sm tracking-wider uppercase">
                  Publications
                </span>
                <h2 className="text-4xl font-bold mt-4 mb-6">
                  Recent <span className="text-primary">Research</span>
                </h2>
                <p className="text-muted text-lg max-w-2xl mx-auto">
                  Selected publications from our research team contributing to
                  the advancement of digital health science.
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-6">
              {publications.map((pub, index) => (
                <ScrollReveal key={pub.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ x: 8 }}
                    className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-semibold">{pub.title}</h3>
                      <span className="text-primary text-sm font-medium shrink-0">{pub.year}</span>
                    </div>
                    <p className="text-primary/80 text-sm mb-2">{pub.journal}</p>
                    <p className="text-muted text-sm">{pub.abstract}</p>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Team/Collaboration CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/hero/lake-sunset.jpg"
              alt="Collaboration background"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-background/85" />
          </div>

          <ScrollReveal className="max-w-4xl mx-auto px-8 relative z-10">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-6">
                Collaborate With Us
              </h2>
              <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
                We're always looking to partner with researchers, institutions, and
                organizations who share our mission to improve human health through
                technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/25"
                >
                  Get in Touch
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-xl font-medium hover:bg-card transition-colors"
                >
                  View All Publications
                </motion.a>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <Footer />
      </main>
    </>
  );
}
