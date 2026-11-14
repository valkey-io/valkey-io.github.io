#!/usr/bin/env node
// Renders each blog post's og card to its og.jpg. Serves a built site on 127.0.0.1, loads
// /og-cards/ in headless Chrome at twice the pixel density, and captures every card on it at
// 2400x1260 as a quality 90 JPEG, then deletes /og-cards/ from the build. Fails if a post's
// og:image points at an og.jpg that is missing, not 2400x1260, or 1 MB or more.
//
//   node build/og-cards.mjs [site]      # site defaults to public
//
// Needs Node 20 or later and Chrome or Chromium (set CHROME to pick one).

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { delimiter, extname, join, resolve, sep } from 'node:path';

const site = resolve(process.argv[2] ?? 'public');
const WIDTH = 2400;
const HEIGHT = 1260;
const MAX_BYTES = 1024 * 1024;

function find(names) {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    for (const name of names) if (dir && existsSync(join(dir, name))) return join(dir, name);
  }
}
const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome = process.env.CHROME ?? find(['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) ?? (existsSync(mac) ? mac : undefined);
if (!chrome) throw new Error('No Chrome or Chromium found; set CHROME to its path.');

// A JPEG's width and height, from its first start-of-frame marker.
function jpegSize(b) {
  if (b[0] !== 0xff || b[1] !== 0xd8) return undefined;
  for (let i = 2; i + 9 < b.length; i += 2 + b.readUInt16BE(i + 2)) {
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
    }
  }
}

const types = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    let file = join(site, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (file.endsWith(sep)) file = join(file, 'index.html');
    if (!file.startsWith(site + sep)) throw new Error('outside the site');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
const profile = await mkdtemp(join(tmpdir(), 'og-cards-'));

// Chrome's DevTools protocol over --remote-debugging-pipe: JSON messages ending in a NUL,
// sent on fd 3 and received on fd 4.
const browser = spawn(chrome, ['--headless=new', '--remote-debugging-pipe', '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
const pending = new Map();
const listeners = new Map();
let received = Buffer.alloc(0);
let lastId = 0;
browser.stdio[4].on('data', (chunk) => {
  received = Buffer.concat([received, chunk]);
  for (let end; (end = received.indexOf(0)) >= 0; received = received.subarray(end + 1)) {
    const message = JSON.parse(received.subarray(0, end).toString());
    if (message.id === undefined) listeners.get(message.method)?.();
    const call = pending.get(message.id);
    if (!call) continue;
    pending.delete(message.id);
    if (message.error) call.fail(new Error(`${call.method}: ${message.error.message}`));
    else call.done(message.result);
  }
});
browser.on('exit', () => {
  for (const call of pending.values()) call.fail(new Error(`${call.method}: Chrome exited`));
});
const event = (method) => new Promise((done) => listeners.set(method, done));
const send = (method, params = {}, sessionId) => new Promise((done, fail) => {
  const id = ++lastId;
  pending.set(id, { method, done, fail });
  browser.stdio[3].write(`${JSON.stringify({ id, method, params, sessionId })}\0`);
});

try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  await page('Emulation.setDeviceMetricsOverride', { width: WIDTH / 2, height: HEIGHT / 2, deviceScaleFactor: 2, mobile: false });
  await page('Page.enable');
  const loaded = event('Page.loadEventFired');
  await page('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/og-cards/` });
  await loaded;
  // Wait for the fonts and every background image, then find each card.
  const { result } = await page('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      await document.fonts.ready;
      const urls = new Set([...document.querySelectorAll('.og-card, .og-card *')]
        .flatMap((el) => [...getComputedStyle(el).backgroundImage.matchAll(/url\\("([^"]+)"\\)/g)].map((m) => m[1])));
      await Promise.all([...urls].map((url) => { const img = new Image(); img.src = url; return img.decode(); }));
      return [...document.querySelectorAll('.og-card-frame')].map((frame) => {
        const r = frame.getBoundingClientRect();
        return { og: frame.dataset.og, x: r.left + scrollX, y: r.top + scrollY };
      });
    })()`,
  });
  for (const { og, x, y } of result.value ?? []) {
    const { data } = await page('Page.captureScreenshot', {
      format: 'jpeg', quality: 90, captureBeyondViewport: true, clip: { x, y, width: WIDTH / 2, height: HEIGHT / 2, scale: 1 },
    });
    await writeFile(join(site, og), Buffer.from(data, 'base64'));
  }
} finally {
  if (browser.exitCode === null) {
    const exited = new Promise((done) => browser.once('exit', done));
    browser.kill();
    await exited;
  }
  server.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 3 });
}
await rm(join(site, 'og-cards'), { recursive: true, force: true });

// Check every post whose og:image is its own og.jpg, whether or not this run drew it.
const problems = [];
for (const dir of await readdir(join(site, 'blog'), { withFileTypes: true })) {
  const page = join(site, 'blog', dir.name, 'index.html');
  if (!dir.isDirectory() || !existsSync(page)) continue;
  const og = `/blog/${dir.name}/og.jpg`;
  const image = /<meta property="og:image" content="([^"]*)"/.exec(await readFile(page, 'utf8'))?.[1];
  if (!image?.endsWith(og)) continue;
  const jpg = await readFile(join(site, og)).catch(() => undefined);
  const size = jpg && jpegSize(jpg);
  if (!jpg) problems.push(`${og} is missing`);
  else if (size?.width !== WIDTH || size?.height !== HEIGHT) problems.push(`${og} is ${size ? `${size.width}x${size.height}` : 'not a JPEG'}, not ${WIDTH}x${HEIGHT}`);
  else if (jpg.length >= MAX_BYTES) problems.push(`${og} is ${jpg.length} bytes, 1 MB or more`);
  else console.log(`${og}  ${size.width}x${size.height}  ${Math.round(jpg.length / 1024)} KB`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
