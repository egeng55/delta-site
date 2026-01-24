"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function DeltaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M229.211 20C240.758 0 269.626 0 281.173 20L482.32 368C493.867 388 479.434 413 456.339 413H54.0447C30.9507 413 16.517 388 28.064 368L229.211 20Z" fill="#0E0B2B"/>
      <path d="M231.809 21.5C242.12 3.6407 267.778 3.50083 278.329 21.0811L278.575 21.5L479.722 369.5C490.115 387.5 477.124 410 456.34 410H54.0447C33.4225 410 20.4733 387.85 30.4226 369.923L30.6619 369.5L231.809 21.5Z" stroke="white" strokeWidth="6"/>
      <path d="M229.147 113.486C240.863 94.459 268.522 94.459 280.238 113.486L411.741 326.77C424.049 346.758 409.669 372.5 386.195 372.5H123.189C99.7155 372.5 85.3356 346.758 97.6433 326.77L229.147 113.486Z" fill="url(#paint0_linear_insights)"/>
      <path d="M229.449 186.309C241.256 167.923 268.128 167.923 279.935 186.309L352.282 298.539C365.104 318.505 350.767 344.75 327.039 344.75H182.346C158.617 344.75 144.281 318.506 157.102 298.539L229.449 186.309Z" fill="url(#paint1_linear_insights)"/>
      <defs>
        <linearGradient id="paint0_linear_insights" x1="254.692" y1="72" x2="254.692" y2="489" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E0B2B"/>
          <stop offset="1" stopColor="#2D2491"/>
        </linearGradient>
        <linearGradient id="paint1_linear_insights" x1="254.692" y1="147" x2="254.692" y2="416" gradientUnits="userSpaceOnUse">
          <stop offset="0.139423" stopColor="#0E0B2B"/>
          <stop offset="0.4375" stopColor="#2D2491"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const { user, access, isLoading, logout } = useAuth();

  // Redirect if not logged in or no premium access
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!access?.hasPremiumAccess) {
        router.push("/pricing");
      }
    }
  }, [user, access, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !access?.hasPremiumAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <DeltaLogo className="w-10 h-10" />
            <span className="text-xl font-bold">Delta</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/account" className="text-muted hover:text-foreground transition-colors">
              Account
            </Link>
            <button
              onClick={handleLogout}
              className="text-muted hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Main content - Empty State */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-primary/10 flex items-center justify-center"
          >
            <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-4"
          >
            No Insights Yet
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted text-lg max-w-md mx-auto mb-12"
          >
            Start chatting with Delta about your nutrition, fitness, sleep, and daily habits to unlock personalized health insights.
          </motion.p>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {[
              {
                step: "1",
                title: "Chat with Delta",
                description: "Tell Delta about your meals, workouts, sleep, and how you're feeling.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Build Your Profile",
                description: "Delta learns your patterns, goals, and preferences over time.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Get Insights",
                description: "Receive personalized analysis and recommendations based on your data.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <div className="text-xs text-primary font-medium mb-1">Step {item.step}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-muted text-sm">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8"
          >
            <h2 className="text-xl font-bold mb-2">Ready to Get Started?</h2>
            <p className="text-muted mb-6 max-w-lg mx-auto">
              Open the Delta app on your phone and start a conversation. Your insights will appear here as Delta learns about you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="https://apps.apple.com/app/delta"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
                Open Delta App
              </motion.a>
              <Link href="/dashboard">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border rounded-xl font-medium hover:bg-border/50 transition-colors"
                >
                  Back to Dashboard
                </motion.span>
              </Link>
            </div>
          </motion.div>

          {/* What you'll see */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16"
          >
            <h3 className="text-lg font-semibold mb-6">What You'll Unlock</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Health Score", icon: "heart" },
                { label: "Sleep Analysis", icon: "moon" },
                { label: "Nutrition Tracking", icon: "chart" },
                { label: "Recommendations", icon: "lightbulb" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + index * 0.05 }}
                  className="bg-card/50 rounded-xl border border-border/50 p-4 text-center"
                >
                  <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-border/50 flex items-center justify-center text-muted">
                    {item.icon === "heart" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                    {item.icon === "moon" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    {item.icon === "chart" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    {item.icon === "lightbulb" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-muted">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
