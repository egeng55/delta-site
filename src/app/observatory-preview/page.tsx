import { notFound } from 'next/navigation';
import PersonalWorkspace from '@/components/personal/PersonalWorkspace';
import Observatory from '@/components/observatory/Observatory';
import { localArchitecturePreview } from '@/lib/localArchitecturePreview';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Delta local architecture preview', robots: { index: false, follow: false } };
export default async function Preview({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  if ((await searchParams).view === 'personal') return <PersonalWorkspace />;
  return <Observatory initialReport={localArchitecturePreview()} preview />;
}
