export type Operations={observedAt:string;source?:'hosted';stale?:boolean;backend:{state:string;latencyMs:number;revision:string|null};spending:{state:string;day:string|null;dailyReserved:number|null;monthlyReserved:number|null;dailyCap:number|null;monthlyCap:number|null}};
export function parseOperations(value:unknown):Operations{
 const v=value as Operations;
 if(!v||!Number.isFinite(Date.parse(v.observedAt))||!['healthy','unavailable'].includes(v.backend?.state)||!Number.isFinite(v.backend.latencyMs)||v.backend.latencyMs<0||!(v.backend.revision===null||/^[a-f0-9]{40}$/.test(v.backend.revision))||!['available','unavailable'].includes(v.spending?.state))throw Error('invalid_operations');
 const s=v.spending;
 if(!(s.day===null||/^\d{4}-\d{2}-\d{2}$/.test(s.day))||![s.dailyReserved,s.monthlyReserved,s.dailyCap,s.monthlyCap].every(n=>n===null||typeof n==='number'&&Number.isFinite(n)&&n>=0))throw Error('invalid_operations');
 return {observedAt:v.observedAt,backend:{state:v.backend.state,latencyMs:v.backend.latencyMs,revision:v.backend.revision},spending:{state:s.state,day:s.day,dailyReserved:s.dailyReserved,monthlyReserved:s.monthlyReserved,dailyCap:s.dailyCap,monthlyCap:s.monthlyCap}};
}
