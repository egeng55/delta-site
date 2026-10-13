"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./public-site.module.css";

const links = [
  { href: "/product", index: "01", label: "System" },
  { href: "/research", index: "02", label: "Development" },
  { href: "/security", index: "03", label: "Security" },
  { href: "/access", index: "04", label: "Access" },
];

export default function PublicNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <header ref={header} className={styles.header}>
      <div className={styles.navInner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="Delta home"
          onClick={() => setOpen(false)}
        >
          <Image src="/delta-logo.svg" alt="" width={30} height={30} priority />
          <span>DELTA</span>
          <span className={styles.brandDescriptor}>Personal intelligence</span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              <span>{link.index}</span> {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.navActions}>
          <Link href="/login?redirect=/app" className={styles.smallButton}>
            Open Delta <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <button
          ref={button}
          className={styles.menuButton}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="public-menu"
          onClick={() => setOpen(!open)}
        >
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>
      </div>
      {open && (
        <nav
          id="public-menu"
          className={styles.mobileNav}
          aria-label="Mobile navigation"
        >
          {[
            ...links,
            { href: "/contact", label: "Contact" },
            { href: "/login?redirect=/app", label: "Open Delta" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {"index" in link && <small>{link.index}</small>}
              <span>{link.label}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
