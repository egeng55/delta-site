/** @jest-environment node */
import config from '../../next.config';
it('HQ permits only the configured HTTPS auth origin while retaining other protections',async()=>{
 const routes=await config.headers!();const hq=routes.find(r=>r.source==='/hq/:path*'&&r.headers.some(h=>h.key==='Content-Security-Policy'))!;
 const csp=hq.headers.find(h=>h.key==='Content-Security-Policy')!.value;
 const configured=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(configured&&new URL(configured).protocol==='https:')expect(csp).toContain(new URL(configured).origin);
 expect(csp).not.toContain('https://*.supabase.co');expect(csp).toContain("object-src 'none'");expect(csp).toContain("frame-ancestors 'none'");
});
