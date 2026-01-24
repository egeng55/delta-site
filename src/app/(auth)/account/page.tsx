"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const router = useRouter();
  const { user, access, subscription, isLoading, logout } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
            {access?.hasPremiumAccess && (
              <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
                Dashboard
              </Link>
            )}
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
      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

          {/* Profile Section */}
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm text-muted">Name</p>
                  <p className="font-medium">{user.name || "Not set"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm text-muted">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-muted">Role</p>
                  <p className="font-medium capitalize">
                    {user.role}
                    {access?.isDeveloper && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Developer Access
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Subscription</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm text-muted">Plan</p>
                  <p className="font-medium capitalize">
                    {access?.isDeveloper ? (
                      <span className="text-purple-500">Developer (Unlimited Access)</span>
                    ) : (
                      subscription?.plan || "Free"
                    )}
                  </p>
                </div>
                {!access?.isDeveloper && subscription?.plan === "free" && (
                  <Link
                    href="/pricing"
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Upgrade
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm text-muted">Status</p>
                  <p className="font-medium">
                    {access?.isDeveloper ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Always Active
                      </span>
                    ) : subscription?.status === "active" ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        {subscription?.status || "Inactive"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {!access?.isDeveloper && subscription && subscription.plan !== "free" && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="text-sm text-muted">Current Period</p>
                      <p className="font-medium">
                        {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm text-muted">Billing</p>
                      <p className="font-medium capitalize">{subscription.source}</p>
                    </div>
                    {subscription.status === "active" && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Cancel subscription
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Security Section */}
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Security</h2>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted">Change your password</p>
              </div>
              <Link
                href="/forgot-password"
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors"
              >
                Reset password
              </Link>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-card rounded-2xl border border-red-500/20 p-6">
            <h2 className="text-lg font-semibold mb-4 text-red-500">Danger Zone</h2>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Sign out</p>
                <p className="text-sm text-muted">Sign out of your account on this device</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors"
              >
                Sign out
              </button>
            </div>
          </section>
        </motion.div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-2">Cancel subscription?</h3>
            <p className="text-muted mb-6">
              Your subscription will remain active until the end of your current billing period.
              After that, you'll lose access to premium features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 border border-border rounded-xl font-medium hover:bg-background transition-colors"
              >
                Keep subscription
              </button>
              <button
                onClick={() => {
                  // TODO: Implement cancellation
                  setShowCancelModal(false);
                }}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
