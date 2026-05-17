interface MistakesDisplayProps {
  mistakes: number;
  max: number;
}

export function MistakesDisplay({ mistakes, max }: MistakesDisplayProps) {
  return (
    <div className="mistakes-row">
      <span>Mistakes</span>
      <div className="mistakes-dots" data-testid="mistakes-dots">
        {Array.from({ length: max }, (_, i) => {
          // Same mapping as before: a single mistake lights the rightmost dot.
          const used = i >= max - mistakes;
          let cls = 'mistake-dot';
          if (used) cls += ' used';
          else if (mistakes >= 3) cls += ' danger';
          else if (mistakes >= 2) cls += ' warn';
          return <div key={i} className={cls} />;
        })}
      </div>
      <span>{max - mistakes} LEFT</span>
    </div>
  );
}
