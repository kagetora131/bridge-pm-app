/**
 * The app is a fast-iterating demo, so we bump this whenever seed.ts changes
 * in a way that's worth surfacing immediately (new sample data, restructured
 * fields). Without this, a returning browser would keep showing whatever was
 * saved to localStorage on its very first visit — every later seed.ts update
 * would be invisible, because usePersistentState only falls back to the seed
 * default when the key is completely missing. Bumping the version here makes
 * a stale browser pick up the new sample data automatically, at the cost of
 * discarding anything the user had edited in — acceptable for sample data,
 * not something to do once this holds real user data.
 */
export const CURRENT_SEED_VERSION = '2026-09-24-progress-and-english-titles';

const VERSION_KEY = 'bridge-pm:seedVersion';
export const DATA_KEYS = ['projects', 'assignments', 'tasks', 'members', 'glossary', 'recurringMeetings', 'meetingBurdenLog'];

export function ensureLatestSeed(): void {
  try {
    const stored = window.localStorage.getItem(VERSION_KEY);
    if (stored === CURRENT_SEED_VERSION) return;
    for (const key of DATA_KEYS) window.localStorage.removeItem(`bridge-pm:${key}`);
    window.localStorage.setItem(VERSION_KEY, CURRENT_SEED_VERSION);
  } catch {
    // localStorage unavailable — nothing to do, app just uses in-memory defaults
  }
}

export function resetToSampleData(): void {
  try {
    for (const key of DATA_KEYS) window.localStorage.removeItem(`bridge-pm:${key}`);
    window.localStorage.setItem(VERSION_KEY, CURRENT_SEED_VERSION);
  } catch {
    // ignore
  }
  window.location.reload();
}
