import type { Metadata } from "next";
import Link from "next/link";
import {
  AccessBand,
  Arrow,
  PageIntro,
  PublicSite,
  styles,
} from "@/components/public/PublicSite";
import IntelligenceScene from "@/components/public/IntelligenceScene";

export const metadata: Metadata = {
  title: "The system | Delta",
  description:
    "Explore Delta's personal context, source-backed research, and governed engineering workflows, with clear access boundaries.",
};

export default function ProductPage() {
  return (
    <PublicSite>
      <main id="main">
        <PageIntro
          label="The system"
          title="One intelligence. A wider context."
        >
          <p>
            Delta begins as a private conversation, then brings in only the
            account context and evidence that can materially improve the answer.
            Not every question needs every tool. Not every answer should become
            an action.
          </p>
        </PageIntro>
        <div className={styles.container}>
          <section className={styles.detailSection}>
            <div>
              <span className={styles.badge}>Authenticated private preview</span>
              <h2>
                Talk to Delta,
                <br />
                inside your account.
              </h2>
            </div>
            <div className={styles.detailContent}>
              <p>
                The Delta workspace is the primary product surface. The signed-in
                account determines the available context; a conversation ID does
                not grant access to another person&apos;s information. Internal
                engineering and owner consoles remain separate.
              </p>
              <div className={styles.buttonRow}>
                <Link href="/login?redirect=/app" className={styles.darkButton}>
                  Open Delta <Arrow />
                </Link>
                <Link href="/security" className={styles.outlineButton}>
                  Security boundaries <Arrow />
                </Link>
              </div>
            </div>
          </section>
          <IntelligenceScene />
          <section id="personal" className={styles.detailSection}>
            <div>
              <span className={styles.badge}>
                Owner-operated · Selected preview access
              </span>
              <h2>
                Personal context,
                <br />
                without invented certainty.
              </h2>
            </div>
            <div className={styles.detailContent}>
              <p>
                The Daily Intelligence Brief combines the latest applicable
                WHOOP recovery and sleep with today&apos;s logged nutrition and
                training state. Evidence is checked against the owner&apos;s
                local date. Missing entries stay missing; stale recovery does
                not become today&apos;s truth.
              </p>
              <div>
                <h3>Continuity, not a clean slate</h3>
                <p>
                  Relevant historical context can inform an answer without
                  becoming a current fact. Correcting information in a
                  conversation is separate from authorizing a durable memory
                  change.
                </p>
              </div>
              <div>
                <h3>The right context, only when it matters</h3>
                <p>
                  Coarse-location weather can affect an outdoor training
                  recommendation. Schedule contracts distinguish confirmed,
                  tentative, and unavailable evidence; live calendar access
                  depends on a separately authorized adapter and permission.
                </p>
              </div>
              <p className={styles.notice}>
                WHOOP connection and preview controls are request-based. Broader
                personal workflows are not automatically included in preview
                access. Health-related outputs are not medical advice.
              </p>
            </div>
          </section>
          <section id="research" className={styles.detailSection}>
            <div>
              <span className={styles.badge}>Owner-operated</span>
              <h2>
                Research that keeps
                <br />
                its sources attached.
              </h2>
            </div>
            <div className={styles.detailContent}>
              <p>
                Delta&apos;s prospect workflows move from discovery to
                first-party company verification, deeper research, and
                evidence-backed opportunities. Directory results are leads, not
                verified companies. Data quality checks and provenance matter
                before a ranking can be useful.
              </p>
              <div>
                <h3>Knowledge across domains</h3>
                <p>
                  Financial context supports bounded education, not trading
                  signals or portfolio execution. Career context is a sanitized,
                  read-only view of existing research, not permission to apply,
                  contact a recruiter, or schedule an interview.
                </p>
              </div>
              <div>
                <h3>Research does not authorize outreach</h3>
                <p>
                  External requests, contact enrichment, persistence, and
                  publishing retain their own limits and approvals. A research
                  result is not an email campaign.
                </p>
              </div>
            </div>
          </section>
          <section id="engineering" className={styles.detailSection}>
            <div>
              <span className={styles.badge}>
                Internal tooling · Quality under evaluation
              </span>
              <h2>
                Engineering with
                <br />
                system awareness.
              </h2>
            </div>
            <div className={styles.detailContent}>
              <p>
                Delta has native tools to discover registered capabilities,
                inspect repositories, and edit bounded files in isolated
                worktrees. Durable workflows retain progress and verification
                evidence without persisting execution authority.
              </p>
              <div>
                <h3>Understand what a change touches</h3>
                <p>
                  Architecture mappings and change-impact reports identify
                  declared consumers, contracts, verification packs, and
                  context-cache obligations. Unknown ownership stays a visible
                  gap, not invented authority.
                </p>
              </div>
              <div>
                <h3>Prove the outcome, not the activity</h3>
                <p>
                  Tests and review distinguish a successful tool call from a
                  correct deliverable. Independent specialist synthesis and
                  autonomous engineering remain evaluation work. Delta is not
                  yet presented as a proven replacement for a software engineer.
                </p>
              </div>
              <p className={styles.notice}>
                No public engineering workspace or arbitrary execution endpoint
                is offered here. Integration and release are separate from
                implementation.
              </p>
            </div>
          </section>
          <section className={styles.detailSection}>
            <div>
              <p className={styles.eyebrow}>The common foundation</p>
              <h2>
                Authority belongs
                <br />
                to the owner.
              </h2>
            </div>
            <div className={styles.detailContent}>
              <p>
                Relevant evidence, explicit scope, freshness, and verification
                connect these workflows. Unresolved ownership blocks routing. An
                approval is specific to an operation, not a blanket invitation
                for other tools to act.
              </p>
              <Link href="/research" className={styles.textLink}>
                Implementation is not qualification <Arrow />
              </Link>
            </div>
          </section>
        </div>
        <AccessBand />
      </main>
    </PublicSite>
  );
}
