"use client";

import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  INTELLIGENCE_LOOP,
  PUBLIC_ACCESS_POLICY,
  PUBLIC_CAPABILITY_STATE_DEFINITIONS,
  getPublicCapabilitiesForSurface,
} from "@/lib/publicCapabilityManifest";

const publicStates = getPublicCapabilitiesForSurface("home");

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <Navigation />
      <main>
        <section className="flex min-h-[76vh] items-center border-b border-border px-6 pb-16 pt-28">
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <Image
                src="/delta-logo.svg"
                alt="Delta"
                width={72}
                height={72}
                priority
              />
              <p className="mt-8 text-sm font-medium text-primary">
                Private preview
              </p>
              <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
                Personal intelligence that improves with evidence.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
                Delta is a personal intelligence system designed to understand
                context, maintain useful state, reason about what matters, help
                choose a next action, and learn from outcomes. Its available
                public surface is intentionally narrower than that vision.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={user ? "/command" : "/signup"}
                  className="bg-foreground px-5 py-3 text-sm font-medium text-background"
                >
                  {user ? "Open private preview" : PUBLIC_ACCESS_POLICY.label}
                </Link>
                <Link
                  href="/product"
                  className="border border-border px-5 py-3 text-sm font-medium"
                >
                  How Delta works
                </Link>
              </div>
            </div>

            <dl className="border-t border-border text-sm lg:border-l lg:border-t-0 lg:pl-8">
              <div className="border-b border-border py-5">
                <dt className="text-muted">Product identity</dt>
                <dd className="mt-1 font-medium">Personal intelligence</dd>
              </div>
              <div className="border-b border-border py-5">
                <dt className="text-muted">Access policy</dt>
                <dd className="mt-1 font-medium">Request access</dd>
              </div>
              <div className="border-b border-border py-5">
                <dt className="text-muted">Private preview</dt>
                <dd className="mt-1 font-medium">WHOOP connected context</dd>
              </div>
              <div className="py-5">
                <dt className="text-muted">Generally available</dt>
                <dd className="mt-1 font-medium">No capabilities yet</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Intelligence loop</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Better next actions require more than one answer.
              </h2>
              <p className="mt-4 leading-7 text-muted">
                Delta&apos;s defining loop connects what is happening now to what
                should happen next, then carries the result forward as evidence.
              </p>
            </div>
            <ol className="mt-10 grid border-y border-border sm:grid-cols-2 lg:grid-cols-6">
              {INTELLIGENCE_LOOP.map((step, index) => (
                <li
                  key={step.id}
                  className="border-b border-border py-5 sm:border-r sm:px-4 lg:border-b-0"
                >
                  <p className="text-xs text-muted">{String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-2 font-medium">{step.label}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Public capability state</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Available, proven, and researched are different claims.
              </h2>
            </div>
            <div className="mt-12 border-t border-border">
              {publicStates.map((capability) => (
                <article
                  key={capability.id}
                  className="grid gap-3 border-b border-border py-7 md:grid-cols-[0.35fr_0.65fr]"
                >
                  <p className="text-sm text-muted">
                    {PUBLIC_CAPABILITY_STATE_DEFINITIONS[capability.state].label}
                  </p>
                  <div>
                    <h3 className="text-xl font-semibold">{capability.name}</h3>
                    <p className="mt-2 max-w-2xl leading-7 text-muted">
                      {capability.summary}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-primary">Current limits</p>
              <h2 className="mt-3 text-2xl font-semibold">What Delta does not claim today</h2>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-muted">
              <li>No general persistent personal memory available as a public product</li>
              <li>No always-listening assistant, continuous background agent, or autonomous action</li>
              <li>No medical diagnosis, treatment, or guaranteed recommendation quality</li>
              <li>No paid subscription, broad mobile launch, or production service-level guarantee</li>
              <li>Internal engineering systems are not personal-intelligence product capabilities</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
