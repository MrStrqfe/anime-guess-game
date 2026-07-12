// Guesses-remaining dots (Apple Watch style: available dots are bright,
// spent ones dim and shrink) plus a quiet "Round N of 10 · Score N" line.
export default function StatsRow({ score, remainingGuesses, maxGuesses, round, totalRounds }) {
  return (
    <div className="flex items-center gap-3.5 max-phone:justify-center">
      <div className="flex items-center gap-1.5" aria-label="Guesses remaining" title="Guesses remaining">
        {Array.from({ length: maxGuesses }, (_, i) => {
          const available = i < remainingGuesses;
          return (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-[background-color,transform]
                duration-[350ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              style={{
                background: available ? "#f5f5f7" : "rgba(255,255,255,0.18)",
                transform: available ? "scale(1)" : "scale(0.68)",
              }}
            ></div>
          );
        })}
      </div>
      <div className="text-[13px] text-dim tracking-[-0.01em] [font-variant-numeric:tabular-nums]">
        Round {Math.min(round, totalRounds)} of {totalRounds}
        <span className="mx-[7px] opacity-50">·</span>
        Score{" "}
        <span id="score" className="text-light font-medium">
          {score}
        </span>
      </div>
    </div>
  );
}
