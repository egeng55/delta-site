'use client';
import { useState } from 'react';
import styles from '../observatory/WorkspaceSection.module.css';
const pages = ['Ask Delta', 'My tasks', 'Results', 'Connections', 'Preferences'] as const;
export default function PersonalWorkspace() {
  const [page, setPage] = useState<typeof pages[number]>('Ask Delta');
  const [draft, setDraft] = useState('');
  return <main className={styles.panel} style={{ maxWidth: 960, margin: '24px auto' }}>
    <p>Delta · Personal workspace</p>
    <p role="status">Design preview. Your personal data is not connected.</p>
    <nav aria-label="Personal navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>{pages.map(name => <a key={name} href={'#' + name.toLowerCase().replaceAll(' ', '-')} aria-current={page === name ? 'page' : undefined} onClick={event => { event.preventDefault(); setPage(name); }}>{name}</a>)}</nav>
    <h1>{page}</h1>
    {page === 'Ask Delta' ? <><h2>What would you like help with?</h2><label htmlFor="personal-draft">Your request</label><textarea id="personal-draft" maxLength={4000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Plan my day, research a question, or help me finish something." /><p>Your draft stays here while you explore. Reloading clears it.</p><button disabled>Sending is not available in this preview</button></> : page === 'My tasks' ? <><h2>Your work, in one place</h2><p>Once connected, see your requests, progress, and decisions waiting for you.</p></> : page === 'Results' ? <><h2>What Delta has prepared for you</h2><p>Your completed work and any next steps will appear here when connected.</p></> : page === 'Connections' ? <><h2>Choose what Delta can use</h2><p>Your connected services and their permissions will appear here. This preview cannot connect or change accounts.</p></> : <><h2>Make Delta work for you</h2><p>Your communication and personal preferences will appear here when connected.</p></>}
  </main>;
}
