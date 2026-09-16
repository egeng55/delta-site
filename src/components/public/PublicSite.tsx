import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
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
              Delta
            </Link>
            <p>
              Personal intelligence.
              <br />A wider view. A better next move.
            </p>
            <nav aria-label="Footer">
              <Link href="/product">The system</Link>
              <Link href="/research">Development</Link>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} Delta</span>
            <span>Private preview · No paid plans</span>
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
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className={`${styles.container} ${styles.pageIntro}`}>
      <p className={styles.eyebrow}>{label}</p>
      <h1>{title}</h1>
      <div className={styles.lead}>{children}</div>
    </header>
  );
}

export function AccessBand() {
  return (
    <section className={styles.accessBand}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>
          Built deliberately. Opened thoughtfully.
        </p>
        <div className={styles.accessRow}>
          <h2>Get closer to Delta.</h2>
          <Link href="/access" className={styles.darkButton}>
            Explore private access <Arrow />
          </Link>
        </div>
        <p>Manual approval. Clear boundaries. No paid subscription.</p>
      </div>
    </section>
  );
}
