import { DAILY_STORAGE_PREFIX as PREFIX } from "./daily";

// Browser-side daily state, kept in localStorage for every player (guests
// and signed-in alike):
//   <prefix>-<n>       today's progress: { attempts: [1|2|3|0...], remainingGuesses }
//   <prefix>-streak    { played, perfect, current, longest, lastPuzzle }
// Signed-in players also get results saved to Supabase (see api/stats.js).
// Every access is wrapped: storage can be blocked (private mode, settings).

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the game still works, it just won't persist.
  }
}

export function loadProgress(puzzleNumber) {
  const saved = read(`${PREFIX}-${puzzleNumber}`);
  return Array.isArray(saved?.attempts) ? saved : null;
}

export function saveProgress(puzzleNumber, progress) {
  write(`${PREFIX}-${puzzleNumber}`, progress);
  // Drop progress from more than a week ago so keys don't pile up forever.
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const match = localStorage.key(i)?.match(new RegExp(`^${PREFIX}-(\\d+)$`));
      if (match && Number(match[1]) < puzzleNumber - 7) localStorage.removeItem(match[0]);
    }
  } catch {
    // ignore
  }
}

const EMPTY_STREAK = { played: 0, perfect: 0, current: 0, longest: 0, lastPuzzle: null };

export function loadStreak() {
  return { ...EMPTY_STREAK, ...read(`${PREFIX}-streak`) };
}

// Counts a finished daily toward the streak. Safe to call more than once for
// the same puzzle. Streak = consecutive days completed, any score.
export function recordFinished(puzzleNumber, attempts) {
  const streak = loadStreak();
  if (streak.lastPuzzle === puzzleNumber) return streak;

  const current = streak.lastPuzzle === puzzleNumber - 1 ? streak.current + 1 : 1;
  const next = {
    played: streak.played + 1,
    perfect: streak.perfect + (attempts.every((a) => a === 1) ? 1 : 0), // 300 points
    current,
    longest: Math.max(streak.longest, current),
    lastPuzzle: puzzleNumber,
  };
  write(`${PREFIX}-streak`, next);
  return next;
}

// The streak as it stands today: it's broken if the last completed daily
// was before yesterday.
export function currentStreak(streak, puzzleNumber) {
  return streak.lastPuzzle !== null && streak.lastPuzzle >= puzzleNumber - 1
    ? streak.current
    : 0;
}
