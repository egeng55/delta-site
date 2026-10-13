import type { Metadata } from "next";
import {
  AccessBand,
  PageIntro,
  PublicSite,
  styles,
} from "@/components/public/PublicSite";

export const metadata: Metadata = {
  title: "Security and control | Delta",
  description:
    "How Delta separates accounts, context, connected sources, and consequential actions.",
};

const boundaries = [
  {
    title: "Your account is the web workspace boundary",
    detail:
      "The web chat proxy verifies the signed-in session and constructs request identity server-side. A browser-provided account ID cannot select another person's context through this path.",
  },
  {
    title: "Context is not blanket permission",
    detail:
      "Remembered information can improve a response. It cannot authorize outreach, publication, purchases, provider writes, or another consequential operation.",
  },
  {
    title: "Connections remain separate",
    detail:
      "A connected source is available only within its approved scope. Provider credentials remain outside the conversation and are never returned to the model or browser.",
  },
  {
    title: "Internal operations stay internal",
    detail:
      "Owner workspaces, engineering evidence, and development consoles are not customer chat surfaces and do not become visible through an ordinary Delta account.",
  },
] as const;

export default function SecurityPage() {
  return (
    <PublicSite>
      <main id="main">
        <PageIntro
          label="Security and control"
          title="Useful context needs a hard boundary."
          atmosphere="/images/atmosphere/rocky-beach.jpg"
          atmospherePosition="center 58%"
        >
          <p>
            Delta is designed so each person enters through their own account,
            uses their own available context, and retains control over any
            operation that reaches beyond the conversation.
          </p>
        </PageIntro>
        <div className={styles.container}>
          <section className={styles.detailSection}>
            <div>
              <p className={styles.eyebrow}>Account isolation</p>
              <h2>Same intelligence. Separate principals.</h2>
            </div>
            <div className={styles.detailContent}>
              <p>
                Delta&apos;s product behavior can be shared while personal context
                remains separate. The web workspace derives each chat request
                identity from the authenticated session, and anonymous access
                does not receive private account data.
              </p>
              <p className={styles.notice}>
                The private preview currently restores account context through
                the Delta backend. Durable, thread-by-thread transcript
                restoration is a separate product capability and is not implied
                by the website interface.
              </p>
            </div>
          </section>
          <section className={styles.detailSection}>
            <div>
              <p className={styles.eyebrow}>Four boundaries</p>
              <h2>Private by design, explicit by action.</h2>
            </div>
            <div className={styles.detailContent}>
              {boundaries.map((boundary) => (
                <div key={boundary.title}>
                  <h3>{boundary.title}</h3>
                  <p>{boundary.detail}</p>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.detailSection}>
            <div>
              <p className={styles.eyebrow}>Product controls</p>
              <h2>What the interface must make visible.</h2>
            </div>
            <div className={styles.detailContent}>
              <div>
                <h3>Conversation versus memory</h3>
                <p>
                  A transcript and durable remembered context are different
                  records. Future memory controls will make review, correction,
                  and deletion explicit rather than hiding them behind chat.
                </p>
              </div>
              <div>
                <h3>Temporary conversation</h3>
                <p>
                  Temporary mode will provide a clear no-history, no-memory-write
                  path. It will not quietly behave like a remembered session.
                </p>
              </div>
              <div>
                <h3>Scoped approval</h3>
                <p>
                  When a supported tool could create an external effect, Delta
                  must identify the exact action and request approval at that
                  boundary. General chat access is never sufficient authority.
                </p>
              </div>
            </div>
          </section>
        </div>
        <AccessBand />
      </main>
    </PublicSite>
  );
}
