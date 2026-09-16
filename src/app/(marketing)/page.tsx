import Link from "next/link";
import {
  AccessBand,
  Arrow,
  PublicSite,
  styles,
} from "@/components/public/PublicSite";
import IntelligenceScene from "@/components/public/IntelligenceScene";

export default function Home() {
  return (
    <PublicSite>
      <main id="main">
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroTop}>
              <p className={styles.eyebrow}>
                The personal intelligence operating system
              </p>
              <span className={styles.status}>In active development</span>
            </div>
            <div className={styles.heroTitle}>
              <h1>Delta</h1>
              <p>
                Your context.
                <br />
                Connected to what comes next.
              </p>
            </div>
            <div className={styles.heroSub}>
              <p>
                Life, research, and the work you build. Delta brings relevant
                evidence into focus, helps you reason through it, and keeps you
                in control of the next move.
              </p>
              <div className={styles.buttonRow}>
                <Link href="/product" className={styles.darkButton}>
                  Explore the system <Arrow />
                </Link>
                <Link href="/access" className={styles.outlineButton}>
                  Request access <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <div className={styles.container}>
          <IntelligenceScene />
        </div>
        <section className={`${styles.container} ${styles.section}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>01 / Beyond a single answer</p>
            <div>
              <h2>
                The important things
                <br />
                don&apos;t happen in isolation.
              </h2>
              <p>
                Recovery changes how you train. New evidence changes what you
                believe. A code change affects more than one file. Delta is
                being built to reason with those connections, not lose them
                between conversations.
              </p>
            </div>
          </div>
          <div className={styles.domains}>
            <article className={styles.domain}>
              <span className={styles.domainNumber}>01 / PERSONAL</span>
              <h3>A clearer read on your day.</h3>
              <p>
                Bring recovery, sleep, logged nutrition, and relevant history
                into one grounded brief. Know what is current, what is missing,
                and what deserves attention.
              </p>
              <ul>
                <li>Daily Intelligence Brief</li>
                <li>Relevant weather and continuity</li>
                <li>Freshness and uncertainty built in</li>
              </ul>
              <Link className={styles.textLink} href="/product#personal">
                Personal context <Arrow />
              </Link>
            </article>
            <article className={styles.domain}>
              <span className={styles.domainNumber}>02 / RESEARCH</span>
              <h3>Go from information to evidence.</h3>
              <p>
                Research a company, examine an opportunity, or understand a
                topic. Keep source quality, provenance, and the limits of the
                evidence in view.
              </p>
              <ul>
                <li>Source-backed prospect research</li>
                <li>Financial education and career context</li>
                <li>Explicit approval for external actions</li>
              </ul>
              <Link className={styles.textLink} href="/product#research">
                Research workflows <Arrow />
              </Link>
            </article>
            <article className={styles.domain}>
              <span className={styles.domainNumber}>03 / ENGINEERING</span>
              <h3>Build with the whole system in view.</h3>
              <p>
                Inspect source, trace declared dependencies, make reviewed
                changes in isolated worktrees, and verify the outcome. Useful
                engineering is more than generated code.
              </p>
              <ul>
                <li>Native inspection and editing tools</li>
                <li>Durable, governed workflows</li>
                <li>Verification before integration</li>
              </ul>
              <Link className={styles.textLink} href="/product#engineering">
                Engineering direction <Arrow />
              </Link>
            </article>
          </div>
          <p className={styles.notice}>
            These are implemented owner workflows and ongoing development areas,
            not a promise of general availability. The public preview is
            narrower.{" "}
            <Link href="/access" className={styles.textLink}>
              See access scope <Arrow />
            </Link>
          </p>
        </section>
        <section className={styles.systemBand}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>02 / How Delta works</p>
            <h2>
              Context makes it relevant.
              <br />
              Evidence makes it accountable.
            </h2>
            <div className={styles.steps}>
              <article>
                <span>01</span>
                <h3>Understand the request</h3>
                <p>
                  Start with the actual question. Bring in only context that can
                  materially help.
                </p>
              </article>
              <article>
                <span>02</span>
                <h3>Check the evidence</h3>
                <p>
                  Distinguish current observations from history, assumptions,
                  and missing information.
                </p>
              </article>
              <article>
                <span>03</span>
                <h3>Review the answer</h3>
                <p>
                  Use bounded review and verification where the workflow
                  supports them. Show uncertainty honestly.
                </p>
              </article>
              <article>
                <span>04</span>
                <h3>Keep you in control</h3>
                <p>
                  A suggestion is not permission to act. Consequential
                  operations require their own authorization.
                </p>
              </article>
            </div>
          </div>
        </section>
        <section className={`${styles.container} ${styles.section}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>03 / Where we are</p>
            <div>
              <h2>
                A working system.
                <br />
                An honest development story.
              </h2>
              <p>
                Delta has grown beyond its health origins. That does not mean
                every internal capability is a public product, or every
                experiment is proven autonomy.
              </p>
            </div>
          </div>
          <div className={styles.statusGrid}>
            <article className={styles.statusItem}>
              <span className={styles.badge}>Private preview</span>
              <h3>Connected WHOOP context</h3>
              <p>
                Manually approved accounts can connect WHOOP and inspect
                owner-scoped context and access controls.
              </p>
            </article>
            <article className={styles.statusItem}>
              <span className={styles.badge}>Owner-operated</span>
              <h3>Briefs, research, and engineering</h3>
              <p>
                Internal workflows with specific evidence and approval
                boundaries. Not bundled into public preview access.
              </p>
            </article>
            <article className={styles.statusItem}>
              <span className={styles.badge}>Being evaluated</span>
              <h3>More capable autonomous work</h3>
              <p>
                Independent reasoning and engineering quality need real-task
                evidence, not a larger list of tools.
              </p>
            </article>
          </div>
          <Link className={styles.textLink} href="/research">
            Read the development status <Arrow />
          </Link>
        </section>
        <AccessBand />
      </main>
    </PublicSite>
  );
}
