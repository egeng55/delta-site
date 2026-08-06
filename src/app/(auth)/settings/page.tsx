import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings | Delta",
  description: "Protected Delta connector and account settings.",
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-primary">Protected route</p>
        <h1 className="mt-3 text-3xl font-semibold">Settings</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Delta settings are intentionally minimal on the web surface right now.
          Delta settings focus on real personal controls. Provider connections
          live on their integration page, and account security lives on the
          account page. The OS Console remains a local development cockpit.
        </p>

        <section className="mt-8 border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Available settings</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>Account identity and security links are managed from Account.</li>
            <li>WHOOP refresh, disconnect, and history deletion are managed from WHOOP.</li>
            <li>There are no paid plans or billing controls.</li>
            <li>Delta OS voice input remains disabled from the web UI.</li>
            <li>No memory writes, notifications, mic capture, or TTS are enabled here.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/integrations/whoop"
              className="bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Connect WHOOP
            </Link>
            <Link
              href="/account"
              className="border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/40"
            >
              Open Account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
