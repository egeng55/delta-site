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
              <Link href="/product">Product</Link>
              <Link href="/security">Security</Link>
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
