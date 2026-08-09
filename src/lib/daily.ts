/**
 * The integer everybody plays today, derived from the reader's own calendar
 * date. Shared so the HUD and the animated world behind the hero can never
 * disagree about which world is currently up.
 */
export function dailySeed(date: Date): number {
  return (
    date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate()
  );
}
