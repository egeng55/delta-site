import type { Metadata } from "next";
import Observatory from "@/components/observatory/Observatory";
import { requireObservatoryOwner, readObservatoryReport } from "@/lib/observatoryServer";
import Link from "next/link";
import styles from "@/components/observatory/Observatory.module.css";

export const metadata: Metadata = {
  title: "Delta HQ | Observatory",
  description: "Owner operating surface for Delta engineering.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DeltaHQPage() {
  const access = await requireObservatoryOwner();
  if (access !== 'owner') return <main className={styles.gate}><h1>Delta Observatory</h1><p>{access === 'unconfigured' ? 'Private owner access is not configured. No system report has been loaded.' : 'This workspace is available only to its verified owner.'}</p><Link href="/login?redirect=%2Fhq">Sign in</Link><Link href="/">Return to Delta</Link></main>;
  return <Observatory initialReport={await readObservatoryReport()} />;
}
