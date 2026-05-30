import type { Guess } from '../types';

/** Theme indices in the order the player actually found the groups.
 *
 *  `solvedThemes` is derived in theme-index order, so reconstruct the real
 *  solve order from the correct guesses (persisted, so it survives reload),
 *  then append any solved-but-not-found themes — the loss auto-reveal — in
 *  theme order behind them. Shared by SolvedList, SolvedBar and
 *  MobileEndCards so all three render groups in one consistent order. */
export function solvedThemeOrder(guessHistory: Guess[], solvedThemes: Set<number>): number[] {
  const order: number[] = [];
  for (const g of guessHistory) {
    if (!g.correct) continue;
    const themeIdx = g.themes[0];
    if (themeIdx !== undefined && solvedThemes.has(themeIdx) && !order.includes(themeIdx)) {
      order.push(themeIdx);
    }
  }
  for (const themeIdx of solvedThemes) {
    if (!order.includes(themeIdx)) order.push(themeIdx);
  }
  return order;
}
