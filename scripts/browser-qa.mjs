/** Native CDP fallback for a local-only QA browser. No third-party packages. */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { exhibits } from '../src/collection.js';
import { exhibitURL } from '../src/routes.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const work = resolve(root, '.local');
const language = process.argv.find(arg => arg.startsWith('--language='))?.split('=')[1] || 'en';
assert.ok(['en', 'tr'].includes(language));
const out = resolve(work, `qa-${language}`);
await mkdir(out, { recursive: true });
for (const name of ['cabinet-of-curiosities-notebook.json', 'cabinet-of-curiosities-harmonograph.svg']) await rm(join(out, name), { force: true });
const profile = await mkdtemp(join(work, 'qa-chrome-'));
const chromePath = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to an installed Chrome or Chromium executable.');
const address = new URL(process.env.QA_URL || 'http://127.0.0.1:4178/');
if (language === 'tr') address.searchParams.set('lang', 'tr');
const base = address.href;
const narrow = process.argv.includes('--narrow');
const smoke = process.argv.includes('--smoke') || narrow;
const port = 9400 + Math.floor(Math.random() * 600);
const child = spawn(chromePath, ['--headless=new', '--disable-gpu', '--disable-extensions', '--disable-background-networking', '--disable-sync', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--autoplay-policy=user-gesture-required', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--disk-cache-dir=${join(profile, 'cache')}`, 'about:blank'], { stdio: 'ignore', windowsHide: true, env: { ...process.env, TEMP: profile, TMP: profile } });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws; let sequence = 0; const pending = new Map(); const errors = []; const requests = []; const audioEvents = []; const checks = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression, timeout = 5000) { const start = Date.now(); while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await sleep(50); } throw new Error(`Page condition failed: ${expression}`); }
async function check(name, fn) { await fn(); checks.push(name); console.log(`PASS ${name}`); }
async function route(id) { await evaluate(`location.hash = ${JSON.stringify(exhibitURL(id))}`); await until(`document.querySelector('[data-demo="${id}"]') !== null`); await sleep(90); }
async function set(selector, value, event = 'input') { await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(String(value))};e.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}));})()`); }
async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await sleep(75); }
async function scrollTo(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({behavior:'instant',block:'start'})`); await sleep(100); }
async function capture(name, full = false) {
  const params = { format: 'png', captureBeyondViewport: full };
  if (full) { const metric = await send('Page.getLayoutMetrics'); params.clip = { x: 0, y: 0, width: metric.cssContentSize.width, height: metric.cssContentSize.height, scale: 1 }; }
  const screenshot = await send('Page.captureScreenshot', params); await writeFile(join(out, `${name}.png`), Buffer.from(screenshot.data, 'base64'));
}
async function layout(name, width) {
  const result = await evaluate(`(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,textOverflow:(()=>{if(document.documentElement.scrollWidth<=innerWidth)return [];const walker=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);const bad=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(n);for(const b of r.getClientRects()){if(b.right>innerWidth+1)bad.push({text:n.textContent.slice(0,75),parent:n.parentElement.tagName,cls:n.parentElement.className?.baseVal??n.parentElement.className,right:b.right});}}return bad.slice(0,12);})(),overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left< -2)}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className?.baseVal??e.className,right:e.getBoundingClientRect().right}))}))()`);
  if (result.scroll > width + 1) console.log('Layout isolation:', await evaluate(`(()=>{const selectors=['.hero-copy','.hero-figure','.manifesto','#collection','.tour-section','.closing-note','.site-header','.site-footer','main'];return selectors.map(selector=>{const e=document.querySelector(selector);if(!e)return null;const previous=e.getAttribute('style');e.style.setProperty('display','none','important');const width=document.documentElement.scrollWidth;if(previous===null)e.removeAttribute('style');else e.setAttribute('style',previous);return {selector,width};});})()`));
  assert.equal(result.width, width, `${name} viewport: ${JSON.stringify(result)}`); assert.ok(result.scroll <= width + 1, `${name} overflow: ${JSON.stringify(result)}`); assert.equal(result.h1, 1);
  checks.push(`${name}: ${width}px layout`); return result;
}
async function screenshotLab(id, width) { await scrollTo('#experiment'); await capture(`${id}-${width}-lab`); }
async function canvasHash() { const data = await evaluate(`document.querySelector('.demo-stage canvas').toDataURL()`); return createHash('sha256').update(data).digest('hex'); }

try {
  let target;
  for (let i = 0; i < 70; i++) { try { const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = tabs.find(tab => tab.type === 'page'); if (target) break; } catch {} await sleep(150); }
  if (!target) throw new Error('QA browser did not start');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const promise = pending.get(message.id); pending.delete(message.id); if (message.error) promise.reject(new Error(message.error.message)); else promise.resolve(message.result); }
    else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value ?? arg.description).join(' '));
    else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) errors.push(`HTTP ${message.params.response.status}: ${message.params.response.url}`);
    else if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
    else if (message.method.startsWith('WebAudio.')) audioEvents.push({ method: message.method, params: message.params });
  });
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  for (const method of ['Page.enable', 'Runtime.enable', 'Network.enable', 'WebAudio.enable']) await send(method);
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: out });
  const startWidth = narrow ? 320 : 1440;
  await send('Emulation.setDeviceMetricsOverride', { width: startWidth, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base }); await until(`document.querySelectorAll('#collection-grid .specimen').length === 9`); await evaluate('document.fonts.ready'); await sleep(200);
  await check('home has nine semantic cards and nine cabinet links', async () => { assert.equal(await evaluate(`document.querySelectorAll('.cabinet-object').length`), 9); assert.equal(await evaluate(`document.documentElement.lang`), language); });
  await layout('home', startWidth); await capture(`home-${startWidth}`); await capture(`home-${startWidth}-full`, true);
  await scrollTo('#collection'); await capture(`collection-${startWidth}`);
  if (!smoke) {
    await check('Turkish-aware ASCII search and empty recovery', async () => {
      await set('#collection-search', language === 'en' ? 'pneumatic' : 'pnomatik'); assert.equal(await evaluate(`document.querySelectorAll('#collection-grid .specimen').length`), 1);
      await set('#collection-search', 'burada-olmayan-nesne'); assert.equal(await evaluate(`document.querySelectorAll('#collection-grid .specimen').length`), 0);
      await click('[data-clear-search]'); assert.equal(await evaluate(`document.querySelectorAll('#collection-grid .specimen').length`), 9);
    });
    await check('all category filters select the expected objects', async () => {
      for (const [category, count] of [['Sound', 2], ['Vision', 3], ['Information', 2], ['Motion', 2], ['All', 9]]) { await click(`[data-filter="${category}"]`); assert.equal(await evaluate(`document.querySelectorAll('#collection-grid .specimen').length`), count); }
    });
    await check('saving a card persists across a page reload', async () => {
      await click('[data-save="theremin"]'); await send('Page.reload'); await until(`document.querySelector('[data-save="theremin"][aria-pressed="true"]') !== null`);
      await evaluate(`location.hash='#/notebook'`); await until(`document.querySelector('.notebook-summary')!==null`); assert.equal(await evaluate(`document.querySelectorAll('.collection-grid .specimen').length`), 1);
      await click('[data-export]');
    });
  }
  for (const width of (narrow ? [320] : [1440, 390])) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: width < 700 ? 844 : 1000, deviceScaleFactor: 1, mobile: !narrow && width < 700 });
    if (width === 390) { await evaluate(`location.hash='#/'`); await until(`document.querySelector('.cabinet-art')!==null`); await sleep(100); await layout('home', width); await capture('home-390'); await capture('home-390-full', true); }
    for (const item of exhibits) {
      await route(item.id); await layout(item.id, width); await capture(`${item.id}-${width}-top`);
      assert.ok((await evaluate(`document.querySelector('[data-readout]')?.textContent || ''`)).length > 15, `${item.id} missing model output`);
      const copy = await evaluate(`document.querySelector('main').textContent`);
      assert.ok(!copy.includes('${' + 't('), `${item.id}: leaked template expression`);
      if (language === 'en') assert.ok(!/[çğıöşüÇĞİÖŞÜ]/u.test(copy), `${item.id}: untranslated Turkish copy`);
      await screenshotLab(item.id, width);
      if (smoke) continue;
      if (item.id === 'ses-aynalari') await check(`acoustic controls and enlarged diagram at ${width}px`, async () => { assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), (language === 'en' ? /9 of 9/ : /9 tanesi/)); await set('#sound-angle', 20); assert.ok(!(language === 'en' ? /9 of 9/ : /9 tanesi/).test(await evaluate(`document.querySelector('[data-readout]').textContent`))); await click('[data-step]'); await click('[data-expand]'); await until(`document.querySelector('#diagram-dialog').open && document.querySelector('#diagram-image').naturalWidth>0`); await capture(`diagram-enlarged-${width}`); await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }); await until(`!document.querySelector('#diagram-dialog').open`); });
      if (item.id === 'mekanik-televizyon') await check(`television scans, pauses and changes resolution at ${width}px`, async () => {
        await click('[data-reset]'); const before = await canvasHash(); await click('[data-play]'); await sleep(450); await click('[data-play]'); const after = await canvasHash(); assert.notEqual(before, after); await sleep(150); assert.equal(after, await canvasHash()); await set('#tv-lines', 48, 'change'); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), /48 \/ 48/);
      });
      if (item.id === 'pnomatik-posta') await check(`pneumatic stall and load controls at ${width}px`, async () => { await set('#tube-pressure', 0); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), (language === 'en' ? /does not move/ : /hareket etmiyor/)); await set('#tube-pressure', 600); const before = await evaluate(`document.querySelector('[data-readout]').textContent`); await set('#tube-mass', 4); assert.notEqual(before, await evaluate(`document.querySelector('[data-readout]').textContent`)); await click('[data-step]'); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), (language === 'en' ? /Distance:/ : /Yol:/)); });
      if (item.id === 'antikythera') await check(`Metonic endpoint is 19 years and 235 months at ${width}px`, async () => { await click('[data-year="19"]'); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), (language === 'en' ? /19 years → 235/ : /19 yıl → 235/)); await click('[data-year="1"]'); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), (language === 'en' ? /12\.37/ : /12,37/)); });
      if (item.id === 'jacquard') await check(`Jacquard card editor, keyboard and weave at ${width}px`, async () => {
        const before = await evaluate(`document.querySelector('[data-bit="0,0"]').getAttribute('aria-pressed')`); await click('[data-bit="0,0"]'); assert.notEqual(before, await evaluate(`document.querySelector('[data-bit="0,0"]').getAttribute('aria-pressed')`)); await evaluate(`document.querySelector('[data-bit="0,0"]').focus()`); await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' }); assert.equal(await evaluate(`document.activeElement.dataset.bit`), '0,1'); await click('[data-step]'); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), /1 \/ 24/); await click('[data-pattern="checker"]');
      });
      if (item.id === 'theremin') await check(`theremin is opt-in, changes pitch and closes audio at ${width}px`, async () => {
        assert.equal(await evaluate(`document.querySelector('[data-audio]').getAttribute('aria-pressed')`), 'false'); await set('#theremin-pitch', 100); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), /880 Hz/); await click('[data-audio]'); await until(`document.querySelector('[data-audio]').getAttribute('aria-pressed')==='true'`); assert.ok(audioEvents.some(event => event.method === 'WebAudio.audioNodeCreated'));
        await scrollTo('.site-footer'); await until(`document.querySelector('[data-audio]').getAttribute('aria-pressed')==='false'`); await screenshotLab(item.id, width);
      });
      if (item.id === 'harmonograf') await check(`harmonograph redraw and SVG export at ${width}px`, async () => {
        assert.equal(await evaluate(`document.querySelector('#harm-damping-value').textContent`), language === 'en' ? '0.035' : '0,035'); const before = await canvasHash(); await click('[data-ratio="1"]'); await set('#harm-phase', 90); await set('#harm-damping', 0); assert.notEqual(before, await canvasHash()); await click('[data-download]');
      });
      if (item.id === 'zoetrop') await check(`zoetrope sampling and shutter comparison at ${width}px`, async () => { await set('#zoe-frames', 6, 'change'); await set('#zoe-speed', 1.2); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), (language === 'en' ? /7\.2 poses/ : /7,2 poz/)); await click('#zoe-shutter'); assert.match(await evaluate(`document.querySelector('[data-readout]').textContent`), (language === 'en' ? /is off/ : /kapalı/)); await click('[data-step]'); });
      if (item.id === 'sihirli-fener') await check(`lantern focus solves both worked examples at ${width}px`, async () => { await click('[data-focus]'); assert.equal(await evaluate(`Number(document.querySelector('#lens-screen').value)`), 240); await set('#lens-object', 90); await click('[data-focus]'); assert.equal(await evaluate(`Number(document.querySelector('#lens-screen').value)`), 720); await click('[data-lens-reset]'); });
    }
  }
  if (!smoke) {
    await check('three-stop tour preserves its route and reaches completion', async () => {
      await evaluate(`location.hash='#/eser/ses-aynalari?rota=gorunmeyen'`); await until(`document.querySelector('.tour-progress')?.textContent.includes(${JSON.stringify(language === 'en' ? 'Stop 1 of 3' : '1 / 3')})`); await click('.tour-progress a'); await until(`document.querySelector('[data-demo="pnomatik-posta"]')!==null`); await click('.tour-progress a'); await until(`document.querySelector('[data-demo="theremin"]')!==null`); assert.match(await evaluate(`document.querySelector('.tour-progress').textContent`), (language === 'en' ? /Route complete/ : /Rota tamamlandı/));
    });
    await check('unknown deep link has a useful recovery page', async () => { await evaluate(`location.hash='#/eser/missing-object'`); await until(`document.querySelector('h1')?.textContent.includes(${JSON.stringify(language === 'en' ? 'not here' : 'burada değil')})`); });
    const other = language === 'en' ? 'tr' : 'en';
    await check('language switching preserves the route, saved objects and preference', async () => {
      await route('harmonograf');
      const hash = await evaluate('location.hash');
      const notebook = await evaluate(`localStorage.getItem('merak-kabinesi.v1')`);
      await set('#language', other, 'change');
      assert.equal(await evaluate('document.documentElement.lang'), other);
      assert.equal(await evaluate('location.hash'), hash);
      assert.equal(await evaluate(`localStorage.getItem('merak-kabinesi.v1')`), notebook);
      assert.equal(await evaluate('document.title'), other === 'en' ? 'Harmonograph — Cabinet of Curiosities' : 'Harmonograf — Merak Kabinesi');
      await evaluate(`history.replaceState(null,'',location.pathname+location.hash)`);
      await send('Page.reload'); await until(`document.querySelector('[data-demo="harmonograf"]')!==null`);
      assert.equal(await evaluate('document.documentElement.lang'), other);
      assert.equal(await evaluate(`document.querySelector('#language').value`), other);
    });
    await check('an explicit shared language overrides the saved preference', async () => {
      const explicit = new URL(base); explicit.searchParams.set('lang', language); explicit.hash = exhibitURL('ses-aynalari');
      await send('Page.navigate', { url: explicit.href }); await until(`document.querySelector('[data-demo="ses-aynalari"]')!==null`);
      assert.equal(await evaluate('document.documentElement.lang'), language);
    });
    await check('the static recovery page supports both languages and the correct home path', async () => {
      const missing = new URL('404.html', base); missing.searchParams.set('lang', language);
      await send('Page.navigate', { url: missing.href }); await until(`document.querySelector('#language')?.value===${JSON.stringify(language)} && document.querySelector('#home')?.hash==='#/collection'`);
      await set('#language', other, 'change');
      assert.equal(await evaluate('document.documentElement.lang'), other);
      assert.equal(await evaluate(`document.querySelector('#home').textContent`), other === 'en' ? 'Back to the collection' : 'Koleksiyona dön');
      assert.equal(await evaluate(`new URL(document.querySelector('#home').href).pathname`), new URL(base).pathname);
      await send('Page.reload'); await until(`document.querySelector('#language')?.value===${JSON.stringify(other)}`);
      const explicit = new URL(base); explicit.searchParams.set('lang', language);
      await send('Page.navigate', { url: explicit.href }); await until(`document.querySelectorAll('#collection-grid .specimen').length===9`);
    });
    for (const [width, height] of [[320, 700], [800, 900], [1280, 720]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
      for (const item of [exhibits[0], exhibits[4], exhibits[5], exhibits[8]]) { await route(item.id); await layout(item.id, width); }
      await evaluate(`location.hash='#/'`); await until(`document.querySelector('.cabinet-art')!==null`); await layout('home', width);
    }
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await route('harmonograf'); assert.equal(await evaluate(`document.querySelector('[data-play]').getAttribute('aria-pressed')`), 'false'); checks.push('reduced motion: no unsolicited animation');
    await evaluate(`location.hash='#/sources'`); await until(`document.querySelectorAll('.source-group').length===9`); assert.equal(await evaluate(`document.querySelectorAll('.source-group').length`), 9); checks.push('all source records render');
    await evaluate(`location.hash='#/about'`); await until(`document.querySelector('.about-body')!==null`); assert.ok(await evaluate(`document.querySelector('.about-body').textContent.includes(${JSON.stringify(language === 'en' ? 'notebook' : 'Not defteri')})`)); checks.push('about and privacy information render');
    const json = JSON.parse(await readFile(join(out, 'cabinet-of-curiosities-notebook.json'), 'utf8')); assert.equal(json.saved[0].id, 'theremin'); assert.equal(json.language, language); assert.match(json.saved[0].url, /#\/exhibit\/theremin$/);
    const exported = await readFile(join(out, 'cabinet-of-curiosities-harmonograph.svg'), 'utf8'); assert.ok(exported.includes('<path d="M')); assert.ok(exported.includes('r=1')); checks.push('downloaded notebook JSON and drawing SVG are valid');
  }
  const outside = requests.filter(url => !url.startsWith(new URL(base).origin) && !url.startsWith('data:') && !url.startsWith('blob:'));
  assert.deepEqual(outside, []); assert.deepEqual(errors, []);
  await writeFile(join(out, narrow ? 'narrow.json' : smoke ? 'smoke.json' : 'report.json'), JSON.stringify({ language, checks, count: checks.length, errors, outsideRequests: outside, audio: audioEvents.map(event => ({ method: event.method, contextId: event.params.contextId || event.params.context?.contextId })), routes: exhibits.map(item => item.id), screenshots: out }, null, 2));
  console.log(`COMPLETE ${language}: ${checks.length} checks; no page errors or third-party requests. Evidence: ${out}`);
} catch (error) {
  try { await capture('failure-current'); } catch {}
  await writeFile(join(out, 'failure.json'), JSON.stringify({ error: error.stack, checks, errors }, null, 2)); console.error(error); process.exitCode = 1;
} finally {
  if (ws) ws.close(); child.kill(); await new Promise(resolve => child.once('exit', resolve));
  const safe = resolve(profile); if (!safe.startsWith(work + '\\') && !safe.startsWith(work + '/')) throw new Error('Unsafe QA profile cleanup');
  for (let i = 0; i < 5; i++) { try { await rm(profile, { recursive: true, force: true }); break; } catch { await sleep(250); } }
}
