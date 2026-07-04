import { useReducer, useCallback } from "react";
import { fallbackClips } from "../data/fallbackClips";
import { fetchAnimeThemes } from "../api/animeThemes";

export const MAX_GUESSES = 3;
export const TOTAL_QUESTIONS = 10;

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
  guessValue: "",
  incorrectToastTrigger: 0,
  validationTrigger: 0,
};

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

function reducer(state, action) {
  switch (action.type) {
    case "START_GAME": {
      return startRound(
        { ...state, score: 0, questionsAnswered: 0, usingOnlineClips: false, phase: "playing" },
        fallbackClips,
        []
      );
    }
    case "SWITCH_SOURCE": {
      return startRound(
        { ...state, score: 0, usingOnlineClips: action.usingOnlineClips },
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
        { ...state, score: 0, questionsAnswered: 0, phase: "playing" },
        state.videoClips,
        []
      );
    }
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

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

  const submitGuess = useCallback(
    (guess) => {
      const isCorrect = state.currentAcceptedAnswers.some(
        (answer) => answer.toLowerCase() === guess.toLowerCase()
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
