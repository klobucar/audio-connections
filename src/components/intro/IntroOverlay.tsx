import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { useIsMobile, useOrientation } from '../../hooks/useOrientation';
import { IntroCard1 } from './IntroCard1';
import { IntroCard2 } from './IntroCard2';
import { IntroCard3 } from './IntroCard3';
import { IntroCard4 } from './IntroCard4';

/** Bump when intro content changes materially (e.g. new feature card).
 *  App.tsx compares this against the version persisted in localStorage;
 *  returning players whose saved version is lower will see the intro again. */
export const INTRO_VERSION = 2;

interface IntroOverlayProps {
  onDismiss: () => void;
}

type CardId = 'title' | 'rules' | 'peel' | 'pwa';

interface CardDef {
  id: CardId;
  render: (playKey: number, variant: 'mobile' | 'desktop') => JSX.Element;
}

const TITLE_CARD: CardDef = {
  id: 'title',
  render: (playKey, variant) => <IntroCard1 playKey={playKey} variant={variant} />,
};
const RULES_CARD: CardDef = {
  id: 'rules',
  render: (playKey, variant) => <IntroCard2 playKey={playKey} variant={variant} />,
};
const PEEL_CARD: CardDef = {
  id: 'peel',
  render: (playKey, variant) => <IntroCard4 playKey={playKey} variant={variant} />,
};
const PWA_CARD: CardDef = {
  id: 'pwa',
  render: (playKey) => <IntroCard3 playKey={playKey} />,
};

const MOBILE_CARDS: CardDef[] = [TITLE_CARD, RULES_CARD, PEEL_CARD, PWA_CARD];
const DESKTOP_CARDS: CardDef[] = [TITLE_CARD, RULES_CARD, PEEL_CARD];

const SWIPE_THRESHOLD_PX = 40;

export function IntroOverlay({ onDismiss }: IntroOverlayProps) {
  const isMobile = useIsMobile();
  const orientation = useOrientation();
  // Layout variant tracks viewport shape, not device class. A landscape phone
  // (wide, short) fits the desktop layout — row of 4 tiles, single-line title
  // — far better than the portrait 2×2 + stacked title. The card list still
  // gates on isMobile so phone users in either orientation get the PWA card.
  const variant: 'mobile' | 'desktop' =
    isMobile && orientation === 'portrait' ? 'mobile' : 'desktop';
  const cards = isMobile ? MOBILE_CARDS : DESKTOP_CARDS;

  const [i, setI] = useState(0);
  // Bumped on every card switch so child cards can rerun their entry
  // animations from the top. Decoupled from `i` so explicit "replay this
  // same card" is possible later if we ever want it.
  const [playKey, setPlayKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Snap back to card 0 if the viewport flips between mobile and desktop and
  // the previously-active index falls off the end of the new list.
  useEffect(() => {
    if (i >= cards.length) setI(0);
  }, [cards.length, i]);

  const goto = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(cards.length - 1, next));
      setI(clamped);
      setPlayKey((k) => k + 1);
    },
    [cards.length],
  );
  const goNext = useCallback(() => goto(i + 1), [goto, i]);
  const goPrev = useCallback(() => goto(i - 1), [goto, i]);

  // Keyboard: ← → navigate, Esc skips to the end card (next press dismisses).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (i < cards.length - 1) goNext();
        else onDismiss();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [i, cards.length, goNext, goPrev, onDismiss]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]!.clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0]!.clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -SWIPE_THRESHOLD_PX) {
      if (i < cards.length - 1) goNext();
    } else if (dx > SWIPE_THRESHOLD_PX) {
      goPrev();
    }
  };

  const last = i === cards.length - 1;
  const card = cards[i]!;

  return (
    <div
      className="intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="How to play Audio Connections"
    >
      <button
        type="button"
        className="intro-skip"
        onClick={onDismiss}
        style={{ visibility: last ? 'hidden' : 'visible' }}
      >
        SKIP &#9656;
      </button>

      <div
        className="intro-stage"
        key={i}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {card.render(playKey, variant)}
      </div>

      <div className="intro-nav">
        <div className="intro-dots" role="tablist" aria-label="Intro cards">
          {cards.map((c, k) => (
            <button
              key={c.id}
              type="button"
              className={`intro-dot${k === i ? ' active' : ''}`}
              onClick={() => goto(k)}
              aria-label={`Go to card ${k + 1}`}
              aria-current={k === i}
            />
          ))}
        </div>
        {last ? (
          <button type="button" className="intro-start" onClick={onDismiss}>
            START PLAYING &#9656;
          </button>
        ) : (
          <button type="button" className="intro-next" onClick={goNext}>
            NEXT &#9656;
          </button>
        )}
      </div>
    </div>
  );
}
