import { useEffect, useMemo, useRef, useState } from "react";
import { useGameState, MAX_GUESSES } from "./hooks/useGameState";
import { useAuth } from "./context/AuthContext";
import { recordGame, recordDaily } from "./api/stats";
import {
  getPuzzleNumber,
  getDailyAnime,
  searchPool,
  STAGE_SECONDS,
  STAGE_POINTS,
  stageIndex,
  stageLimit,
} from "./lib/daily";
import {
  loadProgress,
  saveProgress,
  loadStreak,
  recordFinished,
  currentStreak,
} from "./lib/dailyProgress";
import ModeSwitch from "./components/ModeSwitch";
import DailyResultPopup from "./components/DailyResultPopup";
import ClipTimeline from "./components/ClipTimeline";
import HintList from "./components/HintList";
import IntroPopup from "./components/IntroPopup";
import Header from "./components/Header";
import VideoPlayer from "./components/VideoPlayer";
import GuessInput from "./components/GuessInput";
import StatsRow from "./components/StatsRow";
import ActionButtons from "./components/ActionButtons";
import MediaControls from "./components/MediaControls";
import PopupMessage from "./components/PopupMessage";
import IncorrectGuessPopup from "./components/IncorrectGuessPopup";
import RoundResultPopup from "./components/RoundResultPopup";
import ScorePopup from "./components/ScorePopup";
import UserMenu from "./components/UserMenu";
import AuthPopup from "./components/AuthPopup";
import StatsPopup from "./components/StatsPopup";

const EASE = "cubic-bezier(0.25, 0.1, 0.25, 1)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Daily mode: the blur eases at each stage (keyed by guesses remaining).
// Practice always uses the full blur.
const DAILY_BLUR = {
  3: { px: 10, scale: 1.12 },
  2: { px: 6, scale: 1.08 },
  1: { px: 3, scale: 1.04 },
};

export default function App() {
  const { state, actions } = useGameState();
  const { user, enabled: authEnabled } = useAuth();
  const isDaily = state.mode === "daily";

  // Today's puzzle is fixed for the life of the page; the result sheet's
  // countdown reloads the page at midnight to pick up the next one.
  const [puzzleNumber] = useState(() => getPuzzleNumber());
  const dailyAnime = useMemo(() => getDailyAnime(puzzleNumber), [puzzleNumber]);
  // The clip map the game reducer expects, in play order. The display title
  // goes first so the result sheet reveals it; `hints` unlock stage by stage.
  const dailyClips = useMemo(
    () =>
      Object.fromEntries(
        dailyAnime.map((anime) => [
          anime.videoUrl,
          {
            answers: [anime.title, ...anime.answers.filter((a) => a !== anime.title)],
            hints: anime.hints,
          },
        ])
      ),
    [dailyAnime]
  );
  const [dailyStreak, setDailyStreak] = useState(() => {
    const streak = loadStreak();
    return { current: currentStreak(streak, puzzleNumber), longest: streak.longest };
  });
  const videoRef = useRef(null);
  const guessInputRef = useRef(null);
  const cardRef = useRef(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  // Toast for clip-source failures (year with no clips, network errors).
  // Same trigger-counter pattern as the guess-validation toast.
  const [sourceError, setSourceError] = useState({ trigger: 0, text: "" });
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [statsPopupOpen, setStatsPopupOpen] = useState(false);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  // Media pill shows while the pointer is over the video or playback is paused.
  const [controlsHover, setControlsHover] = useState(false);
  // The round-result sheet lags the reducer slightly on correct answers so
  // the card can pulse first (see the effect below).
  const [resultShown, setResultShown] = useState(null);
  const lastVolumeRef = useRef(1);
  // How to Play only auto-opens until the player has started a game once
  // (persisted per browser); afterwards it's reachable via the "?" button.
  const [introOpen, setIntroOpen] = useState(
    () => localStorage.getItem("intro-seen") !== "true"
  );

  // Starts today's daily, resuming any saved progress (or straight to the
  // results if it's already done).
  function startDaily() {
    actions.startDaily(dailyClips, puzzleNumber, loadProgress(puzzleNumber) ?? {});
  }

  // Returning players skip the intro and land directly in today's daily.
  useEffect(() => {
    if (localStorage.getItem("intro-seen") === "true") {
      startDaily();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Closes the How to Play popup; on a first visit this also starts the daily.
  function handleIntroClose() {
    localStorage.setItem("intro-seen", "true");
    setIntroOpen(false);
    if (state.phase === "intro") startDaily();
  }

  // Daily <-> Practice. Leaving the daily is safe: its progress is saved
  // after every guess and restored when switching back. A practice game in
  // progress is discarded.
  function handleModeChange(mode) {
    videoRef.current?.pause();
    if (mode === "daily") startDaily();
    else actions.startGame();
  }

  // Save daily progress after every guess, so a refresh can't reset guesses.
  // Once a round is revealed its guesses are spent, so the next round starts
  // with a full set.
  useEffect(() => {
    if (!isDaily || state.puzzleNumber !== puzzleNumber) return;
    saveProgress(puzzleNumber, {
      attempts: state.roundAttempts,
      remainingGuesses: state.revealed ? MAX_GUESSES : state.remainingGuesses,
    });
  }, [isDaily, state.puzzleNumber, state.roundAttempts, state.remainingGuesses, state.revealed, puzzleNumber]);

  // When today's last anime is answered: update the browser streak, and for
  // signed-in players record the result to their account (the server ignores
  // repeats, so revisits are harmless and pick up the account's streak).
  const dailyDone = isDaily && state.roundAttempts.length >= state.totalQuestions;
  useEffect(() => {
    if (!dailyDone || state.puzzleNumber !== puzzleNumber) return;
    const local = recordFinished(puzzleNumber, state.roundAttempts);
    setDailyStreak({ current: local.current, longest: local.longest });
    if (!user) return;
    let cancelled = false;
    recordDaily(puzzleNumber, state.roundAttempts)
      .then((server) => {
        if (!cancelled && server) {
          setDailyStreak({ current: server.current, longest: server.longest });
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyDone, user]);

  // Keep local playback UI state in sync with the underlying <video> element.
  // Volume and mute are persisted to localStorage so they survive refreshes
  // (per browser/device).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setPaused(false);
    const handlePause = () => setPaused(true);
    const handleVolumeChange = () => {
      setMuted(video.muted);
      setVolume(video.volume);
      localStorage.setItem("player-volume", String(video.volume));
      localStorage.setItem("player-muted", String(video.muted));
    };

    // Restore last session's audio settings; fall back to full volume.
    const savedVolume = parseFloat(localStorage.getItem("player-volume"));
    video.volume = Number.isFinite(savedVolume)
      ? Math.min(Math.max(savedVolume, 0), 1)
      : 1;
    video.muted = localStorage.getItem("player-muted") === "true";
    if (video.volume > 0) lastVolumeRef.current = video.volume;
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  // Record the finished game to the signed-in player's profile, exactly once
  // per gameOver (the ref guard keeps StrictMode's double-invoked effects and
  // dependency changes from writing duplicates; it resets when a new game starts).
  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase !== "gameOver") {
      recordedRef.current = false;
      return;
    }
    // Daily results are recorded separately (above), not as practice games.
    if (state.mode !== "practice") return;
    if (recordedRef.current || !user || state.roundResults.length === 0) return;
    recordedRef.current = true;
    recordGame(state.roundResults).catch(console.error);
  }, [state.phase, state.mode, user, state.roundResults]);

  // Wrong-but-not-final guess: shake the input (±3px, Apple-subtle) and
  // refocus it for the next attempt.
  useEffect(() => {
    if (state.incorrectToastTrigger === 0) return;
    const input = guessInputRef.current;
    if (!input) return;
    input.focus();
    if (!prefersReducedMotion()) {
      input.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(3px)" },
          { transform: "translateX(-2px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 320, easing: "ease-in-out" }
      );
    }
  }, [state.incorrectToastTrigger]);

  // Daily: when a wrong guess or Skip unlocks the next stage, replay the clip
  // from the start so the player hears the longer cut straight away. (Only
  // within the same clip, so resuming a saved stage doesn't autoplay.)
  const lastStageRef = useRef({ url: "", remaining: MAX_GUESSES });
  useEffect(() => {
    const last = lastStageRef.current;
    lastStageRef.current = { url: state.currentClipUrl, remaining: state.remainingGuesses };
    if (!isDaily || state.revealed) return;
    if (last.url !== state.currentClipUrl || state.remainingGuesses >= last.remaining) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [isDaily, state.currentClipUrl, state.remainingGuesses, state.revealed]);

  // Round verdict choreography. A correct answer earns a soft blue pulse on
  // the card first, with the result sheet following ~650ms later; a miss
  // shows the sheet immediately. (`resultShown` is what the sheet renders.)
  useEffect(() => {
    if (!state.roundResult) {
      setResultShown(null);
      return;
    }
    if (state.roundResult.correct && !prefersReducedMotion()) {
      cardRef.current?.animate(
        [
          {
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0 rgba(0,113,227,0.45)",
          },
          {
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4), 0 0 0 26px rgba(0,113,227,0)",
          },
        ],
        { duration: 750, easing: "ease-out" }
      );
      const timeout = setTimeout(() => setResultShown(state.roundResult), 650);
      return () => clearTimeout(timeout);
    }
    setResultShown(state.roundResult);
  }, [state.roundResult]);

  // The next four handlers control the <video> element directly through its
  // ref; the play/pause/volumechange listeners above then sync our UI state.

  function togglePlayPause() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  // Restarts the clip from the beginning and resumes playback if it was paused.
  function handleRestart() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (video.paused) video.play().catch(() => {});
  }

  // Mutes/unmutes, remembering the volume from before muting so unmuting
  // restores it instead of jumping back to full volume.
  function handleToggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    if (nextMuted) {
      lastVolumeRef.current = video.volume;
    } else {
      video.volume = lastVolumeRef.current;
    }
  }

  // Sets the volume from the slider; any manual volume change also unmutes.
  function handleVolumeChange(nextVolume) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = nextVolume;
    video.muted = false;
  }

  // Submits the current guess. Empty guesses just show a validation nudge;
  // real ones pause the video and hand off to the game logic for scoring.
  function handleSubmit() {
    if (!state.submitVisible) return;
    const guess = state.guessValue.trim();
    if (guess === "") {
      actions.showValidationMessage();
      return;
    }
    videoRef.current?.pause();
    actions.submitGuess(guess);
  }

  // Daily: spend a turn without guessing to unlock the next stage, or give
  // up on the last one.
  function handleSkip() {
    if (!state.submitVisible) return;
    videoRef.current?.pause();
    actions.skip();
  }

  // Dismisses the round-result sheet and moves on. Between rounds the card
  // content fades down and out (280ms), the clip swaps, and the new round
  // fades back up (500ms) — skipped for reduced motion and at game end.
  function handleContinue() {
    const card = cardRef.current;
    const lastRound = state.questionsAnswered >= state.totalQuestions;
    if (!card || lastRound || prefersReducedMotion()) {
      actions.continueAfterReveal();
      return;
    }
    const out = card.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(10px)" },
      ],
      { duration: 280, easing: EASE, fill: "forwards" }
    );
    out.onfinish = () => {
      actions.continueAfterReveal();
      out.cancel();
      card.animate(
        [
          { opacity: 0, transform: "translateY(-10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 500, easing: EASE }
      );
    };
  }

  // Switches between local and online clips, showing a loading state on the
  // segmented control while the online library is being fetched. Going local
  // also clears an active year filter (the reducer resets it), so the
  // dropdown re-renders to "All years".
  async function handleToggleSource() {
    setSourceLoading(true);
    await actions.toggleClipSource();
    setSourceLoading(false);
  }

  // Restricts the game to a single year (online-only) or back to all years.
  // Failures leave the current game running and just show a toast.
  async function handleSelectYear(year) {
    setSourceLoading(true);
    const result = await actions.selectYear(year);
    setSourceLoading(false);
    if (!result.ok) {
      setSourceError((prev) => ({
        trigger: prev.trigger + 1,
        text:
          result.reason === "empty"
            ? `No clips found for ${year}`
            : "Couldn't load clips — check your connection",
      }));
    }
  }

  // Global keyboard shortcuts: Space/Arrows/M/R, plus Enter-to-submit
  useEffect(() => {
    function handleKeyDown(e) {
      const inputFocused = document.activeElement === guessInputRef.current;
      if (inputFocused) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "Enter") {
        if (state.submitVisible) handleSubmit();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        const video = videoRef.current;
        if (video) handleVolumeChange(Math.min(video.volume + 0.1, 1));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        const video = videoRef.current;
        if (video) handleVolumeChange(Math.max(video.volume - 0.1, 0));
      } else if (e.code === "KeyM") {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleRestart();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.submitVisible, state.guessValue]);

  // While the round-result sheet is open, Enter dismisses it (matches its
  // Continue button, including the round transition).
  useEffect(() => {
    if (!resultShown) return;
    function handleKeyDown(e) {
      if (e.code === "Enter") handleContinue();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  // Daily stage UI: clip limit, Skip label and hints for the anime in play.
  const stage = stageIndex(state.remainingGuesses);
  const dailyLive = isDaily && state.phase !== "intro";
  const clipLimit = state.revealed ? STAGE_SECONDS[STAGE_SECONDS.length - 1] : stageLimit(state.remainingGuesses);
  const skipLabel =
    stage < STAGE_SECONDS.length - 1
      ? `Skip +${STAGE_SECONDS[stage + 1] - STAGE_SECONDS[stage]}s`
      : "Give up";
  const currentHints = state.videoClips[state.currentClipUrl]?.hints ?? [];
  const lastAttempt = state.roundAttempts[state.roundAttempts.length - 1];

  return (
    <>
      {introOpen && (
        <IntroPopup onStart={handleIntroClose} resume={state.phase !== "intro"} />
      )}

      {/* Reopens How to Play; mirrors the account button in the opposite corner */}
      <button
        className="corner-btn fixed top-4 left-4 z-[1100] text-[15px] font-medium"
        onClick={() => setIntroOpen(true)}
        aria-label="How to play"
        title="How to play"
      >
        ?
      </button>

      <UserMenu
        onOpenAuth={() => setAuthPopupOpen(true)}
        onOpenStats={() => setStatsPopupOpen(true)}
      />

      <Header />

      <ModeSwitch mode={state.mode} onChange={handleModeChange} />

      <div
        className={`game-card w-fit max-phone:w-full ${dailyLive ? "daily-stage" : ""}`}
        ref={cardRef}
      >
        <VideoPlayer
          ref={videoRef}
          src={state.currentClipUrl}
          revealed={state.revealed}
          blur={isDaily ? DAILY_BLUR[state.remainingGuesses] : undefined}
          maxTime={isDaily && !state.revealed ? stageLimit(state.remainingGuesses) : undefined}
          onHoverChange={setControlsHover}
        >
          <MediaControls
            visible={controlsHover || paused}
            paused={paused}
            muted={muted}
            volume={volume}
            onPlayPause={togglePlayPause}
            onRestart={handleRestart}
            onToggleMute={handleToggleMute}
            onVolumeChange={handleVolumeChange}
          />
        </VideoPlayer>

        {dailyLive && (
          <>
            <ClipTimeline
              videoRef={videoRef}
              limit={clipLimit}
              skipLabel={skipLabel}
              onSkip={handleSkip}
              disabled={!state.submitVisible}
            />
            <HintList
              hints={currentHints}
              unlocked={state.revealed ? currentHints.length : stage}
              unlockAt={STAGE_SECONDS.slice(1).map((s) => (s >= 60 ? `${s / 60}:00` : `${s}s`))}
            />
          </>
        )}

        <GuessInput
          inputRef={guessInputRef}
          localSearch={isDaily ? searchPool : undefined}
          value={state.guessValue}
          onChange={actions.setGuessValue}
          onSubmitEnter={handleSubmit}
          submitVisible={state.submitVisible}
          onSubmit={handleSubmit}
        />

        <div className="flex justify-between items-center gap-3.5 mt-4 flex-wrap max-tab:justify-center max-phone:flex-col max-phone:gap-2.5">
          <StatsRow
            score={state.score}
            remainingGuesses={state.remainingGuesses}
            maxGuesses={MAX_GUESSES}
            round={state.questionsAnswered + 1}
            totalRounds={state.totalQuestions}
            label={isDaily ? `Daily #${puzzleNumber}` : undefined}
          />
          {/* Clip source and year only apply to Practice. */}
          {!isDaily && (
            <ActionButtons
              usingOnlineClips={state.usingOnlineClips}
              sourceLoading={sourceLoading}
              onToggleSource={handleToggleSource}
              selectedYear={state.selectedYear}
              onSelectYear={handleSelectYear}
            />
          )}
        </div>
      </div>

      {/* Desktop-only cheat sheet for the global shortcuts wired up above.
          Hidden on small/short screens by styles.css. */}
      <div className="kbd-hints" aria-hidden="true">
        <span><kbd>Space</kbd> Play</span>
        <span><kbd>R</kbd> Restart</span>
        <span><kbd>M</kbd> Mute</span>
        <span><kbd>← →</kbd> Volume</span>
      </div>

      <div className="input-wrapper">
        <PopupMessage
          trigger={state.validationTrigger}
          message="Please enter your guess before submitting"
          tone="info"
        />
        <PopupMessage id="source-error-message" trigger={sourceError.trigger} message={sourceError.text} />
      </div>

      <RoundResultPopup
        result={resultShown}
        revealedTitle={state.currentAcceptedAnswers[0]}
        round={state.questionsAnswered}
        totalRounds={state.totalQuestions}
        score={state.score}
        points={isDaily && lastAttempt !== undefined ? STAGE_POINTS[lastAttempt] : undefined}
        onContinue={handleContinue}
      />

      <IncorrectGuessPopup
        trigger={state.incorrectToastTrigger}
        hide={Boolean(state.roundResult)}
        remainingGuesses={state.remainingGuesses}
        skipped={isDaily && state.lastMissSkipped}
      />

      <DailyResultPopup
        visible={isDaily && state.phase === "gameOver"}
        puzzleNumber={puzzleNumber}
        titles={dailyAnime.map((anime) => anime.title)}
        attempts={state.roundAttempts}
        streak={dailyStreak}
        onPractice={() => handleModeChange("practice")}
      />

      <ScorePopup
        visible={!isDaily && state.phase === "gameOver"}
        score={state.score}
        // A year with fewer than 10 clips ends the game early; show the real
        // number of rounds played (|| guards the 0/0 NaN-accuracy case).
        totalQuestions={state.questionsAnswered || state.totalQuestions}
        onPlayAgain={actions.playAgain}
        signedIn={Boolean(user)}
        onOpenAuth={authEnabled ? () => setAuthPopupOpen(true) : null}
      />

      <AuthPopup visible={authPopupOpen} onClose={() => setAuthPopupOpen(false)} />
      <StatsPopup visible={statsPopupOpen} onClose={() => setStatsPopupOpen(false)} />
    </>
  );
}
