import { useState } from 'react';
import type { Guess } from '../types';
import { buildShareText } from './shareText';

interface EndPanelProps {
  won: boolean;
  day: number;
  guessHistory: Guess[];
  author: string;
  date: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

const COPY_LABEL: Record<CopyState, string> = {
  idle: 'Copy result',
  copied: 'Copied!',
  failed: 'Copy failed — select text manually',
};

export function EndPanel({ won, day, guessHistory, author, date }: EndPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  // A record without guessHistory came from the editor (or a future schema
  // that didn't carry it). The emoji grid and the per-side recovery count
  // need the history, so we render a simpler card without them.
  const hasHistory = guessHistory.length > 0;
  const shareText = buildShareText(day, guessHistory);
  const sidesDone = guessHistory.filter((g) => g.correct).length;
  const headline = won ? 'Mixtape Mastered.' : 'Out of Tape.';
  const subhead = won
    ? 'Full tape · 4/4 sides'
    : hasHistory
      ? `Recovered ${sidesDone}/4 sides`
      : 'Tape ejected';
  const cat = `AC-${String(day).padStart(3, '0')}`;
  const year = date.match(/\d{4}/)?.[0] ?? '';
  const runout = `${cat}-${won ? 'A' : 'B'} · ℗ ${year} · Puzzle by ${author} · Ferric Master NR`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div className={`end-panel ${won ? 'win' : 'loss'}`} data-testid="end-panel">
      <div className="end-watermark" aria-hidden="true">
        Audio Connections
      </div>
      <div className="end-jcard-header">
        <span>Audio Connections · Master Insert</span>
        <span>NO. {String(day).padStart(3, '0')}</span>
      </div>
      <div className="end-stamp">{won ? 'CLEARED' : 'REWIND'}</div>
      <h2>{headline}</h2>
      <p className="end-subhead">{subhead}</p>
      <dl className="end-meta">
        <div>
          <dt>Catalogue</dt>
          <dd>Day {day}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{date}</dd>
        </div>
      </dl>
      {hasHistory && (
        <>
          <div className="share-text" data-testid="share-text">
            {shareText}
          </div>
          <button
            type="button"
            className={`copy-btn${copyState === 'copied' ? ' copied' : ''}`}
            onClick={handleCopy}
            data-testid="copy-btn"
          >
            {COPY_LABEL[copyState]}
          </button>
        </>
      )}
      <div className="end-runout" aria-hidden="true">
        {runout}
      </div>
    </div>
  );
}
