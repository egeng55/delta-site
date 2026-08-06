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
              About Delta
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold mt-4 mb-6"
            >
              Building Personal
              <br />
              <span className="text-primary">Intelligence</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.2 }}
              className="text-muted text-lg leading-relaxed"
            >
              Delta is a personal intelligence system: an effort to connect context,
              memory, reasoning, action, and feedback without giving software more
              authority than its owner intended.
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
            <h2 className="text-2xl font-bold mb-6">Why Delta</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <p>
                AI can answer a question without understanding the larger situation.
                Personal intelligence requires more: relevant context, bounded state,
                testable hypotheses, useful next actions, and evidence about what
                actually helped.
              </p>
              <p>
                Health and behavior are early proving grounds because timing, feedback,
                uncertainty, and personal constraints are visible there. WHOOP is an
                early connector, and late caffeine is a bounded proof scenario. Neither
                defines the product.
              </p>
              <p>
                The current public product is a private preview with deliberately narrow
                capabilities. The longer-term goal is a trustworthy intelligence layer
                that helps its owner understand what matters, decide what to do next,
                and improve from outcomes across domains.
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
                  Build a personal intelligence system that is useful to its owner
                  before expanding its authority, audience, or commercial scope.
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
                  A personal intelligence layer that understands context, remembers
                  selectively, reasons over time, recommends actions, and learns from
                  outcomes under explicit owner control.
                </p>
              </motion.div>
            </div>
          </div>
        </ImageBackground>

        {/* Founders */}
        <div className="py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            className="max-w-4xl mx-auto px-8"
          >
            <p className="text-sm font-medium text-primary">Meet the Founders</p>
            <h2 className="mt-3 text-3xl font-semibold">Building from Ann Arbor, Michigan.</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="py-5">
                <h3 className="text-xl font-semibold">Eric Geng</h3>
                <p className="mt-2 text-muted">University of Michigan</p>
              </div>
              <div className="py-5">
                <h3 className="text-xl font-semibold">Rahib Malik</h3>
                <p className="mt-2 text-muted">University of Michigan</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
