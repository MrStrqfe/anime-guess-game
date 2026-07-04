import Confetti from "./Confetti";

export default function RoundResultPopup({ result, revealedTitle, onContinue }) {
  const correct = result?.correct ?? true;
  const hidden = result === null;

  return (
    <div
      id="correct-guess-popup"
      className={`popup ${hidden ? "hidden" : ""} correct-popup ${correct ? "" : "wrong-answer"}`}
    >
      <div className="popup-content correct-popup">
        <div className="popup-header">
          <h2 style={{ color: correct ? "var(--success)" : "var(--danger)" }}>
            {correct ? (
              <>
                Correct! <i className="fas fa-check-circle"></i>
              </>
            ) : (
              <>
                Oops! <i className="fas fa-times-circle"></i>
              </>
            )}
          </h2>
        </div>
        <div className="popup-body">
          <Confetti active={!hidden && correct} />
          <p>{correct ? "You guessed it right!" : "The correct answer was:"}</p>
          <p className="anime-title-reveal">
            It was <span id="revealed-anime-title">{revealedTitle}</span>
          </p>
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
