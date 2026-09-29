'use client';
import { useState } from 'react';
import styles from './Atmosphere.module.css';
/** Decorative only: this scene never represents task activity or runtime health. */
export default function Atmosphere({ compact = false }: { compact?: boolean }) {
  const [paused, setPaused] = useState(false);
  return <section className={`${styles.scene} ${compact ? styles.compact : ''}`} data-paused={paused} aria-label="Workspace atmosphere">
    <div className={styles.art} aria-hidden="true">
      <div className={styles.halo} /><div className={styles.haloSecond} />
      <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
        <g className={styles.orbits} fill="none" stroke="currentColor" strokeWidth=".7">
          <ellipse cx="555" cy="150" rx="200" ry="72" transform="rotate(-24 555 150)" />
          <ellipse cx="555" cy="150" rx="180" ry="98" transform="rotate(24 555 150)" />
          <ellipse cx="555" cy="150" rx="120" ry="122" transform="rotate(-12 555 150)" />
        </g>
        <g className={styles.prism}><path d="M555 58 632 198 478 198Z" fill="#719681" fillOpacity=".10" stroke="#547c64" strokeWidth="1" /><path d="m555 90 51 91H504Z" fill="#a6babb" fillOpacity=".22" stroke="#86a59b" strokeWidth=".6"/><path d="m555 58 0 140m-77 0 77-48 77 48" fill="none" stroke="#719681" strokeOpacity=".5" /></g>
        <g className={styles.points} fill="#52735b"><circle cx="378" cy="164" r="3"/><circle cx="683" cy="93" r="2"/><circle cx="622" cy="239" r="2.5"/></g>
      </svg>
    </div>
    <div className={styles.copy}><span>DELTA / A SPACE TO THINK</span><h2>{compact ? 'From intent to something real.' : 'Room for your next idea.'}</h2><p>{compact ? 'Set the direction. Follow the work. Review the result.' : 'A quieter place for ambitious things.'}</p></div>
    <button type="button" className={styles.pause} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume ambient motion' : 'Pause ambient motion'}</button>
  </section>;
}
