// "How to Play" popup shown before the first game. Start Game kicks off the
// first round via onStart.
export default function IntroPopup({ onStart }) {
  return (
    <div id="intro-popup" className="popup">
      <div className="popup-content anime-popup">
        <div className="popup-header">
          <h2>
            How to Play <i className="fas fa-gamepad"></i>
          </h2>
        </div>
        <ol className="instructions">
          <li>
            <i className="fas fa-eye"></i> Watch the blurred anime opening
          </li>
          <li>
            <i className="fas fa-question"></i> Guess which anime it's from
          </li>
          <li>
            <i className="fas fa-paper-plane"></i> Submit your answer
          </li>
          <li>
            <i className="fas fa-star"></i> Correct guesses reveal the video and
            earn points!
          </li>
          <li>
            <i className="fas fa-exclamation"></i> You get 3 guesses per video!
          </li>
        </ol>
        <button id="start-game-btn" className="start-btn neon-btn" onClick={onStart}>
          <span>Start Game</span>
          <i className="fas fa-play"></i>
        </button>
      </div>
    </div>
  );
}
