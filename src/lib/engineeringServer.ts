import 'server-only';
import {readHostedObservation} from './hostedObservationServer';
import {readLocalObservation} from './localObservations';
import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {parseEngineering} from './engineering';
export async function readEngineering(){
 const live=readLocalObservation('engineering');if(live){try{return parseEngineering(await live);}catch{return null;}}
 if(process.env.DELTA_HQ_HOSTED_OBSERVATIONS==='1')return (await readHostedObservation())?.engineering??null;
 const file=process.env.DELTA_HQ_ENGINEERING_REPORT_PATH;if(!file||!path.isAbsolute(file))return null;let handle;
 try{handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);const stat=await handle.stat();if(!stat.isFile()||stat.size>500000)return null;const bytes=Buffer.alloc(500001);const {bytesRead}=await handle.read(bytes,0,bytes.length,0);if(bytesRead>500000)return null;return parseEngineering(JSON.parse(bytes.subarray(0,bytesRead).toString('utf8')));}catch{return null;}finally{await handle?.close();}
}
