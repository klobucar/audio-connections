interface ControlsProps {
  selectedCount: number;
  gameOver: boolean;
  won: boolean;
  onDeselect: () => void;
  onSubmit: () => void;
}

export function Controls({ selectedCount, gameOver, won, onDeselect, onSubmit }: ControlsProps) {
  const submitText = gameOver
    ? won
      ? 'SOLVED'
      : 'GAME OVER'
    : `SUBMIT ${selectedCount}/4`;
  return (
    <div className="controls">
      <button
        type="button"
        className="action secondary"
        onClick={onDeselect}
        disabled={gameOver || selectedCount === 0}
        data-testid="deselect-btn"
      >
        DESELECT
        <span className="key-stripe">EJECT ◁</span>
      </button>
      <button
        type="button"
        className="action primary"
        onClick={onSubmit}
        disabled={gameOver || selectedCount !== 4}
        data-testid="submit-btn"
      >
        {submitText}
        <span className="key-stripe">▷▷ PLAY</span>
      </button>
    </div>
  );
}
