function guessesColor(remainingGuesses) {
  if (remainingGuesses === 2) return "#FFA500";
  if (remainingGuesses === 1) return "#FF4500";
  return "#4CAF50";
}

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
