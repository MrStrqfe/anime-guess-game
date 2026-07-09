import { useEffect, useRef, useState } from "react";
import { useGameState, MAX_GUESSES, TOTAL_QUESTIONS } from "./hooks/useGameState";
import { useAuth } from "./context/AuthContext";
import { recordGame } from "./api/stats";
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

export default function App() {
  const { state, actions } = useGameState();
  const { user, enabled: authEnabled } = useAuth();
  const videoRef = useRef(null);
  const guessInputRef = useRef(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  // Toast for clip-source failures (year with no clips, network errors).
  // Same trigger-counter pattern as the guess-validation toast.
  const [sourceError, setSourceError] = useState({ trigger: 0, text: "" });
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [statsPopupOpen, setStatsPopupOpen] = useState(false);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const lastVolumeRef = useRef(1);
  // How to Play only auto-opens until the player has started a game once
  // (persisted per browser); afterwards it's reachable via the "?" button.
  const [introOpen, setIntroOpen] = useState(
    () => localStorage.getItem("intro-seen") !== "true"
  );

  // Returning players skip the intro and land directly in a running game.
  useEffect(() => {
    if (localStorage.getItem("intro-seen") === "true") {
      actions.startGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Closes the How to Play popup; on a first visit this also starts the game.
  function handleIntroClose() {
    localStorage.setItem("intro-seen", "true");
    setIntroOpen(false);
    if (state.phase === "intro") actions.startGame();
  }

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
    if (recordedRef.current || !user || state.roundResults.length === 0) return;
    recordedRef.current = true;
    recordGame(state.roundResults).catch(console.error);
  }, [state.phase, user, state.roundResults]);

  // Refocus the guess input whenever an incorrect-but-not-final guess is made
  useEffect(() => {
    if (state.incorrectToastTrigger > 0) {
      guessInputRef.current?.focus();
    }
  }, [state.incorrectToastTrigger]);

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

  // Switches between local and online clips, showing a loading state on the
  // button while the online library is being fetched. Going local also clears
  // an active year filter (the reducer resets it), so the dropdown re-renders
  // to "All years".
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

  // While the round-result popup is open, Enter dismisses it (matches its Continue button)
  useEffect(() => {
    if (!state.roundResult) return;
    function handleKeyDown(e) {
      if (e.code === "Enter") actions.continueAfterReveal();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.roundResult, actions]);

  return (
    <>
      <div id="particles-js"></div>

      {introOpen && (
        <IntroPopup onStart={handleIntroClose} resume={state.phase !== "intro"} />
      )}

      {/* Reopens How to Play; mirrors the user menu in the opposite corner */}
      <button
        className="fixed top-3 left-3 z-[1100] w-[38px] h-[38px] rounded-full bg-[rgba(5,8,18,0.65)]
          text-dim border border-line text-[0.9rem] cursor-pointer backdrop-blur-[8px]
          flex items-center justify-center transition-[color,border-color,box-shadow] duration-200
          hover:text-accent hover:border-accent hover:shadow-[0_0_14px_rgba(41,216,255,0.3)]"
        onClick={() => setIntroOpen(true)}
        aria-label="How to play"
        title="How to play"
      >
        <i className="fas fa-question"></i>
      </button>

      <UserMenu
        onOpenAuth={() => setAuthPopupOpen(true)}
        onOpenStats={() => setStatsPopupOpen(true)}
      />

      <Header />

      <div className="bg-panel border border-line corner-cut p-[var(--card-pad)] w-fit max-w-full max-phone:w-full backdrop-blur-[14px] relative z-10">
        <VideoPlayer ref={videoRef} src={state.currentClipUrl} revealed={state.revealed} />

        <GuessInput
          inputRef={guessInputRef}
          value={state.guessValue}
          onChange={actions.setGuessValue}
          onSubmitEnter={handleSubmit}
        />

        <div className="flex justify-between items-center gap-3 mt-[clamp(10px,1.6vh,16px)] flex-wrap max-tab:justify-center max-phone:flex-col max-phone:gap-2.5">
          <StatsRow score={state.score} remainingGuesses={state.remainingGuesses} maxGuesses={MAX_GUESSES} />
          <ActionButtons
            submitVisible={state.submitVisible}
            onSubmit={handleSubmit}
            usingOnlineClips={state.usingOnlineClips}
            sourceLoading={sourceLoading}
            onToggleSource={handleToggleSource}
            selectedYear={state.selectedYear}
            onSelectYear={handleSelectYear}
          />
        </div>

        <MediaControls
          paused={paused}
          muted={muted}
          volume={volume}
          onPlayPause={togglePlayPause}
          onRestart={handleRestart}
          onToggleMute={handleToggleMute}
          onVolumeChange={handleVolumeChange}
        />
      </div>

      <div className="input-wrapper">
        <PopupMessage trigger={state.validationTrigger} message="Please enter your guess before clicking next" />
        <PopupMessage id="source-error-message" trigger={sourceError.trigger} message={sourceError.text} />
        <p id="result"></p>
      </div>

      <RoundResultPopup
        result={state.roundResult}
        revealedTitle={state.currentAcceptedAnswers[0]}
        onContinue={actions.continueAfterReveal}
      />

      <IncorrectGuessPopup trigger={state.incorrectToastTrigger} hide={Boolean(state.roundResult)} />

      <ScorePopup
        visible={state.phase === "gameOver"}
        score={state.score}
        // A year with fewer than 10 clips ends the game early; show the real
        // number of rounds played (|| guards the 0/0 NaN-accuracy case).
        totalQuestions={state.questionsAnswered || TOTAL_QUESTIONS}
        onPlayAgain={actions.playAgain}
        signedIn={Boolean(user)}
        onOpenAuth={authEnabled ? () => setAuthPopupOpen(true) : null}
      />

      <AuthPopup visible={authPopupOpen} onClose={() => setAuthPopupOpen(false)} />
      <StatsPopup visible={statsPopupOpen} onClose={() => setStatsPopupOpen(false)} />
    </>
  );
}
