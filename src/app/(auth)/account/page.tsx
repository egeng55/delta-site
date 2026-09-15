"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/account");
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Loading account...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/delta-logo.svg" alt="Delta" width={36} height={36} />
            <span className="font-semibold">Delta</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-medium text-primary">Personal preview</p>
        <h1 className="mt-3 text-3xl font-semibold">Account</h1>

        <section className="mt-8 border-y border-border py-2">
          <div className="grid gap-2 border-b border-border py-5 sm:grid-cols-[160px_1fr]">
            <p className="text-sm text-muted">Name</p>
            <p className="font-medium">{user.name || "Not set"}</p>
          </div>
          <div className="grid gap-2 border-b border-border py-5 sm:grid-cols-[160px_1fr]">
            <p className="text-sm text-muted">Email</p>
            <p className="break-all font-medium">{user.email}</p>
          </div>
          <div className="grid gap-2 py-5 sm:grid-cols-[160px_1fr]">
            <p className="text-sm text-muted">Access</p>
            <div>
              <p className="font-medium">Private personal preview</p>
              <p className="mt-1 text-sm text-muted">
                Delta currently has no paid plan, trial, renewal, or billing action.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Connected intelligence</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Manage provider access, freshness, and stored WHOOP history from one
            owner-scoped control surface.
          </p>
          <Link
            href="/integrations/whoop"
            className="mt-5 inline-flex bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Manage WHOOP
          </Link>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold">Security and data requests</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/forgot-password"
              className="border border-border px-4 py-2 text-sm font-medium"
            >
              Reset password
            </Link>
            <Link
              href="/privacy"
              className="border border-border px-4 py-2 text-sm font-medium"
            >
              Privacy controls
            </Link>
            <Link
              href="/contact"
              className="border border-border px-4 py-2 text-sm font-medium"
            >
              Request export or deletion
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            Account-wide automated export and deletion are not yet represented as
            complete controls. Requests are handled through the contact path.
          </p>
        </section>

        {(user.role === "developer" || user.role === "admin") && (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="text-xl font-semibold">Owner access review</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Review private-preview requests and send invitations after approval.
            </p>
            <Link
              href="/account/access-requests"
              className="mt-5 inline-flex border border-border px-4 py-2 text-sm font-medium"
            >
              Review access requests
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
