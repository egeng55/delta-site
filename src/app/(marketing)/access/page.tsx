import type { Metadata } from "next";
import Link from "next/link";
import {
  Arrow,
  PageIntro,
  PublicSite,
  styles,
} from "@/components/public/PublicSite";
import {
  PUBLIC_ACCESS_POLICY,
  getPublicCapabilitiesForSurface,
} from "@/lib/publicCapabilityManifest";

export const metadata: Metadata = {
  title: "Private access | Delta",
  description:
    "Request access to Delta's manually approved private preview. No paid plans or open registration.",
};

export default function AccessPage() {
  return (
    <PublicSite>
      <main id="main">
        <PageIntro label="Private access" title="Start with a conversation.">
          <p>
            Delta is a request-based private preview. Tell us what you want to
            explore. We review requests manually and invite people within the
            capabilities we can responsibly support.
          </p>
        </PageIntro>
        <div className={styles.container}>
          <div className={styles.buttonRow}>
            <Link
              href={PUBLIC_ACCESS_POLICY.requestPath}
              className={styles.darkButton}
            >
              Request access <Arrow />
            </Link>
            <Link
              href={PUBLIC_ACCESS_POLICY.loginPath}
              className={styles.outlineButton}
            >
              Log in to your account <Arrow />
            </Link>
          </div>
          <section className={styles.detailSection} style={{ marginTop: 60 }}>
            <div>
              <p className={styles.eyebrow}>Included in the preview</p>
              <h2>A clear starting point.</h2>
            </div>
            <div className={styles.detailContent}>
              {getPublicCapabilitiesForSurface("access").map((item) => (
                <div key={item.id}>
                  <h3>{item.name}</h3>
                  <p>{item.summary}</p>
                  <p>{item.boundary}</p>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Before you request</p>
              <h2>Know what access means.</h2>
            </div>
            <div className={styles.faq}>
              <details open>
                <summary>Does requesting access create an account?</summary>
                <p>
                  No. Requests, approval, and invitation are separate steps.
                  Submitting a request does not create an account or guarantee
                  approval.
                </p>
              </details>
              <details>
                <summary>Does access include everything on this site?</summary>
                <p>
                  No. Internal Daily Brief, research, continuity, and
                  engineering workflows are described to explain the system.
                  They are not automatically included in preview access.
                </p>
              </details>
              <details>
                <summary>Is there a subscription?</summary>
                <p>
                  No paid plans, trial, checkout, or generally available
                  commercial service are offered.
                </p>
              </details>
              <details>
                <summary>Can Delta act on my behalf?</summary>
                <p>
                  Access is not blanket authority. Supported operations retain
                  their own scopes and approvals. The preview does not provide
                  unrestricted autonomous actions or always-on monitoring.
                </p>
              </details>
              <details>
                <summary>Is Delta medical advice?</summary>
                <p>
                  No. Health context is informational, not diagnosis or
                  treatment. Speak with a qualified professional for medical
                  decisions.
                </p>
              </details>
            </div>
          </section>
        </div>
      </main>
    </PublicSite>
  );
}
