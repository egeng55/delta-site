import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicSite, PageIntro, styles } from "@/components/public/PublicSite";

export const metadata = { title: "Ecosystem | Delta", description: "Delta and Geng Systems: connected engineering, distinct products and data boundaries." };
export default function EcosystemPage() {
  return <PublicSite><main id="main">
    <PageIntro label="The ecosystem" title="Delta & Geng Systems" atmosphere="/images/atmosphere/waterfall-stones.jpg">
      <p>One underlying engineering system. Distinct experiences for personal intelligence and client work.</p>
    </PageIntro>
    <section className={`${styles.container} ${styles.section} ${styles.twoColumns}`}>
      <div><p className={styles.eyebrow}>The underlying system</p><h2>Delta</h2><p>Context, research and governed engineering come together in Delta. It supports the development and coordination of Geng Systems while each product keeps its own responsibilities.</p><Link href="/product" className={styles.outlineButton}>Explore Delta <ArrowUpRight size={16} /></Link></div>
      <div><p className={styles.eyebrow}>Applied to client work</p><h2>Geng Systems</h2><p>Marketing intelligence and implementation by Eric Geng. Connected measurements, reviewable reports and a workspace configured around each team.</p><a href="https://geng.systems" className={styles.darkButton}>Visit Geng Systems <ArrowUpRight size={16} /></a></div>
    </section>
    <section className={`${styles.container} ${styles.detailSection}`}>
      <div><h2>Connected does not mean combined.</h2></div><div className={styles.detailContent}><p>Geng Systems has its own product, client deployments and access decisions. A Delta account does not grant Geng access, and client records are not made available to personal Delta conversations.</p><p>The Geng demo uses fictional data and offline examples. The relationship is not a claim that a live Delta agent runs every client workflow.</p><a href="https://demo.geng.systems" className={styles.outlineButton}>Explore the fictional demo <ArrowUpRight size={16} /></a></div>
    </section>
  </main></PublicSite>;
}
