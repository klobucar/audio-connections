import { useEffect, useRef, useState } from 'react';

const CONFIRM_TIMEOUT_MS = 3000;

interface ResetButtonProps {
  onReset: () => void;
}

export function ResetButton({ onReset }: ResetButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (confirming) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setConfirming(false);
      onReset();
    } else {
      setConfirming(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setConfirming(false);
        timerRef.current = null;
      }, CONFIRM_TIMEOUT_MS);
    }
  };

  return (
    <div className="reset-row">
      <button
        type="button"
        className={`reset-btn${confirming ? ' confirming' : ''}`}
        onClick={handleClick}
        data-testid="reset-btn"
      >
        <span className="toggle" />
        <span>{confirming ? 'Confirm Erase' : 'Erase Tape'}</span>
      </button>
    </div>
  );
}
