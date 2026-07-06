import Confetti from "./Confetti";

// End-of-round popup: green "Correct!" with confetti, or red "Oops!" with
// the right answer. Hidden while `result` is null (i.e. mid-round).
export default function RoundResultPopup({ result, revealedTitle, onContinue }) {
  const correct = result?.correct ?? true;
  const hidden = result === null;

  return (
    <div
      id="correct-guess-popup"
      className={`popup ${hidden ? "hidden" : ""} correct-popup ${correct ? "" : "wrong-answer"}`}
    >
      <div className="popup-content result-card">
        {/* Confetti rains over the whole card, behind the content */}
        <Confetti active={!hidden && correct} />

        <div className="result-badge">
          <i className={`fas ${correct ? "fa-check" : "fa-times"}`}></i>
        </div>

        <div className="popup-header">
          <h2>{correct ? "Correct!" : "Oops!"}</h2>
        </div>

        <div className="popup-body">
          <p className="result-subtitle">
            {correct ? "You guessed it right!" : "The correct answer was:"}
          </p>
          <div className="anime-title-reveal">
            <span id="revealed-anime-title">{revealedTitle}</span>
          </div>
          {correct && (
            <div className="score-added">
              +1 <i className="fas fa-star"></i>
            </div>
          )}
        </div>

        <div className="popup-footer">
          <button id="continue-btn" className="neon-btn continue-btn" onClick={onContinue}>
            <span>Continue</span>
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
