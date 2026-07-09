// Color for the guesses-left counter: green at full, shifting to orange and
// then red as the player runs out of attempts.
function guessesColor(remainingGuesses) {
  if (remainingGuesses === 2) return "#FFA500";
  if (remainingGuesses === 1) return "#FF4500";
  return "#4CAF50";
}

// Shared shell for the two HUD chips below.
const chipClasses =
  "font-display text-base font-semibold tracking-[0.04em] inline-flex items-center gap-2 " +
  "px-4 py-2 bg-[rgba(5,8,18,0.6)] border border-line corner-cut " +
  "transition-[border-color] duration-300";

// In-game HUD row showing the current score and how many guesses remain
// for this clip.
export default function StatsRow({ score, remainingGuesses, maxGuesses }) {
  return (
    <div className="flex gap-2.5 max-phone:justify-center">
      <div className={chipClasses}>
        <i className="fas fa-trophy text-gold [text-shadow:0_0_12px_rgba(255,200,67,0.45)]"></i>
        <span id="score" className="text-gold [text-shadow:0_0_12px_rgba(255,200,67,0.45)]">
          {score}
        </span>
      </div>
      {/* The urgency color is set inline and flows to the icon + count via currentColor */}
      <div
        id="guesses-display"
        className={chipClasses}
        style={{ color: guessesColor(remainingGuesses) }}
      >
        <i className="fas fa-lightbulb"></i>
        <span id="guesses-count">{remainingGuesses}</span>/{maxGuesses}
      </div>
    </div>
  );
}
