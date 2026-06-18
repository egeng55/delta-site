import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings | Delta",
  description: "Protected Delta settings placeholder.",
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-primary">Protected route</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Delta settings are intentionally minimal on the web surface right now.
          Account and subscription controls live on the account page. The Delta
          OS Console remains a local development cockpit, not a production
          settings surface.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Available settings</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>Profile and subscription details are managed from Account.</li>
            <li>Delta OS voice input remains disabled from the web UI.</li>
            <li>No memory writes, notifications, mic capture, or TTS are enabled here.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Open Account
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/40"
            >
              Open Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
