interface PlayPauseIconProps {
  playing: boolean;
}

/** Inline SVG play/pause glyph for the solved track rows. Inline (not a font
 *  glyph) so it inherits `currentColor`, scales with `em`, and has identical
 *  geometry in both states — no per-font metric drift to fight. Sized and
 *  centered via the `.solved-track-icon` rule in styles.css. */
export function PlayPauseIcon({ playing }: PlayPauseIconProps) {
  return (
    <svg className="solved-track-icon" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {playing ? (
        <>
          <rect x="3.5" y="2.5" width="2.5" height="9" rx="0.4" />
          <rect x="8" y="2.5" width="2.5" height="9" rx="0.4" />
        </>
      ) : (
        <path d="M4 2.2 L11.5 7 L4 11.8 Z" />
      )}
    </svg>
  );
}
