import type {Metadata} from 'next';
import Link from 'next/link';
import DesktopWorkspace from '@/components/desktop/DesktopWorkspace';
import {getWorkspaceAccess} from '@/lib/workspaceAccessServer';
import styles from './workspace-gate.module.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Delta | Your workspace',description:'Personal intelligence, a development studio, and a clear view of the system.',robots:{index:false,follow:false}};
export default async function WorkspacePage({searchParams}: {searchParams?:Promise<{task?:string}>}){
  const result=await getWorkspaceAccess();
  if(result.status!=='authenticated')return <main className={styles.gate}><span className={styles.mark}>Δ</span><p>DELTA WORKSPACE</p><h1>A space for<br/>what comes next.</h1><h2>{result.status==='unconfigured'?'Workspace access needs configuration.':result.status==='denied'?'This account cannot enter the workspace.':'Your work starts with you.'}</h2><p>{result.status==='unconfigured'?'Configure the verified owner identity and authentication service on the server. No private data has been loaded.':'Sign in with your verified account. Your permissions determine the workspaces you can access.'}</p><Link href="/login?redirect=%2Fworkspace">Sign in to Delta →</Link><Link href="/">Return home</Link></main>;
  const task=(await searchParams)?.task;
  const taskId=task&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(task)?task:null;
  // A task-link navigation must reset the local page selection, including client-side transitions.
  return <DesktopWorkspace key={taskId??'overview'} access={result.access} initialTask={Boolean(taskId)}/>;
}
