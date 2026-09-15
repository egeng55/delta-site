import Image from "next/image";
import Link from "next/link";

const links = [
  { label: "Product", href: "/product" },
  { label: "Private preview", href: "/access" },
  { label: "Research", href: "/research" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Browser storage", href: "/cookies" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/delta-logo.svg" alt="Delta" width={36} height={36} />
            <span className="font-semibold">Delta Personal Intelligence</span>
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            A private preview for secure, owner-authorized intelligence across
            personal data and tools. Not medical advice.
          </p>
        </div>
        <nav aria-label="Footer" className="flex max-w-xl flex-wrap gap-x-5 gap-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-border pt-5 text-xs text-muted">
        &copy; {new Date().getFullYear()} Delta. Personal preview; no paid plans.
      </div>
    </footer>
  );
}
