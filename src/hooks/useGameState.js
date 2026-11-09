import { useReducer, useCallback } from "react";
import { fallbackClips } from "../data/fallbackClips";
import { fetchAnimeThemes } from "../api/animeThemes";
import { DAILY_ROUNDS, STAGE_POINTS, pointsFor } from "../lib/daily";

export const MAX_GUESSES = 3;
export const TOTAL_QUESTIONS = 10;

// Lowercases and strips punctuation so near-miss guesses still count:
// "haikyuu" matches "Haikyuu!!", "steins gate" matches "Steins;Gate",
// "kaiju no 8" matches "Kaiju No. 8". Letters and digits are kept, every
// other run of characters collapses to a single space.
function normalizeTitle(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// Picks a clip that hasn't been played yet this game: random in practice,
// in listed order in daily mode (the daily's three anime have a fixed order).
// Returns null when every clip has been used, which ends the game early.
function pickNextClip(videoClips, usedClips, ordered = false) {
  const clipUrls = Object.keys(videoClips);
  const unusedClips = clipUrls.filter((url) => !usedClips.includes(url));
  if (unusedClips.length === 0) return null;

  const url = ordered
    ? unusedClips[0]
    : unusedClips[Math.floor(Math.random() * unusedClips.length)];
  return { url, answers: videoClips[url].answers };
}

const initialState = {
  phase: "intro", // 'intro' | 'playing' | 'gameOver'
  mode: "daily", // 'daily' | 'practice'
  puzzleNumber: null, // daily only
  totalQuestions: DAILY_ROUNDS, // the app opens in daily mode
  score: 0,
  questionsAnswered: 0,
  usedClips: [],
  videoClips: {},
  usingOnlineClips: false,
  selectedYear: null, // null = all years (any clip source)
  currentClipUrl: "",
  currentAcceptedAnswers: [],
  remainingGuesses: MAX_GUESSES,
  revealed: false,
  submitVisible: true,
  roundResult: null, // null | { correct: boolean }
  roundResults: [], // per-round correctness for the current game, in order
  roundAttempts: [], // per round: guess number that got it (1-3), or 0 if missed
  guessValue: "",
  incorrectToastTrigger: 0,
  lastMissSkipped: false, // daily: whether the last turn spent was a Skip
  validationTrigger: 0,
};

// Sets up the next round: picks a fresh clip, resets the per-round fields
// (guesses, input, reveal state), and marks the clip as used. If there are
// no clips left it flips the game into the gameOver phase instead.
function startRound(state, videoClips, usedClips) {
  const next = pickNextClip(videoClips, usedClips, state.mode === "daily");
  if (!next) {
    return {
      ...state,
      videoClips,
      usedClips,
      phase: "gameOver",
      submitVisible: false,
      roundResult: null,
    };
  }

  return {
    ...state,
    videoClips,
    usedClips: [...usedClips, next.url],
    currentClipUrl: next.url,
    currentAcceptedAnswers: next.answers,
    remainingGuesses: MAX_GUESSES,
    revealed: false,
    submitVisible: true,
    roundResult: null,
    guessValue: "",
  };
}

// Central game state machine. Every gameplay event (starting a game,
// submitting a guess, moving to the next round, ...) is an action handled
// here, so all the rules live in one place instead of scattered across
// components.
function reducer(state, action) {
  switch (action.type) {
    case "START_GAME": {
      return startRound(
        {
          ...state,
          mode: "practice",
          puzzleNumber: null,
          totalQuestions: TOTAL_QUESTIONS,
          score: 0,
          questionsAnswered: 0,
          roundResults: [],
          roundAttempts: [],
          usingOnlineClips: false,
          selectedYear: null,
          phase: "playing",
        },
        fallbackClips,
        []
      );
    }
    // Starts (or resumes) today's daily. `attempts` is the saved per-round
    // progress and `remainingGuesses` the guesses left on the round in play,
    // so a refresh can't hand out fresh guesses.
    case "START_DAILY": {
      const { videoClips, puzzleNumber, attempts = [], remainingGuesses } = action;
      const urls = Object.keys(videoClips);
      const usedClips = urls.slice(0, attempts.length);
      const score = pointsFor(attempts);
      const base = {
        ...state,
        mode: "daily",
        puzzleNumber,
        totalQuestions: urls.length,
        score,
        questionsAnswered: attempts.length,
        roundResults: attempts.map((a) => a > 0),
        roundAttempts: attempts,
        usingOnlineClips: false,
        selectedYear: null,
        phase: "playing",
      };

      // Already finished today: land on the results with the last clip shown.
      if (attempts.length >= urls.length) {
        const lastUrl = urls[urls.length - 1];
        return {
          ...base,
          videoClips,
          usedClips: urls,
          phase: "gameOver",
          currentClipUrl: lastUrl,
          currentAcceptedAnswers: videoClips[lastUrl].answers,
          revealed: true,
          submitVisible: false,
          roundResult: null,
          guessValue: "",
        };
      }

      const next = startRound(base, videoClips, usedClips);
      return remainingGuesses > 0 && remainingGuesses <= MAX_GUESSES
        ? { ...next, remainingGuesses }
        : next;
    }
    case "SWITCH_SOURCE": {
      return startRound(
        {
          ...state,
          mode: "practice",
          puzzleNumber: null,
          totalQuestions: TOTAL_QUESTIONS,
          score: 0,
          questionsAnswered: 0,
          roundResults: [],
          roundAttempts: [],
          usingOnlineClips: action.usingOnlineClips,
          selectedYear: action.year ?? null,
        },
        action.videoClips,
        []
      );
    }
    case "SET_GUESS": {
      return { ...state, guessValue: action.value };
    }
    case "SHOW_VALIDATION": {
      return { ...state, validationTrigger: state.validationTrigger + 1 };
    }
    case "SUBMIT_CORRECT": {
      // Daily scores by stage (100 / 60 / 30); practice is 1 point a round.
      const attempt = MAX_GUESSES - state.remainingGuesses + 1;
      return {
        ...state,
        revealed: true,
        score: state.score + (state.mode === "daily" ? STAGE_POINTS[attempt] : 1),
        questionsAnswered: state.questionsAnswered + 1,
        submitVisible: false,
        roundResult: { correct: true },
        roundResults: [...state.roundResults, true],
        roundAttempts: [...state.roundAttempts, attempt],
      };
    }
    case "SUBMIT_INCORRECT_RETRY": {
      return {
        ...state,
        remainingGuesses: state.remainingGuesses - 1,
        incorrectToastTrigger: state.incorrectToastTrigger + 1,
        lastMissSkipped: Boolean(action.skipped),
        guessValue: "",
      };
    }
    case "SUBMIT_INCORRECT_FINAL": {
      return {
        ...state,
        remainingGuesses: 0,
        revealed: true,
        questionsAnswered: state.questionsAnswered + 1,
        submitVisible: false,
        roundResult: { correct: false },
        roundResults: [...state.roundResults, false],
        roundAttempts: [...state.roundAttempts, 0],
      };
    }
    case "CONTINUE": {
      if (state.questionsAnswered >= state.totalQuestions) {
        return { ...state, phase: "gameOver", roundResult: null };
      }
      return startRound({ ...state }, state.videoClips, state.usedClips);
    }
    case "PLAY_AGAIN": {
      return startRound(
        {
          ...state,
          score: 0,
          questionsAnswered: 0,
          roundResults: [],
          roundAttempts: [],
          phase: "playing",
        },
        state.videoClips,
        []
      );
    }
    default:
      return state;
  }
}

// The hook components actually use. Wraps the reducer and exposes the game
// state plus a set of named actions, so components call e.g.
// actions.submitGuess(...) instead of dispatching raw action objects.
export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Practice: the original 10-round game on the bundled clips.
  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  // Daily: `videoClips` is today's three anime in play order; `progress` is
  // what useDailyProgress saved ({ attempts, remainingGuesses }), if any.
  const startDaily = useCallback((videoClips, puzzleNumber, progress = {}) => {
    dispatch({ type: "START_DAILY", videoClips, puzzleNumber, ...progress });
  }, []);

  // Switches between the bundled local clips and the AnimeThemes.moe online
  // library. Fetching the online list can fail (network, API down), so this
  // returns false on failure and leaves the current game untouched.
  // Always clears an active year filter: the toggle and the year selector
  // are mutually resetting, so the dropdown reads "All years" afterwards.
  const toggleClipSource = useCallback(async () => {
    const goingOnline = !state.usingOnlineClips;
    try {
      const videoClips = goingOnline ? await fetchAnimeThemes() : fallbackClips;
      dispatch({ type: "SWITCH_SOURCE", videoClips, usingOnlineClips: goingOnline, year: null });
      return true;
    } catch (error) {
      console.error("Failed to switch clip source:", error);
      return false;
    }
  }, [state.usingOnlineClips]);

  // Restricts the game to anime that aired in `year` (always fetched from
  // the online library) and restarts. `null` returns to the local all-years
  // clips. Returns { ok, reason? } so the caller can surface errors; on
  // failure the current game is left untouched, matching toggleClipSource.
  const selectYear = useCallback(async (year) => {
    try {
      const videoClips = year === null ? fallbackClips : await fetchAnimeThemes({ year });
      if (year !== null && Object.keys(videoClips).length === 0) {
        return { ok: false, reason: "empty" };
      }
      dispatch({ type: "SWITCH_SOURCE", videoClips, usingOnlineClips: year !== null, year });
      return { ok: true };
    } catch (error) {
      console.error("Failed to load clips for year", year, error);
      return { ok: false, reason: "network" };
    }
  }, []);

  const setGuessValue = useCallback((value) => {
    dispatch({ type: "SET_GUESS", value });
  }, []);

  // Checks a guess against the accepted answers for the current clip
  // (case- and punctuation-insensitive) and routes to the right outcome:
  // correct, wrong but with guesses left, or wrong on the last guess (which
  // reveals the answer).
  const submitGuess = useCallback(
    (guess) => {
      const normalizedGuess = normalizeTitle(guess);
      const isCorrect = state.currentAcceptedAnswers.some(
        (answer) => normalizeTitle(answer) === normalizedGuess
      );

      if (isCorrect) {
        dispatch({ type: "SUBMIT_CORRECT" });
        return;
      }

      if (state.remainingGuesses - 1 <= 0) {
        dispatch({ type: "SUBMIT_INCORRECT_FINAL" });
      } else {
        dispatch({ type: "SUBMIT_INCORRECT_RETRY" });
      }
    },
    [state.currentAcceptedAnswers, state.remainingGuesses]
  );

  // Daily: spend a turn without guessing, which unlocks the next stage (longer
  // clip + a hint). On the last stage it gives up and reveals the answer.
  const skip = useCallback(() => {
    dispatch({
      type: state.remainingGuesses - 1 <= 0 ? "SUBMIT_INCORRECT_FINAL" : "SUBMIT_INCORRECT_RETRY",
      skipped: true,
    });
  }, [state.remainingGuesses]);

  const showValidationMessage = useCallback(() => {
    dispatch({ type: "SHOW_VALIDATION" });
  }, []);

  const continueAfterReveal = useCallback(() => {
    dispatch({ type: "CONTINUE" });
  }, []);

  const playAgain = useCallback(() => {
    dispatch({ type: "PLAY_AGAIN" });
  }, []);

  return {
    state,
    actions: {
      startGame,
      startDaily,
      toggleClipSource,
      selectYear,
      setGuessValue,
      submitGuess,
      skip,
      showValidationMessage,
      continueAfterReveal,
      playAgain,
    },
  };
}
