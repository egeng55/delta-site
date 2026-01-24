"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ImageBackground from "@/components/ImageBackground";

const team = [
  {
    name: "Eric Geng",
    affiliation: "University of Michigan",
  },
  {
    name: "Rahib Malik",
    affiliation: "University of Michigan",
  },
];

const values = [
  {
    title: "User First",
    description: "Every decision we make starts with how it impacts the people we serve.",
  },
  {
    title: "Science-Backed",
    description: "We ground our guidance in peer-reviewed research and medical expertise.",
  },
  {
    title: "Privacy by Design",
    description: "Your health data is sacred. We build with privacy as a core principle.",
  },
  {
    title: "Continuous Learning",
    description: "We're always improving, both as a product and as individuals.",
  },
];

export default function TeamPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero with Background Image */}
        <ImageBackground
          src="/images/hero/mountain-moon.jpg"
          alt="Our team"
          overlay="medium"

          priority
          className="min-h-[55vh] flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.45 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto px-8 pt-32 pb-16"
          >
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.1 }}
              className="text-primary font-medium text-sm tracking-wider uppercase"
            >
              Founders
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold mt-4 mb-6"
            >
              Meet the <span className="text-primary">Founders</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.2 }}
              className="text-muted text-lg"
            >
              Delta is built by Eric Geng and Rahib Malik from the University of Michigan,
              focused on making health guidance personal and accessible.
            </motion.p>
          </motion.div>
        </ImageBackground>

        {/* Team grid */}
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="grid sm:grid-cols-2 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.35 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="group p-6 bg-card rounded-3xl"
              >
                {/* Avatar placeholder */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6"
                >
                  <span className="text-3xl font-bold text-primary">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </motion.div>

                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-primary text-sm font-medium mb-2">{member.affiliation}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Values section with Background */}
        <ImageBackground
          src="/images/hero/waterfall-stones.jpg"
          alt="Our values"
          overlay="heavy"

          className="py-20"
        >
          <div className="max-w-6xl mx-auto px-8">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.35 }}
              className="text-3xl font-bold text-center mb-12"
            >
              Our Values
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border"
                >
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ImageBackground>

        {/* Join us CTA */}
        <div className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            className="max-w-3xl mx-auto px-8 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
            <p className="text-muted mb-8">
              We're always looking for passionate people who want to make a difference
              in how people approach their health.
            </p>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/25"
            >
              Get in Touch
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </motion.a>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
