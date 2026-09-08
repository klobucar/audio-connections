// Dev-only puzzle builder page (/?mode=builder under `npm run dev`).
//
// Search iTunes, audition previews, drop tracks into the four sides, name
// the categories, watch the reuse check, export a puzzle file. State lives
// in the dev server's draft file (see vite-plugins/builder-dev.ts), which the
// CLI (scripts/puzzle.ts) edits too — the page polls for outside changes so
// a person here and an agent in the terminal work on one draft.
import { useCallback, useEffect, useRef, useState } from 'react';
import './builder.css';
import { SIDES, emptyTrack, filledCount, type Draft, type DraftTrack } from './draft';
import type { CheckResult, SearchHit } from '../../vite-plugins/builder-ops.ts';

const API = '/__builder';
const SAVE_DEBOUNCE_MS = 400;
const CHECK_DEBOUNCE_MS = 700;
const POLL_MS = 2000;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, init);
  const body = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
  return body;
}

function slotLabel(side: number, index: number): string {
  return `${SIDES[side]}${index + 1}`;
}

export function Builder() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState('Loading draft…');
  const [term, setTerm] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [slug, setSlug] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Local edits not yet acknowledged by the server. While > 0 the poller
  // must not clobber the page with an older server copy.
  const pendingSaves = useRef(0);
  const draftRef = useRef<Draft | null>(null);
  draftRef.current = draft;

  /* ── Draft sync ── */
  const runCheck = useCallback(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(() => {
      setChecking(true);
      api<CheckResult>('/check')
        .then(setCheck)
        .catch((e: Error) => setStatus(`Check failed: ${e.message}`))
        .finally(() => setChecking(false));
    }, CHECK_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    api<Draft>('/draft')
      .then((d) => {
        setDraft(d);
        setStatus('Draft loaded.');
        runCheck();
      })
      .catch((e: Error) => setStatus(`Cannot reach the dev server: ${e.message}`));
  }, [runCheck]);

  // Poll for edits made from the terminal.
  useEffect(() => {
    const id = setInterval(() => {
      if (pendingSaves.current > 0) return;
      api<Draft>('/draft')
        .then((remote) => {
          const local = draftRef.current;
          if (!local || remote.updatedAt <= local.updatedAt) return;
          setDraft(remote);
          setStatus(`Draft updated outside the page at ${new Date(remote.updatedAt).toLocaleTimeString()}.`);
          runCheck();
        })
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [runCheck]);

  /** Apply a local edit: update state now, persist after a short debounce. */
  const edit = useCallback(
    (fn: (d: Draft) => void) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        fn(next);
        return next;
      });
      pendingSaves.current++;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const d = draftRef.current;
        if (!d) return;
        api<Draft>('/draft', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
          .then((saved) => {
            setDraft((cur) => (cur ? { ...cur, updatedAt: saved.updatedAt } : cur));
            setStatus(`Saved ${new Date(saved.updatedAt).toLocaleTimeString()}.`);
            runCheck();
          })
          .catch((e: Error) => setStatus(`Save failed: ${e.message}`))
          .finally(() => {
            pendingSaves.current = 0;
          });
      }, SAVE_DEBOUNCE_MS);
    },
    [runCheck],
  );

  /* ── Audio ── */
  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
  }, []);

  const play = useCallback(
    async (id: number, previewUrl?: string) => {
      if (playingId === id) return stop();
      stop();
      let url = previewUrl;
      if (!url) {
        const [hit] = await api<SearchHit[]>(`/lookup?ids=${id}`);
        url = hit?.previewUrl;
        if (!url) return setStatus(`iTunes id ${id} has no preview clip.`);
      }
      const a = new Audio(url);
      a.addEventListener('ended', () => setPlayingId((cur) => (cur === id ? null : cur)));
      audioRef.current = a;
      setPlayingId(id);
      a.play().catch((e: Error) => setStatus(`Playback failed: ${e.message}`));
    },
    [playingId, stop],
  );

  useEffect(() => () => audioRef.current?.pause(), []);

  /* ── Search ── */
  const search = useCallback(
    async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      const t = term.trim();
      if (!t) return;
      setSearching(true);
      try {
        setHits(await api<SearchHit[]>(`/search?term=${encodeURIComponent(t)}&limit=25`));
      } catch (err) {
        setStatus(`Search failed: ${(err as Error).message}`);
      } finally {
        setSearching(false);
      }
    },
    [term],
  );

  /* ── Slots ── */
  const inDraft = (id: number): string | null => {
    if (!draft) return null;
    for (let i = 0; i < 4; i++) {
      const j = draft.themes[i]!.tracks.findIndex((tr) => tr.id === id);
      if (j !== -1) return slotLabel(i, j);
    }
    return null;
  };

  const addHit = (hit: SearchHit, side: number) => {
    if (!hit.previewUrl) return setStatus(`${hit.artist} — ${hit.title} has no preview clip; pick another release.`);
    const where = inDraft(hit.id);
    if (where) return setStatus(`Already in slot ${where}.`);
    const index = draft?.themes[side]!.tracks.findIndex((tr) => tr.id === null) ?? -1;
    if (index === -1) return setStatus(`Side ${SIDES[side]} is full.`);
    edit((d) => {
      d.themes[side]!.tracks[index] = {
        ...emptyTrack(),
        id: hit.id,
        artist: hit.artist,
        title: hit.title,
        previewUrl: hit.previewUrl,
        album: hit.album,
        year: hit.year,
      };
    });
  };

  const exportFile = async () => {
    setExportMsg(null);
    try {
      const r = await api<{ path: string }>('/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim(), overwrite }),
      });
      setExportMsg({ ok: true, text: `Wrote ${r.path}. Next: npm run validate, then open a PR.` });
    } catch (e) {
      setExportMsg({ ok: false, text: (e as Error).message });
    }
  };

  if (!draft) {
    return (
      <div className="editor-page builder">
        <p className="editor-sub">{status}</p>
      </div>
    );
  }

  const filled = filledCount(draft);
  const ready = check ? check.problems.length === 0 && check.noPreview.length === 0 : false;

  return (
    <div className="editor-page builder">
      <header className="editor-header builder-header">
        <div>
          <h1>Puzzle builder</h1>
          <p className="editor-sub">
            Dev only. Draft lives in <code>.puzzle-draft.json</code>; the terminal can edit it too (<code>npm run puzzle</code>).
            <a href="/" className="editor-link">← Back to game</a>
          </p>
        </div>
        <div className="builder-status" role="status" aria-live="polite">
          {status}
        </div>
      </header>

      <div className="builder-columns">
        {/* ── Search ── */}
        <section className="builder-panel">
          <h2>Find tracks</h2>
          <form className="builder-search" onSubmit={search}>
            <input
              className="builder-input"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="artist, title, or both"
              autoFocus
            />
            <button type="submit" className="editor-pill" disabled={searching || !term.trim()}>
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
          <ul className="builder-hits">
            {hits.map((h) => {
              const where = inDraft(h.id);
              return (
                <li key={h.id} className={`builder-hit${h.previewUrl ? '' : ' builder-hit--dead'}${where ? ' builder-hit--used' : ''}`}>
                  <button
                    type="button"
                    className={`builder-play${playingId === h.id ? ' playing' : ''}`}
                    onClick={() => play(h.id, h.previewUrl)}
                    disabled={!h.previewUrl}
                    aria-label={playingId === h.id ? 'Stop' : 'Play preview'}
                    title={h.previewUrl ? 'Play 30s preview' : 'No preview clip — unusable'}
                  >
                    {playingId === h.id ? '■' : '▶'}
                  </button>
                  <div className="builder-hit-text">
                    <div className="builder-hit-title">
                      {h.artist} — {h.title}
                    </div>
                    <div className="builder-hit-meta">
                      {h.album}
                      {h.year ? ` · ${h.year}` : ''} · id {h.id}
                      {!h.previewUrl && ' · no preview'}
                      {where && ` · in ${where}`}
                    </div>
                  </div>
                  <div className="builder-hit-add">
                    {SIDES.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        className="builder-side-btn"
                        onClick={() => addHit(h, i)}
                        disabled={!h.previewUrl || !!where || draft.themes[i]!.tracks.every((tr) => tr.id !== null)}
                        title={`Add to side ${s}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
            {hits.length === 0 && <li className="builder-empty">Search results land here. Play to audition, then A/B/C/D to place.</li>}
          </ul>
        </section>

        {/* ── Draft ── */}
        <section className="builder-panel">
          <h2>
            Draft · {filled}/16
          </h2>
          <div className="builder-meta">
            <label>
              <span>Author</span>
              <input className="builder-input" value={draft.author} onChange={(e) => edit((d) => { d.author = e.target.value; })} placeholder="Your name" />
            </label>
            <label>
              <span>Constraint (optional, ≤80)</span>
              <input className="builder-input" value={draft.constraint} onChange={(e) => edit((d) => { d.constraint = e.target.value; })} placeholder="e.g. Only #1 hits" />
            </label>
          </div>

          {draft.themes.map((t, i) => (
            <div key={SIDES[i]} className={`builder-side theme-${i}`}>
              <div className="builder-side-head">
                <span className="builder-side-badge">{SIDES[i]}</span>
                <input
                  className="builder-input builder-theme-input"
                  value={t.theme}
                  onChange={(e) => edit((d) => { d.themes[i]!.theme = e.target.value; })}
                  placeholder={`Category ${SIDES[i]}${i === 3 ? ' (purple — the free one)' : ''}`}
                />
              </div>
              {t.tracks.map((tr: DraftTrack, j) => (
                <div key={j} className={`builder-slot${tr.id === null ? ' builder-slot--empty' : ''}`}>
                  <span className="builder-slot-label">{slotLabel(i, j)}</span>
                  {tr.id === null ? (
                    <span className="builder-slot-empty">empty</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`builder-play${playingId === tr.id ? ' playing' : ''}`}
                        onClick={() => play(tr.id!, tr.previewUrl)}
                        aria-label={playingId === tr.id ? 'Stop' : 'Play preview'}
                      >
                        {playingId === tr.id ? '■' : '▶'}
                      </button>
                      <div className="builder-slot-text">
                        <div className="builder-hit-title">
                          {tr.artist} — {tr.title}
                        </div>
                        <input
                          className="builder-input builder-note"
                          value={tr.note}
                          onChange={(e) => edit((d) => { d.themes[i]!.tracks[j]!.note = e.target.value; })}
                          placeholder="note (optional, shown after solving)"
                        />
                      </div>
                      <button
                        type="button"
                        className="builder-remove"
                        onClick={() => edit((d) => { d.themes[i]!.tracks[j] = emptyTrack(); })}
                        aria-label={`Remove ${slotLabel(i, j)}`}
                        title="Remove"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>

      {/* ── Check + export ── */}
      <section className="builder-panel builder-check">
        <h2>Check {checking && <span className="builder-dim">· running…</span>}</h2>
        {check && (
          <div className="builder-check-grid">
            <div>
              <h3>{check.problems.length === 0 ? '✓ Complete' : `Not ready (${check.problems.length})`}</h3>
              <ul>
                {check.problems.map((p) => (
                  <li key={p.where + p.message}>{p.message}</li>
                ))}
                {check.noPreview.map((s) => (
                  <li key={s}>{s} has no preview clip (unplayable)</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{check.reuse.length === 0 ? '✓ No collisions' : `Reuse if scheduled next (${check.reuse.length})`}</h3>
              <ul>
                {check.reuse.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {check.priorUses.length > 0 && (
                <>
                  <h3>Already in the catalogue ({check.priorUses.length})</h3>
                  <ul>
                    {check.priorUses.map((p) => (
                      <li key={p.slot + p.file}>
                        {p.slot} also in {p.file}
                        {p.day ? ` — Day ${p.day}, ${p.date}${p.released ? '' : ' (upcoming)'}` : ' (backlog)'}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
        <div className="builder-export">
          <input
            className="builder-input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="file slug, e.g. handle-3"
            spellCheck={false}
          />
          <label className="builder-overwrite">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> overwrite
          </label>
          <button type="button" className="editor-pill editor-pill--on" onClick={exportFile} disabled={!ready || !slug.trim()}>
            Export to src/puzzles/
          </button>
        </div>
        {exportMsg && <p className={exportMsg.ok ? 'editor-ok' : 'builder-error'}>{exportMsg.text}</p>}
      </section>
    </div>
  );
}
