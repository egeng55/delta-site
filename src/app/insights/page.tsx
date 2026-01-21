"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Mock data - in production, this would come from the API
const mockInsights = {
  overview: {
    healthScore: 78,
    trend: "improving",
    lastUpdated: "2 hours ago",
  },
  patterns: [
    {
      title: "Sleep Quality",
      value: "7.2 hrs avg",
      change: "+12%",
      positive: true,
      description: "Your sleep duration has improved over the past 2 weeks. Consistent bedtime is helping.",
    },
    {
      title: "Activity Level",
      value: "8,420 steps",
      change: "-5%",
      positive: false,
      description: "Slightly below your usual activity. Consider adding a short walk after lunch.",
    },
    {
      title: "Nutrition Balance",
      value: "82% on track",
      change: "+8%",
      positive: true,
      description: "Protein intake has been consistent. Fiber could be increased slightly.",
    },
    {
      title: "Recovery",
      value: "Good",
      change: "stable",
      positive: true,
      description: "HRV indicates good recovery. Your rest days are well-timed.",
    },
  ],
  recommendations: [
    {
      priority: "high",
      title: "Hydration Reminder",
      description: "Your water intake drops significantly in the afternoon. Try setting hourly reminders.",
    },
    {
      priority: "medium",
      title: "Evening Routine",
      description: "Screen time after 9pm correlates with lower sleep quality. Consider a wind-down routine.",
    },
    {
      priority: "low",
      title: "Weekend Activity",
      description: "Your weekend activity is 40% lower than weekdays. A Saturday morning walk could help.",
    },
  ],
  weeklyTrends: [
    { day: "Mon", score: 72 },
    { day: "Tue", score: 75 },
    { day: "Wed", score: 78 },
    { day: "Thu", score: 74 },
    { day: "Fri", score: 80 },
    { day: "Sat", score: 76 },
    { day: "Sun", score: 78 },
  ],
};

export default function InsightsPage() {
  const router = useRouter();
  const { user, access, isLoading, logout } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "quarter">("week");

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

  const maxScore = Math.max(...mockInsights.weeklyTrends.map(d => d.score));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/delta-logo.svg"
              alt="Delta"
              width={40}
              height={40}
              className="rounded-xl"
            />
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

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Health Insights</h1>
              <p className="text-muted">
                Personalized analysis based on your data. Last updated {mockInsights.overview.lastUpdated}.
              </p>
            </div>
            <div className="flex gap-2">
              {(["week", "month", "quarter"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTimeframe === tf
                      ? "bg-primary text-white"
                      : "bg-card text-muted hover:text-foreground"
                  }`}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Health Score Overview */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1 bg-card rounded-2xl border border-border p-8 text-center"
            >
              <p className="text-muted text-sm mb-4">Overall Health Score</p>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-border"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(mockInsights.overview.healthScore / 100) * 352} 352`}
                    className="text-primary"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold">{mockInsights.overview.healthScore}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-sm font-medium">Improving trend</span>
              </div>
            </motion.div>

            {/* Weekly Trend Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
            >
              <h3 className="font-semibold mb-6">Weekly Trend</h3>
              <div className="flex items-end justify-between gap-2 h-40">
                {mockInsights.weeklyTrends.map((day, index) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.score / maxScore) * 100}%` }}
                      transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                      className="w-full bg-primary/20 rounded-t-lg relative min-h-[20px]"
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                        style={{ height: `${(day.score / maxScore) * 100}%` }}
                      />
                    </motion.div>
                    <span className="text-xs text-muted">{day.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Pattern Cards */}
          <h2 className="text-xl font-bold mb-4">Key Patterns</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {mockInsights.patterns.map((pattern, index) => (
              <motion.div
                key={pattern.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{pattern.title}</h3>
                    <p className="text-2xl font-bold mt-1">{pattern.value}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-sm font-medium ${
                      pattern.positive
                        ? "bg-green-500/10 text-green-500"
                        : "bg-orange-500/10 text-orange-500"
                    }`}
                  >
                    {pattern.change}
                  </span>
                </div>
                <p className="text-muted text-sm">{pattern.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Recommendations */}
          <h2 className="text-xl font-bold mb-4">Personalized Recommendations</h2>
          <div className="space-y-4 mb-8">
            {mockInsights.recommendations.map((rec, index) => (
              <motion.div
                key={rec.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 flex gap-4"
              >
                <div
                  className={`w-2 rounded-full flex-shrink-0 ${
                    rec.priority === "high"
                      ? "bg-red-500"
                      : rec.priority === "medium"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{rec.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        rec.priority === "high"
                          ? "bg-red-500/10 text-red-500"
                          : rec.priority === "medium"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-muted text-sm">{rec.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Get Real-Time Insights</h2>
            <p className="text-muted mb-6 max-w-lg mx-auto">
              Connect the Delta mobile app to sync your health data and receive personalized guidance throughout the day.
            </p>
            <Link href="/dashboard">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium"
              >
                Back to Dashboard
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
