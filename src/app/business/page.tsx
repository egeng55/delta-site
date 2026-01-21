"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ImageBackground from "@/components/ImageBackground";

const coreCapabilities = [
  {
    title: "Longitudinal Modeling",
    description: "Continuous learning across extended timeframes, building context that compounds over weeks and months rather than resetting with each session.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title: "Pattern Extraction",
    description: "Automated identification of behavioral signatures, temporal rhythms, and correlational structures from heterogeneous input streams.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Confidence-Weighted Signals",
    description: "Probabilistic reasoning that surfaces insights with calibrated uncertainty, enabling appropriate human-in-the-loop decision boundaries.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Tiered Recommendations",
    description: "Adaptive intervention logic that calibrates suggestion intensity based on user context, historical responsiveness, and domain constraints.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
];

const industries = [
  {
    name: "Corporate Wellness",
    description: "Deploy personalized health intelligence across employee populations with aggregate analytics and privacy-preserving individual guidance.",
    useCases: ["Benefits optimization", "Preventive care programs", "Engagement analytics"],
  },
  {
    name: "Insurance & Risk",
    description: "Integrate behavioral signals into underwriting models and policyholder engagement with actuarially-relevant pattern detection.",
    useCases: ["Risk stratification", "Claims prediction", "Member retention"],
  },
  {
    name: "Performance Coaching",
    description: "Equip coaches with longitudinal athlete insights, recovery modeling, and adaptive training recommendations.",
    useCases: ["Load management", "Recovery optimization", "Performance forecasting"],
  },
  {
    name: "Clinical Research",
    description: "Capture real-world evidence through continuous patient engagement with structured data extraction and cohort analytics.",
    useCases: ["Trial recruitment", "Adherence monitoring", "Outcome tracking"],
  },
  {
    name: "Population Health",
    description: "Surface population-level patterns and intervention opportunities across diverse demographic segments.",
    useCases: ["Health equity analysis", "Resource allocation", "Program evaluation"],
  },
  {
    name: "Digital Therapeutics",
    description: "Build adaptive intervention protocols that personalize based on individual response patterns and engagement trajectories.",
    useCases: ["Treatment personalization", "Efficacy prediction", "Dosing optimization"],
  },
];

const integrations = [
  {
    category: "Data Sources",
    items: ["Wearable devices", "EHR systems", "Lab results", "Genomic data", "Environmental sensors"],
  },
  {
    category: "Interfaces",
    items: ["REST APIs", "GraphQL", "Webhooks", "SDK libraries", "FHIR compliance"],
  },
  {
    category: "Outputs",
    items: ["Dashboard embeds", "Alert systems", "Report generation", "Model exports", "Analytics pipelines"],
  },
];

export default function BusinessPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero */}
        <ImageBackground
          src="/images/hero/aerial-glaciers.jpg"
          alt="Delta for Business"
          overlayOpacity={80}

          priority
          className="min-h-[70vh] flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto px-8 pt-32 pb-20"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-primary font-medium text-sm tracking-wider uppercase"
            >
              For Businesses
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold mt-4 mb-6"
            >
              Health Intelligence
              <br />
              <span className="text-primary">Infrastructure</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted max-w-2xl mx-auto"
            >
              Delta's inference engine transforms longitudinal health data into actionable
              intelligence—deployable across wellness, insurance, research, and enterprise contexts.
            </motion.p>
          </motion.div>
        </ImageBackground>

        {/* Core Engine */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-primary font-medium text-sm tracking-wider uppercase">
                Core Technology
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
                The Inference Engine
              </h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                Built on years of research in longitudinal health modeling, Delta's core
                architecture generalizes across domains while maintaining individual precision.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {coreCapabilities.map((capability, index) => (
                <motion.div
                  key={capability.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 bg-card rounded-2xl border border-border"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {capability.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{capability.title}</h3>
                  <p className="text-muted leading-relaxed">{capability.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture Diagram Section */}
        <ImageBackground
          src="/images/hero/ocean-mountains.jpg"
          alt="Architecture"
          overlayOpacity={92}

          className="py-24"
        >
          <div className="max-w-5xl mx-auto px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Modular Architecture</h2>
              <p className="text-muted max-w-2xl mx-auto">
                Purpose-built for extensibility. Integrate Delta's intelligence layer
                with existing infrastructure through well-documented APIs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card/80 backdrop-blur-sm rounded-3xl border border-border p-8 md:p-12"
            >
              <div className="grid md:grid-cols-3 gap-8">
                {integrations.map((group, index) => (
                  <motion.div
                    key={group.category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                  >
                    <h3 className="font-semibold text-primary mb-4">{group.category}</h3>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-muted">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </ImageBackground>

        {/* Industry Applications */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-primary font-medium text-sm tracking-wider uppercase">
                Applications
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
                Cross-Industry Deployment
              </h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                The same inference primitives that power personal health guidance
                generalize to population-scale analytics and domain-specific applications.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industries.map((industry, index) => (
                <motion.div
                  key={industry.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors group"
                >
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {industry.name}
                  </h3>
                  <p className="text-muted text-sm mb-4 leading-relaxed">
                    {industry.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {industry.useCases.map((useCase) => (
                      <span
                        key={useCase}
                        className="text-xs px-2 py-1 bg-background rounded-md text-muted"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="py-24 bg-card/30">
          <div className="max-w-5xl mx-auto px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-primary font-medium text-sm tracking-wider uppercase">
                  Data Governance
                </span>
                <h2 className="text-3xl font-bold mt-4 mb-6">
                  Privacy-First Architecture
                </h2>
                <p className="text-muted leading-relaxed mb-6">
                  Enterprise deployments require rigorous data handling. Delta's architecture
                  supports on-premise inference, federated learning configurations, and
                  granular access controls—ensuring sensitive health data never leaves
                  designated boundaries.
                </p>
                <ul className="space-y-3">
                  {[
                    "SOC 2 Type II compliance pathway",
                    "HIPAA-ready data handling",
                    "Configurable data retention policies",
                    "Audit logging and access controls",
                    "Optional on-premise deployment",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-3xl border border-border p-8"
              >
                <h3 className="font-semibold mb-6">Deployment Options</h3>
                <div className="space-y-4">
                  {[
                    {
                      title: "Cloud (Multi-tenant)",
                      description: "Fastest deployment with isolated tenant data and shared infrastructure efficiency.",
                    },
                    {
                      title: "Cloud (Dedicated)",
                      description: "Single-tenant instances with dedicated compute and enhanced SLAs.",
                    },
                    {
                      title: "Hybrid",
                      description: "Sensitive inference on-premise with cloud analytics and model updates.",
                    },
                    {
                      title: "On-Premise",
                      description: "Full deployment within your infrastructure for maximum data control.",
                    },
                  ].map((option) => (
                    <div key={option.title} className="p-4 bg-background rounded-xl">
                      <h4 className="font-medium text-sm mb-1">{option.title}</h4>
                      <p className="text-muted text-xs">{option.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">
                Explore Integration Potential
              </h2>
              <p className="text-muted mb-8 max-w-xl mx-auto">
                We work with organizations exploring health intelligence applications
                across wellness, insurance, research, and enterprise contexts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-medium"
                >
                  Schedule a Conversation
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.a>
                <motion.a
                  href="/research"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-xl font-medium hover:bg-card transition-colors"
                >
                  View Research
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
