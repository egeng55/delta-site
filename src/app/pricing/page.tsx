"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ImageBackground from "@/components/ImageBackground";

const tiers = [
  {
    name: "Starter",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for getting started with your health journey",
    features: [
      "Basic health tracking",
      "Daily check-ins",
      "Limited chat history (7 days)",
      "Community support",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: { monthly: 12, yearly: 99 },
    description: "For those serious about lasting results",
    features: [
      "Everything in Starter",
      "Unlimited chat history",
      "Advanced pattern recognition",
      "Personalized insights",
      "Priority support",
      "Export your data",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: { monthly: 29, yearly: 249 },
    description: "For families and small groups",
    features: [
      "Everything in Pro",
      "Up to 5 users",
      "Shared goals & challenges",
      "Admin dashboard",
      "Team analytics",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. No questions asked, no hidden fees.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and Apple Pay.",
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero with Background Image */}
        <ImageBackground
          src="/images/hero/coastal-wildflowers.jpg"
          alt="Pricing"
          overlayOpacity={80}
          gradient="both"
          priority
          className="min-h-[50vh] flex items-center justify-center"
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
              Pricing
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold mt-4 mb-6"
            >
              Simple, Transparent
              <br />
              <span className="text-primary">Pricing</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.2 }}
              className="text-muted text-lg"
            >
              Choose the plan that fits your needs. All plans include a 14-day free trial.
            </motion.p>

            {/* Billing toggle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-center gap-4 mt-8"
            >
              <span className={billingCycle === "monthly" ? "text-foreground" : "text-muted"}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative w-14 h-8 bg-border rounded-full p-1 transition-colors"
              >
                <motion.div
                  animate={{ x: billingCycle === "yearly" ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-6 h-6 bg-primary rounded-full"
                />
              </button>
              <span className={billingCycle === "yearly" ? "text-foreground" : "text-muted"}>
                Yearly
                <span className="ml-2 text-xs text-primary font-medium">Save 20%</span>
              </span>
            </motion.div>
          </motion.div>
        </ImageBackground>

        {/* Pricing cards */}
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.35 }}
                transition={{ delay: 0.15 + index * 0.08, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-3xl border ${
                  tier.highlighted
                    ? "bg-gradient-to-b from-primary/10 to-transparent border-primary/30"
                    : "bg-card border-border"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                <p className="text-muted text-sm mb-6">{tier.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold">
                    ${tier.price[billingCycle]}
                  </span>
                  {tier.price[billingCycle] > 0 && (
                    <span className="text-muted">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  )}
                </div>

                <motion.a
                  href="#"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`block w-full py-3 text-center rounded-xl font-medium mb-8 transition-colors ${
                    tier.highlighted
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "bg-border hover:bg-border/80"
                  }`}
                >
                  {tier.cta}
                </motion.a>

                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, amount: 0.35 }}
                      transition={{ delay: 0.25 + index * 0.05 + i * 0.03 }}
                      className="flex items-start gap-3 text-sm"
                    >
                      <svg
                        className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQs with Background */}
        <ImageBackground
          src="/images/hero/misty-village.jpg"
          alt="FAQs"
          overlayOpacity={90}
          gradient="both"
          className="py-20"
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            className="max-w-3xl mx-auto px-8"
          >
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.4 }}
                  transition={{ delay: index * 0.08 }}
                  className="p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border"
                >
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted text-sm">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </ImageBackground>
      </main>
      <Footer />
    </>
  );
}
