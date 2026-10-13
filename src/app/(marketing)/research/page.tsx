import type { Metadata } from "next";
import {
  AccessBand,
  PageIntro,
  PublicSite,
  styles,
} from "@/components/public/PublicSite";

export const metadata: Metadata = {
  title: "Development | Delta",
  description:
    "What Delta implements, what is available in preview, and what still requires evaluation.",
};

const rows = [
  [
    "WHOOP connection",
    "Private preview",
    "Owner-scoped connection, normalized context, freshness, and access controls for approved accounts.",
  ],
  [
    "Daily Intelligence Brief",
    "Owner-operated",
    "Read-only evidence composition with temporal checks, bounded critique, and grounding verification. Not a clinical claim.",
  ],
  [
    "Personal Continuity",
    "Owner-operated",
    "Historical context and governed correction paths. History cannot override current owner truth.",
  ],
  [
    "Weather and schedule",
    "Conditional",
    "Relevant weather through an approved read. Schedule availability requires an authorized, functioning source; an empty or unavailable read is not proof of free time.",
  ],
  [
    "Prospect and career research",
    "Owner-operated",
    "Source-backed company research and sanitized career context. No general outreach or application authority.",
  ],
  [
    "Engineering workflows",
    "Internal",
    "Native source inspection, isolated edits, workflow checkpoints, and verification. Broad autonomous coding quality is not yet established.",
  ],
  [
    "Independent synthesis",
    "Evaluation",
    "Bounded specialist assessments and synthesis with cost, usage, and artifact accounting. Improvement must be measured, not assumed.",
  ],
];

export default function ResearchPage() {
  return (
    <PublicSite>
      <main id="main">
        <PageIntro
          label="Current development"
          title="Built is not the same as proven."
        >
          <p>
            We distinguish working implementation, approved access, and measured
            quality. A deterministic test proves a boundary. It does not prove
            an AI will reliably solve an open-ended task.
          </p>
        </PageIntro>
        <div className={styles.container}>
          <div
            className={styles.tableWrap}
            tabIndex={0}
            role="region"
            aria-label="Capability development status"
          >
            <table className={styles.evidenceTable}>
              <caption className={styles.eyebrow}>
                Current implementation and access boundaries
              </caption>
              <thead>
                <tr>
                  <th scope="col">Area</th>
                  <th scope="col">Status</th>
                  <th scope="col">What that means</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([name, status, detail]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>
                      <span className={styles.badge}>{status}</span>
                    </td>
                    <td>{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className={styles.detailSection}>
            <div>
              <p className={styles.eyebrow}>Evidence standard</p>
              <h2>
                Measure the artifact.
                <br />
                Not the performance.
              </h2>
            </div>
            <div className={styles.detailContent}>
              <div>
                <h3>The same evidence, the same rubric</h3>
                <p>
                  Compare a baseline with a reviewed result using fixed evidence
                  and shared criteria. A critique only counts when it produces a
                  traceable, useful change.
                </p>
              </div>
              <div>
                <h3>Failure remains part of the record</h3>
                <p>
                  Unavailable evidence, interrupted operations, unknown usage,
                  and failed verification must stay visible. A partial result is
                  not silently promoted into success.
                </p>
              </div>
              <div>
                <h3>Tests are not live demonstrations</h3>
                <p>
                  The examples on this website are illustrative and use no
                  account data. They do not run Delta, prove model quality, or
                  activate a connected service.
                </p>
              </div>
            </div>
          </section>
          <section className={styles.detailSection}>
            <div>
              <p className={styles.eyebrow}>Still to prove</p>
              <h2>
                Useful autonomy,
                <br />
                earned one task at a time.
              </h2>
            </div>
            <div className={styles.detailContent}>
              <p>
                The next measure is whether Delta can deliver independently
                accepted work while using its existing tools, respecting
                authority, and catching downstream consequences. A larger
                capability registry is not the outcome.
              </p>
              <ul>
                <li>Real software deliverables with independent acceptance.</li>
                <li>Measured gains from specialist critique and synthesis.</li>
                <li>
                  Reliable context across tasks without false current-state
                  claims.
                </li>
              </ul>
              <p>
                No claim of general autonomous operation, clinical validation,
                peer-reviewed efficacy, or superiority over other coding systems
                is made.
              </p>
            </div>
          </section>
        </div>
        <AccessBand />
      </main>
    </PublicSite>
  );
}
