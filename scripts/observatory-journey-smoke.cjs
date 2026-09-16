/* eslint-disable @typescript-eslint/no-require-imports */
// Isolated loopback fixtures only. No real account, credential, or report.
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const users = new Map();
let signouts = 0;
function session(id) {
  const user = { id, email: id === owner ? 'owner@fixture.test' : 'other@fixture.test', role: 'authenticated', aud: 'authenticated', email_confirmed_at: '2026-01-01T00:00:00.000Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-01-01T00:00:00.000Z', is_anonymous: false };
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ sub: id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }) + '.fixture-only';
  users.set(token, user);
  return { access_token: token, refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  if (req.url.startsWith('/auth/v1/token')) {
    let bytes = ''; for await (const chunk of req) bytes += chunk;
    const body = JSON.parse(bytes);
    if (body.password !== 'fixture-password') return json(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    return json(200, session(body.email === 'owner@fixture.test' ? owner : other));
  }
  const user = users.get((req.headers.authorization || '').replace(/^Bearer /, ''));
  if (req.url === '/auth/v1/user') return json(user ? 200 : 401, user || { message: 'Not authenticated' });
  if (req.url.startsWith('/auth/v1/logout')) {
    assert(req.url.includes('scope=local')); signouts++; res.writeHead(204); return res.end();
  }
  if (req.url.startsWith('/rest/v1/profiles')) return json(200, { id: user?.id, role: 'user', name: 'Fixture owner' });
  if (req.url.startsWith('/rest/v1/subscriptions')) return json(406, { code: 'PGRST116' });
  return json(404, { error: 'fixture_route_not_found' });
});
async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'delta-journey-'));
  const sha = 'a'.repeat(40); const date = new Date().toISOString();
  const node = (id, kind, group = 'agent') => ({ id, label: 'Fixture ' + id, group, kind, maturity: 'declared' });
  const report = { version: 1, generatedAt: date, sourceCommit: sha, architectureVersion: 'fixture', synthetic: false,
    repositories: ['agent','backend','site','mobile','jobs'].map(id => ({ id, label: 'delta-' + id, sha, files: 1, testFiles: 1 })),
    census: { capabilities: 1, tools: 1, systems: 1, resolved: 1, ambiguous: 0, unmapped: 0 },
    graphs: [{ id: 'systems', generatedAt: date, sourceCommit: sha, nodes: [node('repo', 'repository'), node('system', 'system')], links: [{ source: 'repo', target: 'system', relation: 'declared owner' }] }, { id: 'capabilities', generatedAt: date, sourceCommit: sha, nodes: [node('cap', 'capability'), node('tool', 'handler')], links: [{ source: 'cap', target: 'tool', relation: 'registered handler' }] }], history: [] };
  require('../src/lib/observatory-contract.cjs').validateReport(report);
  const file = path.join(temp, 'report.json'); fs.writeFileSync(file, JSON.stringify(report), { mode: 0o600 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const authUrl = 'http://127.0.0.1:' + server.address().port;
  const base = 'http://127.0.0.1:3112';
  const child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3112'], {
    cwd: root, env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'development', NEXT_PUBLIC_SUPABASE_URL: authUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture-public-key', DELTA_HQ_OWNER_USER_ID: owner, DELTA_HQ_REPORT_PATH: file, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore','pipe','pipe'],
  });
  let logs = ''; child.stdout.on('data', b => { logs = (logs + b).slice(-16000); }); child.stderr.on('data', b => { logs = (logs + b).slice(-16000); });
  let browser;
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) { if (child.exitCode !== null) throw new Error('Fixture server failed: ' + logs); try { const r = await fetch(base + '/login'); if (r.ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 500)); }
    assert(ready, 'Fixture server readiness'); browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => route.request().url().startsWith(base + '/') || route.request().url().startsWith(authUrl + '/') ? route.continue() : route.abort());
    const login = async email => {
      await page.goto(base + '/login?redirect=%2Fhq');
      await page.getByLabel('Email', { exact: true }).fill(email);
      await page.getByLabel('Password', { exact: true }).fill('fixture-password');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.waitForURL(base + '/hq');
    };
    assert.equal((await page.request.get(base + '/api/hq/report')).status(), 401);
    await login('owner@fixture.test');
    await page.getByRole('heading', { name: 'Your system, at a glance.' }).waitFor();
    assert.equal(await page.getByRole('img', { name: 'Delta', exact: true }).getAttribute('src'), '/delta-logo.svg');
    await page.getByRole('button', { name: 'Refresh report', exact: true }).click();
    await page.getByText('You have the latest published snapshot.').waitFor();
    await page.getByRole('link', { name: 'Architecture', exact: true }).click();
    await page.locator('canvas').waitFor(); await page.waitForTimeout(1200);
    const canvas = page.locator('canvas').first(); const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 100; i++) { await page.mouse.wheel(0, -1500); await page.waitForTimeout(35); if ((await page.getByLabel('Graph zoom', { exact: true }).textContent()) === '300%') break; }
    await page.waitForTimeout(300);
    assert.equal(await page.getByLabel('Graph zoom', { exact: true }).textContent(), '300%');
    for (let i = 0; i < 100; i++) { await page.mouse.wheel(0, 1500); await page.waitForTimeout(35); if ((await page.getByLabel('Graph zoom', { exact: true }).textContent()) === '15%') break; }
    await page.waitForTimeout(300);
    assert.equal(await page.getByLabel('Graph zoom', { exact: true }).textContent(), '15%');
    await page.getByRole('button', { name: 'Reset viewport' }).click();
    await page.getByRole('button', { name: 'Fit graph' }).click();
    await page.getByRole('button', { name: 'Fixture system', exact: false }).click();
    await page.getByRole('heading', { name: 'Selected node' }).waitFor();
    await page.getByRole('button', { name: 'Close node detail' }).click();
    await page.getByLabel('Find a node').fill('missing');
    await page.getByText('No matching nodes', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await page.getByRole('button', { name: 'Rebuild graph layout' }).click();
    await page.getByText('Layout rebuilt. Source data is unchanged.').waitFor();
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByRole('heading', { name: 'Workspace settings' }).waitFor();
    await page.goBack(); await page.locator('canvas').waitFor();
    await page.getByRole('button', { name: 'Ask Delta', exact: true }).click();
    await page.getByRole('button', { name: 'Show census for 7 days' }).click();
    assert.equal(await page.getByLabel('History timeframe').inputValue(), '7');
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    await page.screenshot({ path: path.join(temp, 'fixture-overview.png'), fullPage: true });
    for (const width of [320, 390, 768, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const section of ['Architecture', 'Activity & quality', 'Settings', 'Overview']) {
        await page.getByRole('link', { name: section, exact: true }).click();
        await page.waitForTimeout(100);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'overflow ' + width + ' ' + section);
      }
    }
    await page.setViewportSize({ width:1440, height:1000 });
    const signoutResponse = page.waitForResponse(r => r.url() === base + '/api/hq/signout');
    await page.getByRole('button', { name: 'Sign out', exact:true }).click();
    const result = await signoutResponse;
    if (result.status() !== 200) throw new Error('Sign-out failed status: ' + result.status());
    await page.waitForURL(base + '/login?redirect=%2Fhq');
    assert.equal(signouts, 1); assert.equal((await page.request.get(base + '/api/hq/report')).status(), 401);
    await login('other@fixture.test');
    await page.getByText('This workspace is available only to its verified owner.').waitFor();
    assert.equal((await page.request.get(base + '/api/hq/report')).status(), 403);
    assert(!await page.getByRole('heading', { name: 'Your system, at a glance.' }).count());
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ result:'passed', authentication:'loopback-fixture-only', journey:['login','owner-report','refresh','navigation','bounded-wheel-zoom','node-inspection','search','layout','history','chat','responsive','signout','nonowner-denied'], externalRequests:0, productionMutations:0 }));
  } finally {
    await browser?.close();
    child.kill('SIGTERM'); if (child.exitCode === null) await new Promise(resolve => child.once('exit', resolve));
    await new Promise(resolve => server.close(resolve)); fs.rmSync(temp, {recursive:true,force:true});
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; server.close(); });
