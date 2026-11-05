"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareText, LayoutDashboard, History, Plug, Settings, Globe, PanelsTopLeft } from "lucide-react";
import styles from "./WorkspaceLinks.module.css";

const links = [
  { href: "/workspace", label: "Workspace", icon: PanelsTopLeft },
  { href: "/app", label: "Chat", icon: MessageSquareText },
  { href: "/command", label: "Connections", icon: Plug },
  { href: "/hq", label: "HQ", icon: LayoutDashboard },
  { href: "/hq/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/", label: "Delta website", icon: Globe },
] as const;

export default function WorkspaceLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  return <nav className={`${styles.links} ${compact ? styles.compact : ""}`} aria-label="Delta destinations">
    {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} prefetch={false} aria-current={pathname === href ? "page" : undefined} title={href.startsWith("/hq") ? `${label} (owner access)` : label}>
      <Icon size={15} aria-hidden="true" /><span>{label}</span>
    </Link>)}
  </nav>;
}
