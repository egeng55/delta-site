import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  CURATED_PUBLIC_PROOFS,
  INTELLIGENCE_LOOP,
  PUBLIC_ACCESS_POLICY,
  PUBLIC_CAPABILITY_STATE_DEFINITIONS,
  getPublicCapabilitiesForSurface,
  getPublicCapability,
} from "@/lib/publicCapabilityManifest";

const productCapabilities = getPublicCapabilitiesForSurface("product");
const curatedProofs = CURATED_PUBLIC_PROOFS.flatMap(proof => {
  const capability = getPublicCapability(proof.capabilityId);
  return capability ? [{ ...proof, capability }] : [];
});

export default function ProductPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen px-6 pb-20 pt-28">
        <div className="mx-auto max-w-6xl">
          <Image src="/delta-logo.svg" alt="Delta" width={56} height={56} priority />
          <p className="mt-8 text-sm font-medium text-primary">Product</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
            Delta helps turn what is happening into a better next move.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            A useful personal intelligence should understand the current situation,
            form a careful view, recommend one next action, listen to feedback, and
            improve without taking control away from its owner.
          </p>

          <section className="mt-16">
            <p className="text-sm font-medium text-primary">The intelligence loop</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold">
              Six questions connect one moment to the next.
            </h2>
            <div className="mt-10 border-t border-border">
              {INTELLIGENCE_LOOP.map((step, index) => (
                <article
                  key={step.id}
                  className="grid gap-3 border-b border-border py-7 md:grid-cols-[0.12fr_0.28fr_0.6fr]"
                >
                  <p className="text-sm text-muted">{String(index + 1).padStart(2, "0")}</p>
                  <div>
                    <h3 className="text-lg font-semibold">{step.label}</h3>
                    <p className="mt-1 text-sm text-primary">{step.question}</p>
                  </div>
                  <p className="leading-7 text-muted">{step.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <p className="text-sm font-medium text-primary">Current product truth</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold">
              The product direction is broader than today&apos;s access.
            </h2>
            <div className="mt-10 border-t border-border">
              {productCapabilities.map(capability => (
                <article
                  key={capability.id}
                  className="grid gap-3 border-b border-border py-7 md:grid-cols-[0.3fr_0.7fr]"
                >
                  <p className="text-sm text-muted">
                    {PUBLIC_CAPABILITY_STATE_DEFINITIONS[capability.state].label}
                  </p>
                  <div>
                    <h3 className="text-xl font-semibold">{capability.name}</h3>
                    <p className="mt-2 leading-7 text-muted">{capability.summary}</p>
                    <p className="mt-3 text-sm leading-6 text-muted">{capability.boundary}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <p className="text-sm font-medium text-primary">Curated proofs</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold">
              Small demonstrations answer larger product questions.
            </h2>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {curatedProofs.map(proof => (
                <article key={proof.capabilityId} className="border-t border-border pt-7">
                  <p className="text-sm text-muted">Proof</p>
                  <h3 className="mt-2 text-2xl font-semibold">{proof.question}</h3>
                  <p className="mt-3 leading-7 text-muted">{proof.capability.summary}</p>
                  <h4 className="mt-6 text-sm font-semibold">What it demonstrates</h4>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                    {proof.demonstrates.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted">
                    {proof.doesNotProve}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-20 grid gap-8 border-y border-border py-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-primary">Access</p>
              <h2 className="mt-3 text-2xl font-semibold">Request-based private preview</h2>
            </div>
            <div>
              <p className="leading-7 text-muted">{PUBLIC_ACCESS_POLICY.statement}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="bg-foreground px-5 py-3 text-sm font-medium text-background"
                >
                  {PUBLIC_ACCESS_POLICY.label}
                </Link>
                <Link
                  href="/research"
                  className="border border-border px-5 py-3 text-sm font-medium"
                >
                  Review the evidence
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
