import { useReducer, useCallback } from "react";
import { fallbackClips } from "../data/fallbackClips";
import { fetchAnimeThemes } from "../api/animeThemes";

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

// Picks a random clip that hasn't been played yet this game.
// Returns null when every clip has been used, which ends the game early.
function pickNextClip(videoClips, usedClips) {
  const clipUrls = Object.keys(videoClips);
  const unusedClips = clipUrls.filter((url) => !usedClips.includes(url));
  if (unusedClips.length === 0) return null;

  const url = unusedClips[Math.floor(Math.random() * unusedClips.length)];
  return { url, answers: videoClips[url].answers };
}

const initialState = {
  phase: "intro", // 'intro' | 'playing' | 'gameOver'
  score: 0,
  questionsAnswered: 0,
  usedClips: [],
  videoClips: {},
  usingOnlineClips: false,
  currentClipUrl: "",
  currentAcceptedAnswers: [],
  remainingGuesses: MAX_GUESSES,
  revealed: false,
  submitVisible: true,
  roundResult: null, // null | { correct: boolean }
  roundResults: [], // per-round correctness for the current game, in order
  guessValue: "",
  incorrectToastTrigger: 0,
  validationTrigger: 0,
};

// Sets up the next round: picks a fresh clip, resets the per-round fields
// (guesses, input, reveal state), and marks the clip as used. If there are
// no clips left it flips the game into the gameOver phase instead.
function startRound(state, videoClips, usedClips) {
  const next = pickNextClip(videoClips, usedClips);
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
        { ...state, score: 0, questionsAnswered: 0, roundResults: [], usingOnlineClips: false, phase: "playing" },
        fallbackClips,
        []
      );
    }
    case "SWITCH_SOURCE": {
      return startRound(
        { ...state, score: 0, roundResults: [], usingOnlineClips: action.usingOnlineClips },
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
      return {
        ...state,
        revealed: true,
        score: state.score + 1,
        questionsAnswered: state.questionsAnswered + 1,
        submitVisible: false,
        roundResult: { correct: true },
        roundResults: [...state.roundResults, true],
      };
    }
    case "SUBMIT_INCORRECT_RETRY": {
      return {
        ...state,
        remainingGuesses: state.remainingGuesses - 1,
        incorrectToastTrigger: state.incorrectToastTrigger + 1,
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
      };
    }
    case "CONTINUE": {
      if (state.questionsAnswered >= TOTAL_QUESTIONS) {
        return { ...state, phase: "gameOver", roundResult: null };
      }
      return startRound({ ...state }, state.videoClips, state.usedClips);
    }
    case "PLAY_AGAIN": {
      return startRound(
        { ...state, score: 0, questionsAnswered: 0, roundResults: [], phase: "playing" },
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

  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  // Switches between the bundled local clips and the AnimeThemes.moe online
  // library. Fetching the online list can fail (network, API down), so this
  // returns false on failure and leaves the current game untouched.
  const toggleClipSource = useCallback(async () => {
    const goingOnline = !state.usingOnlineClips;
    try {
      const videoClips = goingOnline ? await fetchAnimeThemes() : fallbackClips;
      dispatch({ type: "SWITCH_SOURCE", videoClips, usingOnlineClips: goingOnline });
      return true;
    } catch (error) {
      console.error("Failed to switch clip source:", error);
      return false;
    }
  }, [state.usingOnlineClips]);

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
      toggleClipSource,
      setGuessValue,
      submitGuess,
      showValidationMessage,
      continueAfterReveal,
      playAgain,
    },
  };
}
