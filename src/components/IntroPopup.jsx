const STEPS = [
  "Every day brings three new anime, picked from the 500 most popular.",
  "You hear the first 8 seconds of each blurred opening. Type its title — suggestions appear as you type.",
  "A wrong guess or Skip unlocks more of the clip (30s, then 1 minute) and a hint.",
  "Guess early for more points: 100, 60 or 30 per anime, up to 300 a day.",
  "Share your result, keep your streak, and come back tomorrow.",
];

// "How to Play" sheet shown before the first game, and reopenable later via
// the help button. `resume` swaps the button label when a game is already
// running (closing just returns to it instead of starting a new one).
export default function IntroPopup({ onStart, resume = false }) {
  return (
    <div id="intro-popup" className="popup">
      <div className="sheet w-[min(440px,100%)]">
        <h2 className="m-0 text-[26px] font-semibold tracking-[-0.025em] text-light">
          How to play
        </h2>
        <p className="mt-2 mb-6 text-[14px] text-dim tracking-[-0.01em]">
          Three openings a day. Want more? Switch to Practice for ten-round games.
        </p>
        <div className="flex flex-col gap-1 text-left">
          {STEPS.map((text, i) => (
            <div
              key={i}
              className="flex items-baseline gap-4 px-1.5 py-[11px] border-b border-[rgba(255,255,255,0.06)]"
            >
              <div className="text-[17px] font-light text-faint w-4 shrink-0 [font-variant-numeric:tabular-nums]">
                {i + 1}
              </div>
              <div className="text-[15px] tracking-[-0.01em] text-body-soft leading-[1.45]">
                {text}
              </div>
            </div>
          ))}
        </div>
        <button id="start-game-btn" className="cta-btn mt-[26px]" onClick={onStart}>
          {resume ? "Back to Game" : "Start Game"}
        </button>
      </div>
    </div>
  );
}
