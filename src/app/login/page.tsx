"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ImageBackground from "@/components/ImageBackground";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading, access } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // Route based on subscription status
      if (access?.hasPremiumAccess) {
        router.push("/dashboard");
      } else {
        router.push("/pricing");
      }
    }
  }, [user, authLoading, access, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error || "Invalid email or password");
      setIsLoading(false);
    }
    // If successful, the useEffect will handle redirect
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.6 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            className="w-12 h-12 rounded-xl overflow-hidden"
          >
            <Image
              src="/delta-logo.svg"
              alt="Delta"
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <span
            className="text-3xl font-extralight tracking-widest uppercase"
            style={{
              textShadow: '0 0 10px rgba(255, 107, 107, 0.6), 0 0 30px rgba(255, 107, 107, 0.4), 0 0 50px rgba(255, 107, 107, 0.2)'
            }}
          >
            Delta
          </span>
        </Link>

        {/* Form card */}
        <div className="bg-card rounded-3xl border border-border p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
          <p className="text-muted text-center mb-8">Log in to continue your journey</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                placeholder="Your password"
                required
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium shadow-lg shadow-primary/25 disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </motion.button>
          </form>

          <p className="text-center text-muted text-sm mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
