#!/usr/bin/env node
// Run the existing foreground daemon and securely refresh this site's private connector.
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,renameSync,lstatSync} from 'node:fs';
import path from 'node:path';
const envFile=path.resolve('.env.local');
if(lstatSync(envFile).isSymbolicLink())throw Error('Private environment must be a regular file');
const text=readFileSync(envFile,'utf8');
const root=text.match(/^DELTA_HQ_AGENT_ROOT=(.+)$/m)?.[1];
if(!root||!path.isAbsolute(root))throw Error('Set DELTA_HQ_AGENT_ROOT to the approved agent checkout');
if(!process.stdin.isTTY)throw Error('Start from an interactive local terminal for Keychain authentication');
const child=spawn(process.execPath,[path.join(root,'scripts/delta-daemon.mjs'),'--start','--approve-daemon','--workbench','--owner-approvals','--workspace-controls'],{cwd:root,stdio:['inherit','pipe','inherit']});
let pending='';
child.stdout.on('data',chunk=>{
 pending+=chunk.toString();
 // Broker prompts have no newline. They contain no credential and must remain visible.
 for(let newline;(newline=pending.indexOf('\n'))>=0;){const line=pending.slice(0,newline);pending=pending.slice(newline+1);
  const match=line.match(/http:\/\/127\.0\.0\.1:(\d+)\/workbench#([a-f0-9]{64})/);
  if(match){const lines=readFileSync(envFile,'utf8').split('\n').filter(l=>!/^DELTA_HQ_RUNTIME_(PORT|TOKEN)=/.test(l));lines.push(`DELTA_HQ_RUNTIME_PORT=${match[1]}`,`DELTA_HQ_RUNTIME_TOKEN=${match[2]}`);const temporary=envFile+'.runtime-tmp';writeFileSync(temporary,lines.join('\n')+'\n',{mode:0o600,flag:'wx'});renameSync(temporary,envFile);process.stdout.write('HQ runtime connector refreshed securely. Open /hq#work.\n');}
  else process.stdout.write(line+'\n');
 }
 if(/^(Authenticate the local owner approval broker with macOS Keychain\?|Approve this exact action once\?) \[y\/N\] $/.test(pending)){process.stdout.write(pending);pending='';}
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>{process.exitCode=code??1;});
child.on('error',()=>{console.error('Runtime startup failed');process.exitCode=1;});
