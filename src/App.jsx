import { useEffect, useRef, useState } from "react";
import { useGameState, MAX_GUESSES, TOTAL_QUESTIONS } from "./hooks/useGameState";
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

export default function App() {
  const { state, actions } = useGameState();
  const videoRef = useRef(null);
  const guessInputRef = useRef(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const lastVolumeRef = useRef(1);

  // Keep local playback UI state in sync with the underlying <video> element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setPaused(false);
    const handlePause = () => setPaused(true);
    const handleVolumeChange = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };

    video.volume = 1;
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  // Refocus the guess input whenever an incorrect-but-not-final guess is made
  useEffect(() => {
    if (state.incorrectToastTrigger > 0) {
      guessInputRef.current?.focus();
    }
  }, [state.incorrectToastTrigger]);

  function togglePlayPause() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function handleRestart() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (video.paused) video.play().catch(() => {});
  }

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

  function handleVolumeChange(nextVolume) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = nextVolume;
    video.muted = false;
  }

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

  async function handleToggleSource() {
    setSourceLoading(true);
    await actions.toggleClipSource();
    setSourceLoading(false);
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

      {state.phase === "intro" && <IntroPopup onStart={actions.startGame} />}

      <Header />

      <div className="game-container">
        <VideoPlayer ref={videoRef} src={state.currentClipUrl} revealed={state.revealed} />

        <GuessInput
          inputRef={guessInputRef}
          value={state.guessValue}
          onChange={actions.setGuessValue}
          onSubmitEnter={handleSubmit}
        />

        <div className="actions">
          <StatsRow score={state.score} remainingGuesses={state.remainingGuesses} maxGuesses={MAX_GUESSES} />
          <ActionButtons
            submitVisible={state.submitVisible}
            onSubmit={handleSubmit}
            usingOnlineClips={state.usingOnlineClips}
            sourceLoading={sourceLoading}
            onToggleSource={handleToggleSource}
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
        totalQuestions={TOTAL_QUESTIONS}
        onPlayAgain={actions.playAgain}
      />
    </>
  );
}
