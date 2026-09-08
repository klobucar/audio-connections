// Dev-server half of the puzzle builder (`/?mode=builder`, dev only).
//
// Exposes a tiny JSON API under /__builder/ that the page uses; the same
// operations are available from the terminal via scripts/puzzle.ts. Both act
// on the draft file at the repo root (.puzzle-draft.json, gitignored), so a
// person in the browser and an agent in the terminal see one draft.
//
// Only registered for `vite` (dev server): `apply: 'serve'`. Nothing here is
// bundled or reachable in a production build.
//
//   GET  /__builder/draft            → Draft
//   PUT  /__builder/draft            → Draft (body: Draft)
//   GET  /__builder/search?term=&limit=  → SearchHit[]
//   GET  /__builder/lookup?ids=1,2   → SearchHit[]
//   GET  /__builder/check?previews=1 → CheckResult (for the current draft)
//   POST /__builder/export           → { path, slug } (body: { slug, overwrite? })
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { checkDraft, exportDraft, lookupItunes, readDraft, searchItunes, writeDraft } from './builder-ops.ts';
import { coerceDraft } from '../src/builder/draft.ts';

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function builderDev(): Plugin {
  return {
    name: 'builder-dev',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      server.middlewares.use('/__builder', (req, res, next) => {
        void (async () => {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const route = `${req.method} ${url.pathname}`;
          try {
            switch (route) {
              case 'GET /draft':
                return json(res, 200, readDraft(root));
              case 'PUT /draft':
                return json(res, 200, writeDraft(root, coerceDraft(JSON.parse(await readBody(req)))));
              case 'GET /search': {
                const term = url.searchParams.get('term')?.trim() ?? '';
                if (!term) return json(res, 400, { error: 'term is required' });
                return json(res, 200, await searchItunes(term, Number(url.searchParams.get('limit') ?? 25)));
              }
              case 'GET /lookup': {
                const ids = (url.searchParams.get('ids') ?? '').split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0);
                return json(res, 200, await lookupItunes(ids));
              }
              case 'GET /check':
                return json(res, 200, await checkDraft(root, readDraft(root), { verifyPreviews: url.searchParams.get('previews') === '1' }));
              case 'POST /export': {
                const body = JSON.parse(await readBody(req)) as { slug?: string; overwrite?: boolean };
                return json(res, 200, exportDraft(root, readDraft(root), String(body.slug ?? ''), !!body.overwrite));
              }
              default:
                return next();
            }
          } catch (e) {
            return json(res, 400, { error: e instanceof Error ? e.message : String(e) });
          }
        })();
      });
    },
  };
}
