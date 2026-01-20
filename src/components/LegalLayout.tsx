"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface LegalSection {
  title: string;
  content: string | ReactNode;
}

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export default function LegalLayout({ title, lastUpdated, sections }: LegalLayoutProps) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto px-8 mb-12"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted"
          >
            Last updated: {lastUpdated}
          </motion.p>
        </motion.div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-8">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="p-8 bg-card rounded-2xl border border-border"
              >
                <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                <div className="text-muted leading-relaxed prose prose-sm max-w-none">
                  {typeof section.content === "string" ? (
                    <p>{section.content}</p>
                  ) : (
                    section.content
                  )}
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
