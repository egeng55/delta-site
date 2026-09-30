import {parseOperations,type Operations} from './operationsSnapshot';
import type { ObservatoryReport } from './observatory';
import { validateReport } from './observatory-contract.cjs';
import { projectRuntime, type Workspace } from './workspace';
import { parseEngineering, type EngineeringReport } from './engineering';

export type HostedObservation = {version:1;observedAt:string;source:ObservatoryReport;runtime:Workspace['runtime'];engineering:EngineeringReport|null;operations:Operations|null};
// Re-project rather than trusting JSON from storage. No task prompts, logs or credentials.
export function parseHostedObservation(value:unknown):HostedObservation {
 const v=value as HostedObservation;
 if(!v||v.version!==1||typeof v.observedAt!=='string'||!Number.isFinite(Date.parse(v.observedAt)))throw Error('invalid_observation');
 let runtime:Workspace['runtime']=null;
 if(v.runtime){const r=v.runtime;
  runtime=projectRuntime({status:'ok',runtime:'delta-agent',running_revision:r.revision,uptime_ms:r.uptimeMs,owner_approval_broker:{active:r.ownerActive,expires_at:r.ownerExpiresAt},operational_visibility:{scope:r.scope,observed_at:r.observedAt,records_evicted:r.evicted,commands:r.commands?.map(c=>({command_id:c.id,capability_id:c.capability,state:c.state,verification:c.verification,usage:{total_tokens:c.tokens}}))},capability_availability:r.capabilities?.map(c=>({capability_id:c.id,runtime_binding:c.binding,readiness:c.readiness,approval_required:c.approvalRequired})),workspace_visibility:{retained:r.taskCount,tasks:r.tasks?.map(t=>({id:t.id,outcome_id:t.outcomeId,kind:t.kind,state:t.state,charged_microusd:t.chargedMicrousd,unknown_usage:t.unknownUsage}))}});
 }
 return {version:1,observedAt:v.observedAt,operations:v.operations?parseOperations(v.operations):null,source:validateReport(v.source) as ObservatoryReport,runtime,engineering:v.engineering?parseEngineering(v.engineering):null};
}
export function observationFreshness(observedAt:string,now=Date.now()):'fresh'|'stale' {
 const age=now-Date.parse(observedAt);return Number.isFinite(age)&&age>=-30000&&age<=120000?'fresh':'stale';
}
