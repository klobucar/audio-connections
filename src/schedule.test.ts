import { describe, expect, it } from 'vitest';
import {
  LAUNCH_EPOCH,
  diffPastDays,
  idFromSlug,
  previewWarnings,
  resolve,
  schedule as liveSchedule,
  type PuzzleContent,
  type ScheduleEntry,
} from './schedule';

/** Minimal valid content; resolve() only cares that the slug maps to *something*. */
function content(author = 'test'): PuzzleContent {
  return { author, themes: [] };
}

/** Build a content map covering every slug a schedule references. */
function contentFor(schedule: ScheduleEntry[]): Map<string, PuzzleContent> {
  const m = new Map<string, PuzzleContent>();
  for (const e of schedule) {
    const slug = typeof e === 'string' ? e : e.slug;
    m.set(slug, content(slug));
  }
  return m;
}

function run(schedule: ScheduleEntry[], epoch?: string) {
  return resolve(schedule, contentFor(schedule), epoch);
}

describe('resolve — basic auto-dating', () => {
  it('dates the first entry on the epoch and counts up by one day', () => {
    const out = run(['a', 'b', 'c'], '2026-05-10');
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['a', 1, '2026-05-10'],
      ['b', 2, '2026-05-11'],
      ['c', 3, '2026-05-12'],
    ]);
  });

  it('derives releaseAt as midnight UTC of the date', () => {
    const [p] = run(['a'], '2026-05-10');
    expect(p!.releaseAt).toBe('2026-05-10T00:00:00Z');
  });

  it('crosses a month boundary correctly', () => {
    const out = run(['a', 'b', 'c'], '2026-05-30');
    expect(out.map((p) => p.date)).toEqual(['2026-05-30', '2026-05-31', '2026-06-01']);
  });

  it('defaults to LAUNCH_EPOCH when no epoch is given', () => {
    const [p] = run(['a']);
    expect(p!.date).toBe(LAUNCH_EPOCH);
  });
});

describe('resolve — pins', () => {
  it('honours an explicit pinned date', () => {
    const out = run(['a', { slug: 'b', date: '2026-06-30' }], '2026-05-10');
    expect(out.find((p) => p.slug === 'b')!.date).toBe('2026-06-30');
  });

  it('re-anchors subsequent auto entries to pinned + 1', () => {
    const out = run(['a', { slug: 'b', date: '2026-06-30' }, 'c'], '2026-05-10');
    expect(out.find((p) => p.slug === 'c')!.date).toBe('2026-07-01');
  });

  it('auto entries skip a reserved pin date that falls in their path', () => {
    // a=May10, b would be May11 but May11 is pinned to c → b jumps to May12.
    const out = run(['a', 'b', { slug: 'c', date: '2026-05-11' }], '2026-05-10');
    const bySlug = Object.fromEntries(out.map((p) => [p.slug, p.date]));
    expect(bySlug).toMatchObject({ a: '2026-05-10', c: '2026-05-11', b: '2026-05-12' });
  });

  it('a held late date listed last is numbered last (the worked-example shape)', () => {
    // Maintainer contract: list in roughly chronological order. Autos that
    // should precede a held date go *before* the pin in the list, so the
    // cursor flows from the epoch and the pin lands at the end.
    const out = run(['x', 'y', { slug: 'held', date: '2026-06-30' }], '2026-06-14');
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['x', 1, '2026-06-14'],
      ['y', 2, '2026-06-15'],
      ['held', 3, '2026-06-30'],
    ]);
  });

  it('numbers by date rank, not list order, when a pin is dated before its predecessors', () => {
    // 'early' is listed THIRD but pinned to a date before x/y → it ranks first.
    // This is the property that makes picker-order == unlock-order by
    // construction: the number is the date rank regardless of authoring order.
    const out = run(['x', 'y', { slug: 'early', date: '2026-06-14' }], '2026-06-20');
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['early', 1, '2026-06-14'],
      ['x', 2, '2026-06-20'],
      ['y', 3, '2026-06-21'],
    ]);
  });
});

describe('resolve — pauses (gaps in the calendar, not in numbers)', () => {
  it('expresses a multi-day pause via a pinned resume date; numbers stay dense', () => {
    const out = run(['a', 'b', { slug: 'c', date: '2026-06-11' }], '2026-06-08');
    // a Jun8, b Jun9, [Jun10 skipped], c Jun11 — numbers 1,2,3 (no skipped number).
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['a', 1, '2026-06-08'],
      ['b', 2, '2026-06-09'],
      ['c', 3, '2026-06-11'],
    ]);
  });
});

describe('resolve — two puzzles on one day', () => {
  // Deliberate doubling-up is expressed by PINNING both entries to the same
  // date. An auto entry can't be used for this — it always skips a reserved
  // date (see the test below), which is what stops an auto entry silently
  // colliding with a pin.
  it('gives two entries pinned to one date consecutive numbers and one releaseAt', () => {
    const out = run(
      [{ slug: 'b', date: '2026-06-20' }, { slug: 'c', date: '2026-06-20' }, 'd'],
      '2026-06-20',
    );
    expect(out.map((p) => [p.slug, p.day, p.date])).toEqual([
      ['b', 1, '2026-06-20'],
      ['c', 2, '2026-06-20'],
      ['d', 3, '2026-06-21'], // auto resumes from the shared date + 1
    ]);
    expect(out[0]!.releaseAt).toBe(out[1]!.releaseAt);
  });

  it('an auto entry never shares a day with a pin — it skips onto the next free date', () => {
    // a is auto and would want the epoch (Jun20), but Jun20 is pinned to b,
    // so a is pushed to the next free day rather than doubling up by accident.
    const out = run(['a', { slug: 'b', date: '2026-06-20' }], '2026-06-20');
    const bySlug = Object.fromEntries(out.map((p) => [p.slug, p.date]));
    expect(bySlug).toEqual({ b: '2026-06-20', a: '2026-06-21' });
  });
});

describe('resolve — errors', () => {
  it('throws when a scheduled slug has no content', () => {
    expect(() => resolve(['ghost'], new Map(), '2026-05-10')).toThrow(/no puzzle file\/content/);
  });

  it('throws on a duplicate slug in the schedule', () => {
    expect(() => run(['a', 'a'], '2026-05-10')).toThrow(/more than once/);
  });

  it('throws on a malformed date', () => {
    expect(() => run([{ slug: 'a', date: '2026/05/10' }])).toThrow(/Invalid schedule date/);
  });

  it('throws on an impossible calendar date', () => {
    expect(() => run([{ slug: 'a', date: '2026-02-30' }])).toThrow(/Invalid calendar date/);
  });

  it('throws when a backward pin makes two auto entries collide', () => {
    // epoch May10: a wants May10, but May10 is pinned to b → a jumps to May11.
    // c then auto-dates from b(May10)+1 = May11 → collides with a.
    expect(() => run(['a', { slug: 'b', date: '2026-05-10' }, 'c'], '2026-05-10')).toThrow(
      /collided/,
    );
  });
});

describe('resolve — golden master (frozen released prefix)', () => {
  // The released back-catalogue (days 1..20) is contiguous, one-per-day, from
  // the launch epoch. resolve() MUST reproduce these dates and numbers exactly,
  // or the cutover would shift a live puzzle's number and orphan its saves.
  // This is the safety net the ADR's "frozen released prefix" CI check guards.
  it('reproduces days 1..20 as 2026-05-10 .. 2026-05-29', () => {
    const slugs = Array.from({ length: 20 }, (_, i) => `day-${i + 1}`);
    const out = run(slugs, LAUNCH_EPOCH);
    expect(out).toHaveLength(20);
    out.forEach((p, i) => {
      expect(p.day).toBe(i + 1);
      expect(p.slug).toBe(`day-${i + 1}`);
    });
    expect(out[0]!.date).toBe('2026-05-10');
    expect(out[19]!.date).toBe('2026-05-29');
  });

  it('preserves content identity through resolution', () => {
    const map = new Map<string, PuzzleContent>([['day-1', content('Corey Farwell')]]);
    const [p] = resolve(['day-1'], map, LAUNCH_EPOCH);
    expect(p!.content.author).toBe('Corey Farwell');
  });
});

describe('the live schedule resolves the current catalogue', () => {
  // Resolve the REAL schedule against synthetic content (one stub per scheduled
  // slug) so these checks pin the schedule's STRUCTURE independent of puzzle
  // file contents. Every assertion below holds for a schedule of ANY length, so
  // appending a puzzle needs NO edits here — that is the point. (Counting
  // entries or freezing a per-row table would force a hand-edit on every add,
  // and would also wrongly freeze the still-movable unreleased tail.)
  //
  // What deliberately is NOT here: a guard that a PAST day wasn't renamed or
  // renumbered. That question depends on "today" and on the previous schedule,
  // so it can't live in a pure, deterministic unit test without reading the
  // wall clock (a self-detonating, unbisectable test). It lives in CI instead,
  // where reading the clock + diffing against origin/main is legitimate — see
  // the past-day guard. Here we assert only timeless structural invariants.
  const stub = new Map<string, PuzzleContent>(
    liveSchedule.map((e) => {
      const slug = typeof e === 'string' ? e : e.slug;
      return [slug, content(slug)] as const;
    }),
  );
  const out = resolve(liveSchedule, stub, LAUNCH_EPOCH);

  it('numbers densely 1..N in chronological order', () => {
    out.forEach((p, i) => expect(p.day).toBe(i + 1));
    for (let i = 1; i < out.length; i++) {
      expect(out[i]!.date >= out[i - 1]!.date).toBe(true);
    }
  });

  it('assigns every puzzle a unique save key', () => {
    const keys = out.map((p) => idFromSlug(p.slug));
    expect(new Set(keys).size).toBe(keys.length);
  });

  // The orphaned-saves guard for the released back-catalogue. Each legacy
  // `day-N` file is a puzzle that shipped before the slug migration, so live
  // players hold saves under the bare numeric key 'N'. That key is
  // idFromSlug('day-N'), and the puzzle's public number/date are also a matter
  // of record. So every `day-N` entry MUST resolve to number N, the bare key
  // 'N', and date epoch+(N-1) — reordering one (or shifting a pin ahead of it)
  // breaks this loudly. Self-extending: it checks whatever day-N entries exist,
  // with no count to bump. (A *rename* of a day-N file drops it from this set
  // rather than failing here; that case is the CI past-day guard's job.)
  it('freezes every legacy day-N entry to its numeric identity (number, save key, date)', () => {
    const epochMs = Date.UTC(2026, 4, 10); // 2026-05-10, the launch epoch
    let checked = 0;
    for (const p of out) {
      const m = /^day-(\d+)$/.exec(p.slug);
      if (!m) continue;
      const n = Number(m[1]);
      const date = new Date(epochMs + (n - 1) * 86_400_000).toISOString().slice(0, 10);
      expect([p.day, p.slug, idFromSlug(p.slug), p.date], `legacy ${p.slug}`).toEqual([
        n,
        `day-${n}`,
        String(n),
        date,
      ]);
      checked++;
    }
    // Sanity: the released back-catalogue exists and is being checked, so this
    // test can never silently pass by matching zero entries.
    expect(checked).toBeGreaterThanOrEqual(22);
  });
});

describe('idFromSlug', () => {
  it('collapses a legacy day-N slug to the bare number (live save key)', () => {
    expect(idFromSlug('day-1')).toBe('1');
    expect(idFromSlug('day-22')).toBe('22');
    expect(idFromSlug('day-100')).toBe('100');
  });

  it('uses an author slug verbatim as its own id', () => {
    expect(idFromSlug('tqbf-1')).toBe('tqbf-1');
    expect(idFromSlug('rob-tetrel-2')).toBe('rob-tetrel-2');
    expect(idFromSlug('bojanrajkovic-1')).toBe('bojanrajkovic-1');
  });

  it('only collapses an EXACT ^day-N$ match, never a handle that starts with "day"', () => {
    expect(idFromSlug('day-1-extra')).toBe('day-1-extra');
    expect(idFromSlug('dayton-3')).toBe('dayton-3');
    expect(idFromSlug('day-')).toBe('day-');
  });
});

describe('diffPastDays — released days are frozen, the future is free', () => {
  // Resolve from a fixed epoch so "released" is decided by `today`, not the
  // host clock. Epoch 2026-05-10: a..e are 05-10..05-14.
  const EPOCH = '2026-05-10';
  const TODAY = '2026-05-12'; // a, b, c are released (<= today); d, e are future.

  it('reports nothing when the schedule is unchanged', () => {
    const s = run(['a', 'b', 'c', 'd', 'e'], EPOCH);
    expect(diffPastDays(s, s, TODAY)).toEqual([]);
  });

  it('reports nothing when a new puzzle is appended (the common case)', () => {
    const before = run(['a', 'b', 'c', 'd', 'e'], EPOCH);
    const after = run(['a', 'b', 'c', 'd', 'e', 'f'], EPOCH);
    expect(diffPastDays(before, after, TODAY)).toEqual([]);
  });

  it('reports nothing when a future puzzle is reordered or inserted', () => {
    const before = run(['a', 'b', 'c', 'd', 'e'], EPOCH);
    // d and e are both future (> today); swapping them is allowed.
    const after = run(['a', 'b', 'c', 'e', 'd'], EPOCH);
    expect(diffPastDays(before, after, TODAY)).toEqual([]);
  });

  it('flags a released day that gets renumbered by a reorder', () => {
    const before = run(['a', 'b', 'c', 'd', 'e'], EPOCH);
    const after = run(['b', 'a', 'c', 'd', 'e'], EPOCH); // a and b (both released) swap
    const v = diffPastDays(before, after, TODAY);
    expect(v).toEqual([
      { slug: 'a', before: { day: 1, date: '2026-05-10' }, after: { day: 2, date: '2026-05-11' }, reason: 'redated' },
      { slug: 'b', before: { day: 2, date: '2026-05-11' }, after: { day: 1, date: '2026-05-10' }, reason: 'redated' },
    ]);
  });

  it('flags a released day whose file was renamed (slug vanishes)', () => {
    const before = run(['a', 'b', 'c', 'd', 'e'], EPOCH);
    const after = run(['a', 'renamed', 'c', 'd', 'e'], EPOCH); // b → renamed
    expect(diffPastDays(before, after, TODAY)).toEqual([
      { slug: 'b', before: { day: 2, date: '2026-05-11' }, after: null, reason: 'removed' },
    ]);
  });

  it("freezes TODAY's just-launched puzzle against reordering", () => {
    // c is dated exactly TODAY — already seen by players, so it must not move,
    // even though it only released hours ago.
    const before = run(['a', 'b', 'c', 'd', 'e'], EPOCH);
    const after = run(['a', 'b', 'd', 'c', 'e'], EPOCH); // c (today) and d (future) swap
    const v = diffPastDays(before, after, TODAY);
    expect(v.map((x) => x.slug)).toEqual(['c']); // only c is past; d was future
    expect(v[0]!.reason).toBe('redated');
  });

  it('distinguishes a pure renumber from a redate', () => {
    // Two puzzles pinned to one day (two-per-day): swapping their list order
    // keeps both dates but flips their numbers — a renumber, not a redate.
    const before = run(
      [{ slug: 'a', date: '2026-05-10' }, { slug: 'b', date: '2026-05-10' }],
      EPOCH,
    );
    const after = run(
      [{ slug: 'b', date: '2026-05-10' }, { slug: 'a', date: '2026-05-10' }],
      EPOCH,
    );
    const v = diffPastDays(before, after, '2026-05-10');
    expect(v.map((x) => [x.slug, x.reason])).toEqual([
      ['a', 'renumbered'],
      ['b', 'renumbered'],
    ]);
  });

  it('rejects a malformed today', () => {
    const s = run(['a'], EPOCH);
    expect(() => diffPastDays(s, s, '2026/05/12')).toThrow(/Invalid "today"/);
  });
});

describe('previewWarnings', () => {
  const EPOCH = '2026-05-10';

  it('is quiet for a healthy schedule with ample runway and no gaps', () => {
    // 8 contiguous days from epoch; today is day 1, so 7 are in the future.
    const s = run(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], EPOCH);
    expect(previewWarnings(s, '2026-05-10', { runway: 5 })).toEqual([]);
  });

  it('warns when the runway is thin', () => {
    const s = run(['a', 'b', 'c', 'd', 'e'], EPOCH); // 05-10..05-14
    // today = 05-12 → future = d(13), e(14) = 2 < 5.
    const w = previewWarnings(s, '2026-05-12', { runway: 5 });
    expect(w.map((x) => x.kind)).toContain('thin-runway');
    expect(w.find((x) => x.kind === 'thin-runway')!.message).toMatch(/2 future puzzle/);
  });

  it('flags a forward gap but not a historical one', () => {
    // a=05-10, b=05-11, then a pinned jump to 05-20 (8 empty days), then c.
    const s = run(['a', 'b', { slug: 'far', date: '2026-05-20' }], EPOCH);
    // today = 05-10: the 05-11→05-20 gap is in the future → flagged.
    const future = previewWarnings(s, '2026-05-10', { runway: 1, gapDays: 2 });
    expect(future.filter((x) => x.kind === 'gap')).toHaveLength(1);
    expect(future.find((x) => x.kind === 'gap')!.message).toMatch(/8 empty day/);
    // today = 05-25: the whole gap is in the past → not flagged.
    const past = previewWarnings(s, '2026-05-25', { runway: 0, gapDays: 2 });
    expect(past.filter((x) => x.kind === 'gap')).toHaveLength(0);
  });

  it('does not flag a single-day-apart contiguous run as a gap', () => {
    const s = run(['a', 'b', 'c'], EPOCH);
    const w = previewWarnings(s, '2026-05-10', { runway: 1, gapDays: 2 });
    expect(w.filter((x) => x.kind === 'gap')).toHaveLength(0);
  });

  it('flags a run-dry queue whose last puzzle is in the past', () => {
    const s = run(['a', 'b', 'c'], EPOCH); // last = 05-12
    const w = previewWarnings(s, '2026-05-20', { runway: 0 });
    expect(w.map((x) => x.kind)).toContain('past-unreleased');
    expect(w.find((x) => x.kind === 'past-unreleased')!.message).toMatch(/run dry/);
  });

  it('rejects a malformed today', () => {
    const s = run(['a'], EPOCH);
    expect(() => previewWarnings(s, 'nope')).toThrow(/Invalid "today"/);
  });
});
