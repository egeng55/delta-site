import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FEEDBACK_CONTRACT } from "@/lib/feedbackContract";

const loopSteps = [
  {
    title: "Observation",
    body: "A scripted, typed live fallback, or microphone input becomes a single observation.",
  },
  {
    title: "Event",
    body: "Delta extracts a late-caffeine event with source, time, importance, and storage intent.",
  },
  {
    title: "Memory / State",
    body: "The loop loads late-caffeine adaptation state, including tone, cooldown, timing offset, and prior feedback.",
  },
  {
    title: "Decision",
    body: "Delta decides whether to notify, defer, stay silent, or store silently, then explains why.",
  },
  {
    title: "Feedback",
    body: "Feedback such as good_call, too_much, ignored, remind_earlier, or remind_later is evaluated.",
  },
  {
    title: "Adaptation",
    body: "Future behavior changes in dry-run state: tone, cooldown, frequency, suppression, or timing can shift.",
  },
];

const proven = [
  "Scripted late-caffeine dry-runs",
  "Dashboard-connected dry-runs",
  "Typed live fallback through the same loop",
  "Real spoken microphone dry-run has been validated once locally",
  "Supabase persisted late-caffeine feedback works for controlled scripted tests",
  "State inspection, feedback preview, and local demo reset",
  "Side-effect gates for database writes, notifications, and TTS",
  "Ambient and non-user input can be filtered without creating a fake behavioral event",
  "Intervention explanations, copy, feedback, and adaptation summaries are visible in the cockpit",
];

const partiallyProven = [
  "Real microphone device access and device listing work locally.",
  "Real spoken-input transcription is validated once in local dry-run, not yet reliability-tested.",
  "Live dry-run mode can process a user-provided live observation through typed fallback.",
  "Dashboard and mobile read-only surfaces can show persisted Supabase state separately from simulated status.",
];

const notProven = [
  "Repeated real spoken-input reliability across environments has not been validated.",
  "Live microphone input plus persisted learning in the same run has not been tested.",
  "Notifications and TTS are intentionally gated and have not been run as real side effects.",
  "Delta currently proves one behavioral domain: late caffeine. It is not a multi-domain Behavioral OS yet.",
];

export default function DemoPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background px-6 py-24 xl:pl-40">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Product Demo</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Delta is proving one behavioral loop before expanding.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-muted md:text-lg">
            Delta is not just a chatbot. The current demo turns a late-caffeine observation into a structured event,
            loads learned intervention state, decides whether to speak or stay silent, records feedback, and shows
            what would change next time.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard?localDemo=1"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Open local demo cockpit
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Back to Delta
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-3 md:grid-cols-3">
            {loopSteps.map((step, index) => (
              <article key={step.title} className="rounded-lg border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">What is actually proven</h2>
            <div className="mt-4 space-y-3">
              {proven.map((item) => (
                <p key={item} className="rounded-md border border-border p-3 text-sm leading-6 text-muted">
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">What is still gated or unproven</h2>
            <div className="mt-4 space-y-3">
              {notProven.map((item) => (
                <p key={item} className="rounded-md border border-border p-3 text-sm leading-6 text-muted">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Current Proof Status</p>
          <h2 className="mt-2 text-2xl font-semibold">A narrow product demo, not a production claim</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <h3 className="font-semibold text-green-500">Proven</h3>
              <div className="mt-3 space-y-2">
                {proven.slice(0, 5).map((item) => (
                  <p key={item} className="text-sm leading-6 text-muted">{item}</p>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="font-semibold text-amber-500">Partially proven</h3>
              <div className="mt-3 space-y-2">
                {partiallyProven.map((item) => (
                  <p key={item} className="text-sm leading-6 text-muted">{item}</p>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <h3 className="font-semibold text-red-500">Not yet proven</h3>
              <div className="mt-3 space-y-2">
                {notProven.map((item) => (
                  <p key={item} className="text-sm leading-6 text-muted">{item}</p>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">
            The point of the current demo is to show the behavioral loop: Delta can stay silent on ambient input,
            detect late caffeine, explain the intervention decision, adapt after feedback, and label simulated state
            separately from persisted state.
          </p>
        </section>

        <section className="mx-auto mt-16 max-w-6xl rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
          <h2 className="text-xl font-semibold">State provenance matters</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            The demo cockpit labels learned state as simulated dry-run state, status JSON snapshot, persisted Supabase
            state, unavailable state, or stale state. Dry-run learning should not be read as the user&apos;s real persisted
            profile.
          </p>
        </section>

        <section className="mx-auto mt-16 max-w-6xl rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Feedback UX</p>
          <h2 className="mt-2 text-2xl font-semibold">The core question is whether Delta can help without becoming annoying.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            The current loop maps user feedback into simulated policy changes. Good feedback keeps interventions eligible.
            Negative feedback softens, cools down, reduces frequency, or suppresses the category. Timing feedback changes
            when Delta should speak. Misunderstanding feedback lowers confidence instead of blindly adapting.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {FEEDBACK_CONTRACT.map((option) => (
              <article key={option.internalOutcome} className="rounded-md border border-border p-4">
                <h3 className="text-sm font-semibold">{option.label}</h3>
                <p className="mt-2 text-xs leading-5 text-muted">{option.exampleAdaptationSummary}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
