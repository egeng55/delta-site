import {notFound} from 'next/navigation';
import DesktopWorkspace from '@/components/desktop/DesktopWorkspace';
import {workspaceAccessFor,type WorkspaceRole} from '@/lib/workspaceAccess';
export const dynamic='force-dynamic';
export const metadata={title:'Delta | Local workspace preview',robots:{index:false,follow:false}};
export default async function WorkspacePreview({searchParams}:{searchParams:Promise<{role?:string}>}){
  if(process.env.NODE_ENV!=='development')notFound();
  const role=(await searchParams).role;
  const allowed=['owner','consumer','developer','stakeholder','admin'];
  const previewRole=allowed.includes(role??'')?role as WorkspaceRole:'owner';
  // Fixed synthetic identity; preview components do not read authenticated data.
  return <DesktopWorkspace preview access={workspaceAccessFor('00000000-0000-0000-0000-000000000000',previewRole)}/>;
}
