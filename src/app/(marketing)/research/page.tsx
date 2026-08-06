import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  PUBLIC_CAPABILITY_STATE_DEFINITIONS,
  getPublicCapabilitiesForSurface,
} from "@/lib/publicCapabilityManifest";

const capabilityStates = getPublicCapabilitiesForSurface("research");

const evidenceStandards = [
  "The capability boundary and owner authority are explicit.",
  "Expected behavior and refusal behavior are testable.",
  "Failures remain visible instead of being converted into success claims.",
  "Proof scenarios remain narrower than product availability claims.",
];

export default function ResearchPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen px-6 pb-20 pt-28">
        <div className="mx-auto max-w-6xl">
          <Image src="/delta-logo.svg" alt="Delta" width={56} height={56} priority />
          <p className="mt-8 text-sm font-medium text-primary">Evidence</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold md:text-6xl">
            What Delta can prove today
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Delta separates capabilities that are available in its private preview
            from bounded proofs and longer-term research. Evidence can support a
            specific behavior without proving the complete personal intelligence
            system.
          </p>

          <section className="mt-14 border-t border-border">
            {capabilityStates.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 border-b border-border py-7 md:grid-cols-[0.35fr_0.65fr]"
              >
                <p className="text-sm text-muted">
                  {PUBLIC_CAPABILITY_STATE_DEFINITIONS[item.state].label}
                </p>
                <div>
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="mt-2 leading-7 text-muted">{item.summary}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.boundary}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-14 grid gap-8 border-y border-border py-9 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold">Not claimed</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                <li>No peer-reviewed Delta publications</li>
                <li>No clinical validation or medical-device clearance</li>
                <li>No claim that model output is consistently correct</li>
                <li>No population-scale efficacy evidence</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Evidence standard</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                {evidenceStandards.map((standard) => (
                  <li key={standard}>{standard}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Request private preview access
            </Link>
            <Link
              href="/privacy"
              className="border border-border px-4 py-2 text-sm font-medium"
            >
              Review data boundaries
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
