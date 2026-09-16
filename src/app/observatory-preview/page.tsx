import { notFound } from 'next/navigation';
import Observatory from '@/components/observatory/Observatory';
import { observatoryPreview } from '@/lib/observatoryPreview';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Synthetic Observatory design preview', robots: { index: false, follow: false } };
export default function Preview() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <Observatory initialReport={observatoryPreview()} preview />;
}
