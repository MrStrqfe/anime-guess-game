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
        <div className="score-result">
          <p>Your Score</p>
          <div className="final-score-display">
            <span id="final-score">{score}</span> / <span id="total-questions">{totalQuestions}</span>
          </div>
          <div className="accuracy-display">Accuracy: <span id="accuracy">{accuracy}%</span></div>
          {signedIn && (
            <p className="save-stats-note">
              <i className="fas fa-check"></i> Stats saved to your profile
            </p>
          )}
          {!signedIn && onOpenAuth && (
            <p className="save-stats-note">
              <button type="button" className="auth-link-btn" onClick={onOpenAuth}>
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
