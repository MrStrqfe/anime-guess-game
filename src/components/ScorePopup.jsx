// Game-over popup with the final score and accuracy. Signed-in players see a
// "stats saved" note; guests get a sign-in prompt (when auth is configured).
export default function ScorePopup({ visible, score, totalQuestions, onPlayAgain, signedIn, onOpenAuth }) {
  const accuracy = Math.round((score / totalQuestions) * 100);

  return (
    <div id="score-popup" className={`popup ${visible ? "" : "hidden"}`}>
      <div className="popup-content anime-popup">
        <div className="popup-header">
          <h2>
            Game Over! <i className="fas fa-flag-checkered"></i>
          </h2>
        </div>
        <div className="text-center my-[1.2rem]">
          <p>Your Score</p>
          <div className="font-display font-bold text-[clamp(2.4rem,2rem_+_2vw,3.5rem)] my-[0.8rem] bg-linear-135/srgb from-gold to-[#ff9a2e] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,200,67,0.35)]">
            <span id="final-score">{score}</span> /{" "}
            <span id="total-questions" className="text-[0.55em] opacity-80">{totalQuestions}</span>
          </div>
          <div className="text-[1.1rem] my-[0.8rem] text-accent">Accuracy: <span id="accuracy">{accuracy}%</span></div>
          {signedIn && (
            <p className="text-[0.88rem] text-dim mt-2">
              <i className="fas fa-check"></i> Stats saved to your profile
            </p>
          )}
          {!signedIn && onOpenAuth && (
            <p className="text-[0.88rem] text-dim mt-2">
              <button
                type="button"
                className="text-accent text-[0.88rem] font-body underline underline-offset-[3px] cursor-pointer"
                onClick={onOpenAuth}
              >
                Sign in
              </button>{" "}
              to save your stats
            </p>
          )}
        </div>
        <button id="play-again-btn" className="neon-btn" onClick={onPlayAgain}>
          <span>Play Again</span>
          <i className="fas fa-redo"></i>
        </button>
      </div>
    </div>
  );
}
