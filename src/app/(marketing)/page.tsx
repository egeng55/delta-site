import Image from "next/image";
import Link from "next/link";
import {
  AccessBand,
  Arrow,
  PublicSite,
  styles,
} from "@/components/public/PublicSite";

export default function Home() {
  return (
    <PublicSite>
      <main id="main">
        <section className={styles.hero}>
          <Image
            className={styles.heroImage}
            src="/images/hero/mountain-moon.jpg"
            alt="Snow-covered mountains beneath a violet evening sky"
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={`${styles.container} ${styles.heroContent}`}>
            <div className={styles.heroTop}>
              <p className={styles.eyebrow}>Personal intelligence operating system</p>
              <span className={styles.status}>Private preview</span>
            </div>
            <div className={styles.heroTitle}>
              <Image
                className={styles.heroMark}
                src="/delta-logo.svg"
                alt=""
                width={88}
                height={88}
              />
              <h1>Delta</h1>
              <p>Your context, carried into the next decision.</p>
            </div>
            <div className={styles.heroSub}>
              <p>
                Talk through life, research, and the work you are building.
                Delta brings forward the context that belongs to your account,
                keeps evidence attached, and leaves consequential actions under
                your control.
              </p>
              <div className={styles.buttonRow}>
                <Link href="/login?redirect=/app" className={styles.lightButton}>
                  Open Delta <Arrow />
                </Link>
                <Link href="/product" className={styles.glassButton}>
                  Explore the system <Arrow />
                </Link>
              </div>
            </div>
            <div className={styles.heroSignals} aria-label="Delta product principles">
              <span>Private by account</span>
              <span>Evidence-aware</span>
              <span>Owner-controlled</span>
            </div>
          </div>
        </section>

        <section className={styles.introBand}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>Not another blank chat</p>
            <div className={styles.introGrid}>
              <h2>Start where you left off.</h2>
              <p>
                A useful conversation should understand the account it belongs
                to without confusing history with current truth. Delta is built
                to carry relevant context forward, show what is uncertain, and
                ask before crossing an action boundary.
              </p>
              <Link href="/security" className={styles.textLink}>
                See the privacy boundary <Arrow />
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.conversationBand}>
          <div className={styles.container}>
            <div className={styles.conversationGrid}>
              <div className={styles.conversationCopy}>
                <p className={styles.eyebrow}>One place to think</p>
                <h2>A conversation that belongs to you.</h2>
                <p>
                  Every approved account has its own authenticated Delta
                  workspace. Your questions and available context stay scoped
                  to that account. Internal operator tools remain separate from
                  the product you use.
                </p>
                <Link href="/login?redirect=/app" className={styles.textLink}>
                  Enter your workspace <Arrow />
                </Link>
              </div>
              <div className={styles.chatPreview} aria-label="Delta chat preview">
                <div className={styles.chatPreviewHeader}>
                  <Image src="/delta-logo.svg" alt="" width={28} height={28} />
                  <span>Delta</span>
                  <span>Private account</span>
                </div>
                <div className={styles.chatPreviewBody}>
                  <p className={styles.previewUser}>
                    Help me understand what deserves attention today.
                  </p>
                  <div className={styles.previewDelta}>
                    <span>DELTA</span>
                    <p>
                      I can help separate what is current, what is carried from
                      earlier context, and what still needs evidence. Where
                      should we begin?
                    </p>
                  </div>
                </div>
                <div className={styles.chatPreviewComposer}>
                  <span>Ask Delta</span>
                  <span aria-hidden="true">↑</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.container} ${styles.section}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>A wider view</p>
            <div>
              <h2>The same intelligence across the parts of life that connect.</h2>
              <p>
                Delta is not a collection of unrelated dashboards. It is one
                governed conversation surface that can draw on approved context
                when that context materially improves the answer.
              </p>
            </div>
          </div>
          <div className={styles.domains}>
            <article className={styles.domain}>
              <span className={styles.domainNumber}>01 / PERSONAL</span>
              <h3>Understand your current state.</h3>
              <p>
                Bring recovery, sleep, nutrition, weather, and continuity into
                a grounded conversation without turning missing data into fact.
              </p>
            </article>
            <article className={styles.domain}>
              <span className={styles.domainNumber}>02 / RESEARCH</span>
              <h3>Keep evidence attached.</h3>
              <p>
                Investigate companies and opportunities while preserving
                sources, uncertainty, and the difference between research and
                permission to act.
              </p>
            </article>
            <article className={styles.domain}>
              <span className={styles.domainNumber}>03 / BUILD</span>
              <h3>Work with the system in view.</h3>
              <p>
                Understand architecture, make bounded changes, and verify the
                result without confusing generated activity with completed work.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.photoBand}>
          <Image
            src="/images/hero/lake-sunset.jpg"
            alt="A quiet lake reflecting the last light of sunset"
            fill
            sizes="100vw"
          />
          <div className={styles.photoShade} aria-hidden="true" />
          <div className={`${styles.container} ${styles.photoCopy}`}>
            <p className={styles.eyebrow}>Context without overreach</p>
            <h2>Memory should make Delta more useful, not less accountable.</h2>
            <p>
              Account context, temporary conversations, connected sources, and
              action approvals are separate controls. You should always be able
              to understand which boundary you are using.
            </p>
          </div>
        </section>

        <section className={styles.systemBand}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>How Delta responds</p>
            <h2>Relevant context. Visible uncertainty. Explicit authority.</h2>
            <div className={styles.steps}>
              <article>
                <span>01</span>
                <h3>Understand</h3>
                <p>Begin with the request and the account it belongs to.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Ground</h3>
                <p>Use only context and evidence that can materially help.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Distinguish</h3>
                <p>Keep observations, inferences, conflicts, and unknowns separate.</p>
              </article>
              <article>
                <span>04</span>
                <h3>Ask</h3>
                <p>Require a fresh approval before a consequential action.</p>
              </article>
            </div>
          </div>
        </section>
        <AccessBand />
      </main>
    </PublicSite>
  );
}
