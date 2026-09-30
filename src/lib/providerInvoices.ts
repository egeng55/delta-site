export type ProviderInvoice={provider:'openai'|'anthropic'|'vercel'|'supabase';invoiceId:string;scope:string;periodStart:string;periodEnd:string;currency:'usd';subtotalCents:number;taxCents:number;creditCents:number;totalCents:number;evidenceSha256:string};
export function parseInvoice(value:unknown):ProviderInvoice {
 const v=value as ProviderInvoice;
 if(!v||typeof v!=='object'||Object.keys(v).sort().join(',')!==['provider','invoiceId','scope','periodStart','periodEnd','currency','subtotalCents','taxCents','creditCents','totalCents','evidenceSha256'].sort().join(','))throw Error('invalid_invoice_fields');
 const date=(x:string)=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
 if(typeof v.invoiceId!=='string'||typeof v.scope!=='string'||typeof v.evidenceSha256!=='string')throw Error('invalid_invoice_identity');
 if(!['openai','anthropic','vercel','supabase'].includes(v.provider)||!/^[-a-zA-Z0-9_]{1,120}$/.test(v.invoiceId)||!/^[-a-zA-Z0-9_:]{1,160}$/.test(v.scope)||v.currency!=='usd'||!date(v.periodStart)||!date(v.periodEnd)||v.periodEnd<=v.periodStart||! /^[a-f0-9]{64}$/.test(v.evidenceSha256))throw Error('invalid_invoice_identity');
 if(![v.subtotalCents,v.taxCents,v.creditCents,v.totalCents].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000)||v.subtotalCents+v.taxCents-v.creditCents!==v.totalCents)throw Error('invalid_invoice_amounts');
 return v;
}
