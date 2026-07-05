// Color for the guesses-left counter: green at full, shifting to orange and
// then red as the player runs out of attempts.
function guessesColor(remainingGuesses) {
  if (remainingGuesses === 2) return "#FFA500";
  if (remainingGuesses === 1) return "#FF4500";
  return "#4CAF50";
}

// In-game HUD row showing the current score and how many guesses remain
// for this clip.
export default function StatsRow({ score, remainingGuesses, maxGuesses }) {
  return (
    <div className="stats-row">
      <div className="score-display">
        <i className="fas fa-trophy"></i>
        <span id="score">{score}</span>
      </div>
      <div
        id="guesses-display"
        className="guesses-display"
        style={{ color: guessesColor(remainingGuesses) }}
      >
        <i className="fas fa-lightbulb"></i>
        <span id="guesses-count">{remainingGuesses}</span>/{maxGuesses}
      </div>
    </div>
  );
}
