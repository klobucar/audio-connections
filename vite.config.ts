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

export default defineConfig({
  plugins: [react(), checkPuzzles(), emitPuzzleJson(), emitCname(), ...(httpsEnabled ? [basicSsl()] : [])],
  base: resolveBase(),
  server: { port: 5173 },
});
