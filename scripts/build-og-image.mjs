// Regenerate public/og-image.png — the 1200×630 social share card used by
// Open Graph and Twitter Card consumers. Run with `node scripts/build-og-image.mjs`.
// The card intentionally avoids any real puzzle content so it can ship once
// and not spoil future days.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../public/og-image.png');

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; padding: 0; background: #0a0907; }
  body {
    width: 1200px; height: 630px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    color: #f0eadb;
    display: grid;
    grid-template-rows: 1fr auto;
    padding: 64px 80px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }
  /* faint warm brass glow in the upper-right corner */
  body::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(900px 500px at 90% -10%, rgba(200,161,74,0.18), transparent 60%);
    pointer-events: none;
  }
  .stack { display: flex; flex-direction: column; justify-content: center; gap: 28px; z-index: 1; }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: 0.32em;
    color: #c8a14a;
    text-transform: uppercase;
  }
  h1 {
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 800;
    font-size: 168px;
    line-height: 0.86;
    letter-spacing: -0.01em;
    margin: 0;
    color: #f0eadb;
    text-transform: uppercase;
  }
  /* Matches the in-app .subtitle treatment: muted mono, tracked, uppercase. */
  .tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6a6358;
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    z-index: 1;
  }
  .bar {
    height: 56px;
    border-radius: 10px;
    display: grid;
    grid-template-columns: 56px 1fr auto;
    align-items: center;
    color: #1a1308;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.18em;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.18), 0 2px 0 rgba(0,0,0,0.35);
  }
  .bar .tab {
    height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.16);
    border-radius: 10px 0 0 10px;
    font-size: 13px;
  }
  .bar .mid { padding-left: 18px; color: rgba(26,19,8,0.78); }
  .bar .right { padding-right: 18px; color: rgba(26,19,8,0.62); font-size: 12px; }
  .bar-a { background: #e8b94d; }
  .bar-b { background: #9bc25e; }
  .bar-c { background: #7fa8e3; }
  .bar-d { background: #b489ce; }
  .footer {
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    letter-spacing: 0.18em;
    color: #6a6358;
    text-transform: uppercase;
    margin-top: 28px;
    z-index: 1;
  }
  .footer .url { color: #c8a14a; }
</style></head>
<body>
  <div class="stack">
    <div class="eyebrow">A daily music puzzle</div>
    <h1>Audio<br>Connections</h1>
    <div class="tag">Find four groups of four · A new puzzle every day</div>
  </div>
  <div>
    <div class="bars">
      <div class="bar bar-a"><div class="tab">A</div><div class="mid">SIDE A</div><div class="right">04 TRACKS</div></div>
      <div class="bar bar-b"><div class="tab">B</div><div class="mid">SIDE B</div><div class="right">04 TRACKS</div></div>
      <div class="bar bar-c"><div class="tab">C</div><div class="mid">SIDE C</div><div class="right">04 TRACKS</div></div>
      <div class="bar bar-d"><div class="tab">D</div><div class="mid">SIDE D</div><div class="right">04 TRACKS</div></div>
    </div>
    <div class="footer">
      <div>16 tracks · 4 groups · 4 mistakes</div>
      <div class="url">connections.audio</div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
// Serve via http:// rather than data: — Google Fonts CSS uses relative
// font-file URLs that won't resolve under setContent's about:blank origin,
// which silently falls back to system sans and ruins the wordmark.
await page.route('**/og-template.html', (route) =>
  route.fulfill({ status: 200, contentType: 'text/html', body: html })
);
await page.goto('https://og.local/og-template.html', { waitUntil: 'networkidle' });
// Force a load of the exact families/weights we use, then wait until
// they're actually rasterizable — fonts.ready alone can resolve too early
// when CSS @font-face rules are still being parsed.
await page.evaluate(async () => {
  await Promise.all([
    document.fonts.load('800 168px "Big Shoulders Display"'),
    document.fonts.load('700 18px "JetBrains Mono"'),
    document.fonts.load('400 22px "JetBrains Mono"'),
    document.fonts.load('500 14px "JetBrains Mono"'),
  ]);
  await document.fonts.ready;
});
await page.screenshot({ path: outPath, type: 'png', omitBackground: false, fullPage: false });
await browser.close();
console.log(`wrote ${outPath}`);
