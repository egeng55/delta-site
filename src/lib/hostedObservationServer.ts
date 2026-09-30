import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {cache} from 'react';
import {parseHostedObservation} from './hostedObservation';

// Request-local auth, never a globally cached user client or service-role credential.
export async function observationClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,owner=process.env.DELTA_HQ_OWNER_USER_ID;
 if(!url||!key||!owner)return null;
 try{
 const jar=await cookies();
 const client=createServerClient(url,key,{global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(5000)})},cookies:{getAll:()=>jar.getAll(),setAll:items=>{try{for(const i of items)jar.set(i.name,i.value,i.options);}catch{/* server component */}}}});
 const {data,error}=await client.auth.getUser();
 if(error||!data.user||data.user.id!==owner||data.user.is_anonymous||!data.user.email_confirmed_at)return null;
 return {client,owner};
 }catch{return null;}
}
export const readHostedObservation=cache(async()=>{
 if(process.env.DELTA_HQ_HOSTED_OBSERVATIONS!=='1')return null;
 try{const auth=await observationClient();if(!auth)return null;
 const {data,error}=await auth.client.from('hq_observations').select('payload').eq('owner_id',auth.owner).maybeSingle();
 return error||!data?null:parseHostedObservation(data.payload);
 }catch{return null;}
});
