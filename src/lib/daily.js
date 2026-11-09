import dailyPool from "../data/dailyPool.json" with { type: "json" };

// Daily #1 is the player's local calendar day of LAUNCH_DATE. Each local
// midnight starts a new puzzle (Wordle-style), so everyone on the same
// calendar date gets the same three anime.
const LAUNCH_DATE = { year: 2026, month: 11, day: 8 };
export const DAILY_ROUNDS = 3;

// Each anime has three stages. A wrong guess or Skip moves to the next one,
// which plays more of the opening and unlocks a hint. Earlier = more points.
// Keep STAGE_POINTS in sync with record_daily in supabase/daily.sql.
export const STAGE_SECONDS = [8, 30, 60];
export const STAGE_POINTS = { 1: 100, 2: 60, 3: 30, 0: 0 }; // by attempt (0 = missed)
export const MAX_DAILY_POINTS = DAILY_ROUNDS * STAGE_POINTS[1];

// Stage index (0-2) for the guesses left on the round (3, 2, 1).
export function stageIndex(remainingGuesses) {
  return Math.min(Math.max(STAGE_SECONDS.length - remainingGuesses, 0), STAGE_SECONDS.length - 1);
}

// How many seconds of the opening the player can hear right now.
export function stageLimit(remainingGuesses) {
  return STAGE_SECONDS[stageIndex(remainingGuesses)];
}

export function pointsFor(attempts) {
  return attempts.reduce((total, attempt) => total + (STAGE_POINTS[attempt] ?? 0), 0);
}

// Fixed seed for the pool shuffle. Changing it, or rebuilding
// dailyPool.json, reshuffles every future day's picks.
const SHUFFLE_SEED = 0x41b1;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Counts whole local calendar days. Using Date.UTC on the local Y/M/D parts
// means DST shifts (23- or 25-hour days) can't skew the count.
function dayIndex(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
}

const LAUNCH_INDEX = Math.floor(
  Date.UTC(LAUNCH_DATE.year, LAUNCH_DATE.month - 1, LAUNCH_DATE.day) / MS_PER_DAY
);

// Dev helper: ?day=N on the URL previews a different puzzle number. It also
// keeps that preview's progress separate, so it never touches real streaks.
function dayOverride() {
  if (typeof window === "undefined" || !import.meta.env?.DEV) return null;
  const value = Number(new URLSearchParams(window.location.search).get("day"));
  return Number.isInteger(value) && value > 0 ? value : null;
}

// localStorage prefix for daily progress/streaks; ?day previews get their own.
export const DAILY_STORAGE_PREFIX = dayOverride() ? "daily-preview" : "daily";

export function getPuzzleNumber(date = new Date()) {
  return dayOverride() ?? dayIndex(date) - LAUNCH_INDEX + 1;
}

// Small deterministic PRNG so the shuffle is identical for every player.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The whole pool in a fixed shuffled order; day N walks through it three at a
// time, so nothing repeats until the pool runs out (~110 days), then it cycles.
const ORDER = (() => {
  const random = mulberry32(SHUFFLE_SEED);
  const indices = dailyPool.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
})();

// Today's three anime, in play order.
export function getDailyAnime(puzzleNumber) {
  const start = (puzzleNumber - 1) * DAILY_ROUNDS;
  return Array.from({ length: DAILY_ROUNDS }, (_, k) => {
    const position = (((start + k) % ORDER.length) + ORDER.length) % ORDER.length;
    return dailyPool[ORDER[position]];
  });
}

// Milliseconds until the next local midnight (the next puzzle).
export function msUntilNextPuzzle(now = new Date()) {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight - now;
}

// Pool titles matching a partial guess, for instant autocomplete in daily
// mode. Matches any accepted answer but shows the display title.
export function searchPool(query, limit = 5) {
  const q = query.toLowerCase();
  const matches = dailyPool.filter((anime) =>
    anime.answers.some((answer) => answer.toLowerCase().includes(q))
  );
  return matches
    .sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    })
    .slice(0, limit)
    .map((anime) => ({ mal_id: anime.malId, title: anime.title }));
}
