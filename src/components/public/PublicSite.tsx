import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import AtmosphereBackdrop from "./AtmosphereBackdrop";
import PublicNavigation from "./PublicNavigation";
import styles from "./public-site.module.css";

export { styles };

export function PublicSite({ children }: { children: ReactNode }) {
  return (
    <div className={styles.site}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <PublicNavigation />
      {children}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <Link href="/" className={styles.brand}>
              <Image src="/delta-logo.svg" alt="" width={28} height={28} />
              <span>DELTA</span>
            </Link>
            <h2>See what changed.<br />Know what matters next.</h2>
            <nav aria-label="Footer">
              <Link href="/#examples"><span>01</span> Meet Delta</Link>
              <Link href="/product"><span>02</span> Product</Link>
              <Link href="/research"><span>03</span> Development</Link>
              <Link href="/security"><span>04</span> Security</Link>
              <Link href="/access"><span>05</span> Request access</Link>
            </nav>
          </div>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} DELTA</span>
            <span>PRIVATE PREVIEW · ANN ARBOR, MI</span>
            <nav aria-label="Legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/cookies">Browser storage</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export function PageIntro({
  label,
  title,
  children,
  atmosphere,
  atmospherePosition,
}: {
  label: string;
  title: string;
  children: ReactNode;
  atmosphere?: string;
  atmospherePosition?: string;
}) {
  return (
    <header
      className={`${styles.pageIntro} ${atmosphere ? styles.pageIntroAtmosphere : ""}`}
    >
      {atmosphere ? (
        <AtmosphereBackdrop
          src={atmosphere}
          treatment="page"
          position={atmospherePosition}
        />
      ) : null}
      <div className={`${styles.container} ${styles.pageIntroContent}`}>
        <p className={styles.eyebrow}>{label}</p>
        <h1>{title}</h1>
        <div className={styles.lead}>{children}</div>
      </div>
    </header>
  );
}

export function AccessBand() {
  return (
    <section className={styles.accessBand}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Your account. Your context.</p>
        <div className={styles.accessRow}>
          <h2>Continue the conversation.</h2>
          <div className={styles.buttonRow}>
            <Link href="/login?redirect=/app" className={styles.darkButton}>
              Open Delta <Arrow />
            </Link>
            <Link href="/access" className={styles.outlineButton}>
              Request access <Arrow />
            </Link>
          </div>
        </div>
        <p>
          Private preview. Account-scoped context. Explicit approval for actions.
        </p>
      </div>
    </section>
  );
}
