// Match the configured public origin, or the served Host rather than Next's
// normalized internal hostname. Forwarded-host headers never grant an origin.
export function isHqOrigin(request:Request):boolean {
 const url=new URL(request.url);
 const configured=process.env.DELTA_HQ_SITE_ORIGIN;
 let expected:string;
 try{expected=configured?new URL(configured).origin:`${url.protocol}//${request.headers.get('host')||url.host}`;}catch{return false;}
 return request.headers.get('origin')===expected;
}
