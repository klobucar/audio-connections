import { useState } from 'react';
import type { Guess } from '../types';
import { THEME_EMOJI } from '../puzzles';

interface EndPanelProps {
  won: boolean;
  day: number;
  guessHistory: Guess[];
}

type CopyState = 'idle' | 'copied' | 'failed';

function buildShareText(day: number, guessHistory: Guess[]): string {
  const lines = [`Audio Connections ${day}`];
  for (const g of guessHistory) {
    lines.push(g.themes.map((t) => THEME_EMOJI[t]).join(''));
  }
  return lines.join('\n');
}

const COPY_LABEL: Record<CopyState, string> = {
  idle: 'Copy result',
  copied: 'Copied!',
  failed: 'Copy failed — select text manually',
};

export function EndPanel({ won, day, guessHistory }: EndPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const shareText = buildShareText(day, guessHistory);

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
      <h2>{won ? 'Solved!' : 'Game over'}</h2>
      <div className="share-text" data-testid="share-text">{shareText}</div>
      <button
        type="button"
        className={`copy-btn${copyState === 'copied' ? ' copied' : ''}`}
        onClick={handleCopy}
        data-testid="copy-btn"
      >
        {COPY_LABEL[copyState]}
      </button>
    </div>
  );
}
