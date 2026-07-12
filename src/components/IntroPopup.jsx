const STEPS = [
  "An anime opening plays, blurred beyond recognition.",
  "Type the anime's title — suggestions appear as you type.",
  "You have three guesses per opening.",
  "Guess it right to reveal the clip and score a point.",
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
          Ten openings. Three guesses each.
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
