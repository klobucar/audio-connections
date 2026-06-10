import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { checkPuzzles } from './vite-plugins/check-puzzles';
import { emitPuzzleJson } from './vite-plugins/emit-puzzle-json';

// Opt-in HTTPS for testing PWA install + DOM secure-context APIs from a
// phone on the LAN. Vite 5 dropped the --https CLI flag, so we toggle the
// basic-ssl plugin via env var (`VITE_HTTPS=1 vite --host`). Cert is
// self-signed — browsers will warn; tap through.
const httpsEnabled = process.env.VITE_HTTPS === '1';

// Two GitHub Pages deployments coexist:
//   - Canonical (audio-connections org) → served at https://connections.audio
//     via custom domain, so built assets must be served from "/".
//   - Forks (e.g. klobucar/audio-connections) → served at
//     <owner>.github.io/<repo>/, so built assets need the repo prefix.
// We detect which one we're in via the GitHub Actions env vars; everything
// outside CI stays on "/" for local dev + preview.
const CANONICAL_OWNER = 'audio-connections';
const CUSTOM_DOMAIN = 'connections.audio';

function resolveBase(): string {
  if (!process.env.GITHUB_ACTIONS) return '/';
  if (process.env.GITHUB_REPOSITORY_OWNER === CANONICAL_OWNER) return '/';
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return repo ? `/${repo}/` : '/';
}

// Emit `dist/CNAME` only on the canonical deployment. Keeping the file out
// of `public/` means forks never ship it — otherwise their Pages site would
// try to serve at connections.audio and break.
function emitCname(): Plugin {
  return {
    name: 'emit-cname',
    apply: 'build',
    closeBundle() {
      if (process.env.GITHUB_REPOSITORY_OWNER !== CANONICAL_OWNER) return;
      const outDir = resolve('dist');
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, 'CNAME'), `${CUSTOM_DOMAIN}\n`);
    },
  };
}

// Content-Security-Policy, injected as a <meta> tag at build time only —
// GitHub Pages can't set response headers, so the meta tag is the only
// delivery available (which is also why there's no frame-ancestors: it's
// ignored in meta CSPs). Dev stays unrestricted because the React plugin's
// refresh preamble is an inline script and HMR needs a websocket, both of
// which this policy forbids.
//
// Origins that must stay open:
//   - fonts.googleapis.com / fonts.gstatic.com — the four UI font families.
//   - itunes.apple.com — metadata lookups (fetch; connect-src).
//   - audio-ssl.itunes.apple.com / *.mzstatic.com — preview audio, fetched
//     into blobs and (on blob failure) streamed directly into <audio>.
//     mzstatic is Apple's CDN; previews have historically moved between
//     these two hosts, so allow both.
//   - 'wasm-unsafe-eval' — the ReplayGain worker compiles ebur128.wasm;
//     plain 'self' does not permit WebAssembly compilation.
//   - data: in connect/media-src — mock mode (?mock) previews are a data:
//     WAV that gets fetched and played; img data: covers styles.css'
//     embedded images.
//   - blob: in connect-src — ReplayGain re-fetches each preview's blob URL
//     on the main thread to decode PCM (replaygain/decode.ts), in addition
//     to media-src blob: for <audio> playback.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "media-src 'self' blob: data: https://audio-ssl.itunes.apple.com https://*.mzstatic.com",
  "connect-src 'self' blob: data: https://itunes.apple.com https://audio-ssl.itunes.apple.com https://*.mzstatic.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function injectCsp(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), checkPuzzles(), emitPuzzleJson(), emitCname(), injectCsp(), ...(httpsEnabled ? [basicSsl()] : [])],
  base: resolveBase(),
  server: { port: 5173 },
});
