import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  PUBLIC_ACCESS_POLICY,
  getPublicCapabilitiesForSurface,
} from "@/lib/publicCapabilityManifest";

const previewCapabilities = getPublicCapabilitiesForSurface("access");

export default function AccessPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-primary">Access</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">
            Delta is a request-based private preview.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            Public account creation is closed. Access requests are reviewed
            manually, and approval covers only the capabilities listed as private
            preview—not proofs, research, or internal systems.
          </p>

          <section className="mt-12 border-y border-border py-8">
            <h2 className="text-xl font-semibold">Included in approved preview access</h2>
            <div className="mt-5 border-t border-border">
              {previewCapabilities.map(capability => (
                <article key={capability.id} className="border-b border-border py-5">
                  <h3 className="font-semibold">{capability.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{capability.summary}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{capability.boundary}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold">How requests work</h2>
              <ol className="mt-5 space-y-3 text-sm leading-6 text-muted">
                <li>1. Submit the request form with your name and email.</li>
                <li>2. Requests are reviewed manually; access is not guaranteed.</li>
                <li>3. Approval and invitation are separate owner-controlled steps.</li>
              </ol>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Not included</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-muted">
                <li>Broad personal memory or continuous profile learning</li>
                <li>General personal insights across health, work, and daily life</li>
                <li>Always-on voice, background monitoring, or autonomous action</li>
                <li>Technical cockpits, research fixtures, or engineering systems</li>
              </ul>
            </div>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="bg-foreground px-5 py-3 text-sm font-medium text-background"
            >
              {PUBLIC_ACCESS_POLICY.label}
            </Link>
            <Link
              href={PUBLIC_ACCESS_POLICY.loginPath}
              className="border border-border px-5 py-3 text-sm font-medium"
            >
              Log in to approved account
            </Link>
          </div>

          <p className="mt-12 text-sm leading-6 text-muted">
            Delta has no paid plans, trial, checkout, or generally available
            commercial service. Proof and research capabilities may be described
            publicly without being included in preview access.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
