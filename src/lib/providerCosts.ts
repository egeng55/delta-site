export type ProviderCosts={provider:'openai';state:'available'|'unconfigured'|'unavailable'|'incomplete';scope:string;periodStart:string;periodEnd:string;observedAt:string;usd:number|null;days:{day:string;usd:number}[];invoiceState:'not_connected'};
type CostPage={data:{start_time:number;results:{object:string;amount:{value:number;currency:string};project_id:string|null}[]}[];has_more:boolean;next_page:string|null};
export function parseCostPage(value:unknown,project:string|null):{days:{day:string;usd:number}[];next:string|null}{
 const p=value as CostPage;
 if(!p||!Array.isArray(p.data)||p.data.length>32||typeof p.has_more!=='boolean')throw Error('invalid_costs');
 const days=p.data.map(bucket=>{
  if(!Number.isSafeInteger(bucket.start_time)||!Array.isArray(bucket.results)||bucket.results.length>2000)throw Error('invalid_costs');
  const usd=bucket.results.reduce((total,row)=>{
   if(row.object!=='organization.costs.result'||row.amount?.currency!=='usd'||typeof row.amount.value!=='number'||!Number.isFinite(row.amount.value)||(project&&row.project_id!==project))throw Error('invalid_costs');
   return total+row.amount.value;
  },0);
  if(!Number.isFinite(usd))throw Error('invalid_costs');
  return {day:new Date(bucket.start_time*1000).toISOString().slice(0,10),usd};
 });
 if(p.has_more&&(typeof p.next_page!=='string'||!p.next_page||p.next_page.length>512))throw Error('invalid_costs');
 return {days,next:p.has_more?p.next_page:null};
}
