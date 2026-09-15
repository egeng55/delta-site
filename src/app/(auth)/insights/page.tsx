import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  PUBLIC_CAPABILITY_STATE_DEFINITIONS,
  getPublicCapabilitiesForSurface,
} from "@/lib/publicCapabilityManifest";

const capabilityStates = getPublicCapabilitiesForSurface("insights");

export default function InsightsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen px-6 pb-20 pt-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-primary">Research status</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold md:text-5xl">
            General personal insights are not available yet.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            The current private preview does not continuously build a broad health
            profile, produce a universal health score, or promise personalized
            recommendations across daily life. Delta is proving the underlying
            intelligence loop in narrower, testable steps.
          </p>

          <section className="mt-12 border-t border-border">
            {capabilityStates.map((capability) => (
              <article
                key={capability.id}
                className="grid gap-3 border-b border-border py-7 md:grid-cols-[0.35fr_0.65fr]"
              >
                <p className="text-sm text-muted">
                  {PUBLIC_CAPABILITY_STATE_DEFINITIONS[capability.state].label}
                </p>
                <div>
                  <h2 className="text-xl font-semibold">{capability.name}</h2>
                  <p className="mt-2 leading-7 text-muted">{capability.summary}</p>
                </div>
              </article>
            ))}
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/command"
              className="bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Open available preview
            </Link>
            <Link
              href="/research"
              className="border border-border px-4 py-2 text-sm font-medium"
            >
              Review current proofs
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
