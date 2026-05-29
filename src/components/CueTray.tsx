import type { ChromeOrientation } from './SolvedBar';

interface CueTrayProps {
  selected: Set<number>;
  orientation: ChromeOrientation;
}

/** Mobile chrome: shows the number of currently-cued tracks plus 4 indicator
 *  dots. In landscape it stacks vertically; in portrait it's a horizontal
 *  bar. Display-only — tracks are cued/uncued from the tiles themselves. */
export function CueTray({ selected, orientation }: CueTrayProps) {
  const count = selected.size;

  return (
    <div className={`cue-tray cue-tray--${orientation}`} data-testid="cue-tray">
      <div className="cue-tray-bar">
        <span className={`cue-tray-count${count > 0 ? ' on' : ''}`}>
          {count} CUED
        </span>
        <span className="cue-tray-dots" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`cue-tray-dot${i < count ? ' on' : ''}`} />
          ))}
        </span>
      </div>
    </div>
  );
}
