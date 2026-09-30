'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, AudioLines, Box, ChevronDown, CircleHelp, Command, Compass, FileText, FlaskConical, FolderGit2, Layers3, LayoutGrid, LockKeyhole, LogOut, Moon, Pause, Play, Search, Settings2, ShieldCheck, Sparkles, Sun, Waves } from 'lucide-react';
import type { WorkspaceAccess } from '@/lib/workspaceAccess';
import {requestJson} from '@/lib/requestJson';
import StudioLab from './StudioLab';
import ControlSummary from './ControlSummary';
import ResultLibrary from './ResultLibrary';
import styles from './DesktopWorkspace.module.css';

const TaskRunner = dynamic(() => import('../observatory/TaskRunner'), { loading: () => <p role="status">Opening the execution desk…</p> });
const RuntimeOverview = dynamic(() => import('../observatory/RuntimeOverview'), { loading: () => <p role="status">Reading runtime observations…</p> });
const EngineeringInventory = dynamic(() => import('../observatory/EngineeringInventory'), { loading: () => <p role="status">Opening engineering…</p> });
const ProviderCosts = dynamic(() => import('../observatory/ProviderCosts'), { loading: () => <p role="status">Opening provider costs…</p> });
type Space = 'personal' | 'studio' | 'control';
const spaces = {personal: 'Personal', studio: 'Studio', control: 'Control'};
const navigation = {
  personal: [{name:'Overview',icon:Compass},{name:'Activity',icon:AudioLines},{name:'Results',icon:FileText},{name:'Connections',icon:Layers3}],
  studio: [{name:'Workbench',icon:Command},{name:'Test lab',icon:FlaskConical},{name:'Engineering',icon:FolderGit2},{name:'Runtime',icon:Box}],
  control: [{name:'Overview',icon:LayoutGrid},{name:'Reports',icon:FileText},{name:'Costs',icon:Waves},{name:'Access',icon:ShieldCheck}],
};
const pageCopy: Record<string, [string,string]> = {
  Activity:['Follow the work.','Requests, decisions, and the evidence behind each result.'],
  Results:['Something to show for it.','Retained outcomes from your connected runtime.'],
  Connections:['Context, on your terms.','Choose what Delta can use. Keep control of the connection.'],
  Workbench:['From intent to execution.','Set the scope. Follow the tools. Review the result.'],
  'Test lab':['Curiosity, with a test bench.','Explore registered interfaces and reproduce the difficult cases.'],
  Engineering:['Build. Inspect. Move forward.','Repository state and change evidence, close to the work.'],
  Runtime:['Under the surface.','Observed activity, availability, and the limits of what is known.'],
  Overview:['The bigger picture.','A clear view of the system, grounded in available evidence.'],
  Reports:['Evidence worth sharing.','A scoped report, with its source and limitations intact.'],
  Costs:['Make every call count.','Recorded provider usage, separate from estimates and limits.'],
  Access:['The right access.','One identity. Clear permissions. Deliberate authority.'],
};

export default function DesktopWorkspace({access,preview=false,initialTask=false}:{access:WorkspaceAccess;preview?:boolean;initialTask?:boolean}) {
  const [selectedSpace,setSpace]=useState<Space>(access.workspaces[0] || 'personal');
  const space=access.workspaces.includes(selectedSpace)?selectedSpace:access.workspaces[0]||'personal';
  const [selectedPage,setPage]=useState(initialTask&&access.workspaces.includes('personal')?'Activity':navigation[access.workspaces[0] || 'personal'][0].name);
  const page=navigation[space].some(item=>item.name===selectedPage)?selectedPage:navigation[space][0].name;
  const [draft,setDraft]=useState('');
  const [palette,setPalette]=useState(false);
  const [query,setQuery]=useState('');
  const [motion,setMotion]=useState(true);
  const [dark,setDark]=useState(false);
  const [help,setHelp]=useState(false);
  const [signingOut,setSigningOut]=useState(false);
  const [signoutError,setSignoutError]=useState('');
  const signoutLock=useRef(false);
  async function signOut() {
    if (preview || signoutLock.current) return;
    signoutLock.current = true;
    setSigningOut(true);
    setSignoutError('');
    try {
      const response = await requestJson('/api/hq/signout', {method: 'POST'});
      if (!response.ok) throw Error();
      // Discard the authenticated document and its private in-memory state after signout.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/login?redirect=%2Fworkspace');
    } catch {
      setSignoutError('Sign out failed. Try again to confirm your session has ended.');
      signoutLock.current = false;
      setSigningOut(false);
    }
  }
  const searchButton=useRef<HTMLButtonElement>(null);
  const canExecute=access.permissions.includes('runtime.execute');
  const owner=access.role==='owner';
  function navigate(next:Space,name:string){if(!access.workspaces.includes(next))return;setSpace(next);setPage(name);setPalette(false);setHelp(false);}
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setPalette(value=>!value);}if(event.key==='Escape'){setPalette(false);setHelp(false);searchButton.current?.focus();}};
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[]);
  const title=pageCopy[page];
  const isHome=space==='personal'&&page==='Overview';
  const tasks=()=>canExecute?<div className={styles.runtimeSurface}><TaskRunner input={draft} preview={preview}/></div>:<Empty icon="lock" title="Your execution connection is not provisioned" text="This account can use its permitted workspace. Personal task isolation must be connected before it can use the owner's local runtime."/>;
  const links=access.workspaces.flatMap(s=>navigation[s].map(p=>({space:s,...p}))).filter(p=>(p.name+' '+p.space).toLowerCase().includes(query.toLowerCase()));
  return <div className={styles.app} data-theme={dark?'dark':'light'} data-motion={motion?'on':'off'}>
    <a href="#workspace-main" className={styles.skip}>Skip to workspace</a>
    <aside className={styles.sidebar}>
      <Link href="/workspace" className={styles.brand} aria-label="Delta workspace"><span className={styles.deltaMark}>Δ</span><span>delta<span className={styles.brandDot}>.</span></span></Link>
      <div className={styles.spacePicker}><span className={styles.micro}>YOUR WORKSPACE</span><div role="group" aria-label="Workspaces">{access.workspaces.map(s=><button type="button" key={s} aria-pressed={space===s} onClick={()=>navigate(s,navigation[s][0].name)}>{spaces[s]}</button>)}</div></div>
      <button ref={searchButton} className={styles.search} onClick={()=>{setQuery('');setPalette(true);}}><Search size={16}/><span>Find your way</span><kbd>⌘ K</kbd></button>
      <nav aria-label={`${spaces[space]} navigation`} className={styles.navigation}>{navigation[space].map(({name,icon:Icon},i)=><button key={name} aria-current={page===name?'page':undefined} onClick={()=>navigate(space,name)}><Icon size={18}/><span>{name}</span><small>0{i+1}</small></button>)}</nav>
      <div className={styles.sidebarBottom}><div className={styles.sidebarNote}><div className={styles.miniOrbit} aria-hidden="true"/><p>A little clarity.<br/>A lot of possibility.</p></div><button className={styles.utility} onClick={()=>setHelp(v=>!v)}><CircleHelp size={17}/>Workspace guide<ArrowUpRight size={14}/></button><div className={styles.account}><span className={styles.avatar}>{owner?'O':access.role.charAt(0).toUpperCase()}</span><div><b>{owner?'Your Delta':'Private workspace'}</b><small>{owner?'Platform owner':access.role}</small></div><LockKeyhole size={14}/></div></div>
    </aside>
    <div className={styles.canvas}>
      <header className={styles.topbar}><div><span>Workspace</span><span className={styles.slash}>/</span><b>{spaces[space]}</b><ChevronDown size={13}/></div><div className={styles.topActions}><span className={styles.sessionBadge}><span/>{preview?'Design preview':'Authenticated workspace'}</span><button aria-label={motion?'Pause ambient motion':'Resume ambient motion'} aria-pressed={!motion} onClick={()=>setMotion(v=>!v)}>{motion?<Pause size={15}/>:<Play size={15}/>}</button><button aria-label={dark?'Use light appearance':'Use dark appearance'} onClick={()=>setDark(v=>!v)}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button><button className={styles.signout} disabled={preview||signingOut} aria-label={signingOut?'Signing out':'Sign out of Delta'} onClick={()=>void signOut()}><LogOut size={15}/></button></div></header>
      {preview&&<div className={styles.previewNotice}><FlaskConical size={15}/><span>Local design preview. Simulations work here; personal data and live operations are disconnected.</span><Link href="/workspace">Open secure workspace <ArrowUpRight size={13}/></Link></div>}
      <main id="workspace-main" className={styles.main}>{signoutError&&<p className={styles.signoutError} role="alert">{signoutError}</p>}
        {help&&<section className={styles.guide} aria-label="Workspace guide"><div><h2>One Delta. Three perspectives.</h2><p>Personal is for outcomes. Studio is for testing and building. Control is for reporting and access. Your verified permissions determine which workspaces and operations are available.</p></div><button onClick={()=>setHelp(false)}>Close guide</button></section>}
        {isHome?<>
          <section className={styles.hero}><div className={styles.heroCopy}><p className={styles.eyebrow}><span/>A SPACE FOR WHAT COMES NEXT</p><h1>Good things start<br/>with a <em>clear intent.</em></h1><p className={styles.heroSub}>Think it through. Set it in motion.<br/>Keep the work, and its evidence, in view.</p><span className={styles.heroIndex}>01 — PERSONAL INTELLIGENCE</span></div><div className={styles.orbitScene} aria-hidden="true"><div className={styles.orbitGlow}/><svg viewBox="0 0 440 360"><defs><linearGradient id="delta-orbit-gradient" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#dceeff"/><stop offset=".48" stopColor="#4689ef"/><stop offset="1" stopColor="#1351c9"/></linearGradient></defs><g className={styles.orbitRings} fill="none" stroke="currentColor"><ellipse cx="220" cy="180" rx="177" ry="76" transform="rotate(-30 220 180)"/><ellipse cx="220" cy="180" rx="160" ry="78" transform="rotate(40 220 180)"/><ellipse cx="220" cy="180" rx="140" ry="76" transform="rotate(100 220 180)"/></g><g className={styles.prism}><path d="M220 83 300 243 140 243Z" fill="url(#delta-orbit-gradient)"/><path d="m220 83 0 160-80 0Z" fill="#cce5ff" fillOpacity=".48"/><path d="m220 83 80 160-80-39Z" fill="#1658c5" fillOpacity=".55"/><path d="m140 243 80-39 80 39Z" fill="#78aeff" fillOpacity=".85"/></g><circle cx="351" cy="94" r="5" fill="#5c9aff"/><circle cx="91" cy="243" r="3" fill="#296cea"/></svg><span className={styles.orbitCaption}>CONTEXT → INTENT → OUTCOME</span></div></section>
          <section className={styles.composer} aria-label="New request"><div className={styles.composerLabel}><span><Sparkles size={16}/>What would you like to move forward?</span><span>YOUR NEXT MOVE</span></div><label className={styles.srOnly} htmlFor="workspace-draft">Your request</label><textarea id="workspace-draft" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={4000} placeholder="Tell Delta what a good result looks like…"/><div className={styles.composerFoot}><span>{draft.length?`${draft.length.toLocaleString()} / 4,000`:'Review the scope before execution.'}</span><button className={styles.primary} disabled={!draft.trim()} onClick={()=>navigate('personal','Activity')}>Review request <ArrowRight size={17}/></button></div></section>
          <div className={styles.sectionHeading}><h2>A few places to start</h2><span>SMALL STEPS. REAL PROGRESS.</span></div><div className={styles.starters}>{[{name:'See what Delta can do',text:'Review the registered capabilities and their current availability.',icon:Compass,index:'01'},{name:'Understand the workspace',text:'Review repositories and worktrees without changing files.',icon:FolderGit2,index:'02'},{name:'Move a project forward',text:'Prepare a bounded engineering task with clear acceptance checks.',icon:ArrowUpRight,index:'03'}].map(({name,text,icon:Icon,index})=><button key={name} onClick={()=>{setDraft(text);document.getElementById('workspace-draft')?.focus();}}><span className={styles.starterTop}><Icon size={20}/><small>{index}</small></span><h3>{name}</h3><p>{text}</p><ArrowUpRight className={styles.starterArrow} size={19}/></button>)}</div>
          <div className={styles.homeFooter}><span><ShieldCheck size={15}/>Your permissions travel with the work.</span><button onClick={()=>navigate('personal','Connections')}>Manage your context <ArrowUpRight size={14}/></button></div>
        </>:<div key={space+page} className={styles.pageEntrance}><header className={styles.pageHeader}><p className={styles.eyebrow}>{spaces[space].toUpperCase()} / {page.toUpperCase()}</p><h1>{title[0]}</h1><p>{title[1]}</p></header>
          {(page==='Activity'||page==='Workbench')&&<><div className={styles.requestBar}><label htmlFor="active-request">Task objective</label><textarea id="active-request" maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Describe the result, then choose the supported execution mode below."/><p>The connected runtime currently supports capability audits, worktree reviews, and prepared engineering requests. Free text supplies the objective; the selected mode determines execution.</p></div>{tasks()}</>}
          {page==='Results'&&<ResultLibrary enabled={canExecute&&!preview}/>}
          {page==='Connections'&&<><div className={styles.connectionGrid}>{[{name:'Local runtime',label:canExecute?'Owner-scoped execution':'Not provisioned for this account',icon:Box},{name:'Account connections',label:'Manage permissions in account settings',icon:Layers3},{name:'Memory & preferences',label:'No personal memory is loaded in this workspace',icon:Settings2}].map(({name,label,icon:Icon})=><section key={name} className={styles.panel}><Icon size={22}/><h2>{name}</h2><p>{label}</p>{name==='Account connections'&&<Link href="/settings">Open account settings <ArrowUpRight size={15}/></Link>}{name==='Local runtime'&&canExecute&&<button onClick={()=>navigate('personal','Activity')}>Check runtime session <ArrowRight size={15}/></button>}</section>)}</div><Empty icon="shield" title="Connected by you" text="New data connections remain off until explicitly configured. A workspace grant does not grant access to another person's accounts."/></>}
          {page==='Test lab'&&<StudioLab preview={preview} canInspectRuntime={owner}/>}
          {page==='Engineering'&&(owner?<div className={styles.runtimeSurface}><EngineeringInventory preview={preview}/></div>:<Empty title="Repository evidence is owner-scoped" text="Use the test lab for provider-free simulations. Source inspection requires a separate runtime connection and repository grant."/>)}
          {page==='Runtime'&&(owner?<div className={styles.runtimeSurface}><RuntimeOverview preview={preview}/></div>:<Empty title="Runtime inspection requires an owner session" text="Studio access includes fixture simulations. It does not expose private execution history."/>)}
          {space==='control'&&(page==='Overview'||page==='Reports')&&<ControlSummary preview={preview} reportMode={page==='Reports'}/>}
          {page==='Costs'&&(owner?<div className={styles.runtimeSurface}><ProviderCosts preview={preview}/><div className={styles.panel}><h3>Limits stay with execution</h3><p>Provider usage is a separate source from runtime reservations and per-task limits. Review the prepared request's cap in the execution desk before running it.</p><button onClick={()=>navigate('studio','Workbench')}>Open execution desk <ArrowUpRight size={15}/></button></div></div>:<Empty title="Billing details require an owner grant" text="This role can view permitted summary reports. Provider account costs are not shared by its workspace grant."/>)}
          {page==='Access'&&<section className={styles.panel}><div className={styles.accessHeading}><ShieldCheck size={24}/><div><h2>{owner?'Your owner authority':'Your workspace access'}</h2><p>Verified identity · {access.role}</p></div></div><dl className={styles.accessRows}><div><dt>Workspaces</dt><dd>{access.workspaces.map(s=>spaces[s]).join(' · ')}</dd></div><div><dt>Runtime execution</dt><dd>{canExecute?'Owner-authorized operations':'Not granted'}</dd></div><div><dt>Privilege changes</dt><dd>Server-managed grants; no self-assignment</dd></div><div><dt>Agent authority</dt><dd>Scoped to each approved task</dd></div></dl><details><summary>View granted permissions</summary><ul>{access.permissions.map(p=><li key={p}><code>{p}</code></li>)}</ul></details><p className={styles.finePrint}>Membership editing and account recovery are not connected here yet. Owner identity and role grants are configured on the server; this view cannot change them.</p></section>}
        </div>}
        <footer className={styles.footer}><span>DELTA / INTELLIGENCE IN MOTION</span><span>{preview?'LOCAL PREVIEW':'PRIVATE WORKSPACE'} <ArrowDownLeft size={12}/></span></footer>
      </main>
    </div>
    {palette&&<div className={styles.paletteBackdrop} onClick={()=>setPalette(false)}><section role="dialog" aria-modal="true" aria-label="Find your way" className={styles.palette} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Tab'){const els=e.currentTarget.querySelectorAll<HTMLElement>('button,input');const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}><div className={styles.paletteInput}><Search size={20}/><input aria-label="Search workspace pages" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Where would you like to go?"/><button onClick={()=>{setPalette(false);searchButton.current?.focus();}}>Esc</button></div><div className={styles.paletteResults}>{links.length?links.map(({space:s,name,icon:Icon})=><button key={s+name} onClick={()=>navigate(s,name)}><Icon size={18}/><span>{name}</span><small>{spaces[s]}</small><ArrowUpRight size={16}/></button>):<p>No pages match “{query}”.</p>}</div></section></div>}
  </div>;
}

function Empty({title,text,icon='lock'}:{title:string;text:string;icon?:'lock'|'shield'}){return <section className={styles.empty}>{icon==='shield'?<ShieldCheck size={28}/>:<LockKeyhole size={28}/>}<h2>{title}</h2><p>{text}</p></section>;}
