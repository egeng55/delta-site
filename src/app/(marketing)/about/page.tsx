import type { Metadata } from "next";
import {
  AccessBand,
  PageIntro,
  PublicSite,
  styles,
} from "@/components/public/PublicSite";

export const metadata: Metadata = {
  title: "About | Delta",
  description:
    "Delta is building a personal intelligence operating system around context, evidence, and owner control.",
};

export default function AboutPage() {
  return (
    <PublicSite>
      <main id="main">
        <PageIntro
          label="Why Delta"
          title="Intelligence should understand the larger situation."
        >
          <p>
            We started with health context. The deeper problem was broader:
            useful information was scattered, answers forgot their assumptions,
            and tools did not understand the systems around them.
          </p>
        </PageIntro>
        <section
          className={`${styles.container} ${styles.section} ${styles.twoColumns}`}
        >
          <div>
            <p className={styles.eyebrow}>
              From health context to Intelligence OS
            </p>
            <h2>A more connected kind of help.</h2>
            <p>
              Delta brings personal context, research, and engineering into a
              governed system. The aim is not another place to ask the same
              question. It is better reasoning about the situation you are
              actually in.
            </p>
            <p>
              That means knowing where evidence came from, when it was true,
              what remains uncertain, and whether there is permission to do
              anything about it.
            </p>
          </div>
          <div>
            <p className={styles.eyebrow}>What we believe</p>
            <h2>Capability without overreach.</h2>
            <p>
              A helpful system should be able to say that it does not know. It
              should distinguish an observation from an inference, a suggestion
              from an action, and a successful command from a solved problem.
            </p>
            <p>
              We are building toward more capable autonomous work through
              bounded evaluation. Owner control and honest reporting are part of
              that goal, not features to discard along the way.
            </p>
          </div>
        </section>
        <section className={`${styles.container} ${styles.detailSection}`}>
          <div>
            <p className={styles.eyebrow}>The people</p>
            <h2>
              Built in Ann Arbor,
              <br />
              Michigan.
            </h2>
          </div>
          <div className={styles.detailContent}>
            <p>
              Delta is being developed by Eric Geng and Rahib Malik. It remains
              a deliberately small, evolving system, with request-based access
              rather than a broad public launch.
            </p>
            <div className={styles.people}>
              <article>
                <h3>Eric Geng</h3>
                <p>Co-founder</p>
              </article>
              <article>
                <h3>Rahib Malik</h3>
                <p>Co-founder</p>
              </article>
            </div>
          </div>
        </section>
        <AccessBand />
      </main>
    </PublicSite>
  );
}
