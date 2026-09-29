'use client';
import Link from 'next/link';
import { useState } from 'react';
import styles from './PersonalWorkspace.module.css';
const pages = ['Ask Delta', 'My tasks', 'Results', 'Connections', 'Preferences'] as const;
export default function PersonalWorkspace() {
  const [page, setPage] = useState<typeof pages[number]>('Ask Delta');
  const [draft, setDraft] = useState('');
  return <div className={styles.shell}>
    <header className={styles.header}><Link href="/" className={styles.brand}>Delta.</Link><span>Your personal workspace</span></header>
    <main className={styles.body}>
    <nav className={styles.nav} aria-label="Personal navigation">{pages.map(name => <a key={name} href={'#' + name.toLowerCase().replaceAll(' ', '-')} aria-current={page === name ? 'page' : undefined} onClick={event => { event.preventDefault(); setPage(name); }}>{name}</a>)}</nav>
    <p className={styles.notice} role="status">Design preview. Your personal data is not connected.</p>
    <section className={styles.hero}>
    <p className={styles.eyebrow}>A little clarity. A little momentum.</p>
    <h1>{page === 'Ask Delta' ? 'What would you like to move forward?' : page}</h1>
    {page === 'Ask Delta' ? <>
      <h2>A place to think, plan, and turn an intention into something finished.</h2>
      <div className={styles.composer}><label htmlFor="personal-draft">Your request</label><textarea id="personal-draft" maxLength={4000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Tell Delta what a good result would look like…" />
      <div className={styles.footer}><span>{draft.length} / 4,000 · Draft only</span><button disabled>Sending is not available in this preview</button></div></div>
      <div className={styles.prompts} aria-label="Request starters">{[['Plan my day','Help me plan my day. Ask what matters most before making a schedule.'],['Explore an idea','Help me research an idea. Start by clarifying the question and the result I need.'],['Finish something','Help me turn an unfinished project into a clear next step.']].map(([label,text])=><button key={label} onClick={()=>{setDraft(text);document.getElementById('personal-draft')?.focus();}}>{label} ↗</button>)}</div>
      <p>Your draft stays here while you explore. Reloading clears it.</p>
    </> : <div className={styles.empty}>{page === 'My tasks' ? <><h2>Your work, in one place</h2><p>Once connected, see your requests, progress, and decisions waiting for you.</p></> : page === 'Results' ? <><h2>What Delta has prepared for you</h2><p>Your completed work and any next steps will appear here when connected.</p></> : page === 'Connections' ? <><h2>Choose what Delta can use</h2><p>Your connected services and their permissions will appear here. This preview cannot connect or change accounts.</p></> : <><h2>Make Delta work for you</h2><p>Your communication and personal preferences will appear here when connected.</p></>}<button onClick={()=>setPage('Ask Delta')}>Start with a request →</button></div>}
    </section></main>
  </div>;
}
