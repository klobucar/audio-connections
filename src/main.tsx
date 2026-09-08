import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { Editor } from './Editor';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('root element not found');
// StrictMode is intentionally omitted: it unmounts and remounts each newly
// added DOM node once in development, which re-runs CSS keyframe animations
// (like the solved-banner slide-in). Production behavior is unaffected.
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');

function pick() {
  if (mode === 'editor') return <Editor />;
  // Puzzle builder: dev server only. The branch is dead in a production
  // build (import.meta.env.DEV is inlined to false), so the chunk is never
  // emitted and `?mode=builder` on the live site just shows the game.
  if (mode === 'builder' && import.meta.env.DEV) {
    const Builder = lazy(() => import('./builder/Builder').then((m) => ({ default: m.Builder })));
    return (
      <Suspense fallback={null}>
        <Builder />
      </Suspense>
    );
  }
  return <App />;
}

createRoot(rootEl).render(pick());
