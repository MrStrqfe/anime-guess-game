import Icon, { PATHS } from "./icons";

// End-of-round sheet: blue check badge for a correct guess, red × for a
// miss, with the revealed title as the hero. Hidden while `result` is null
// (i.e. mid-round). `round`/`score` feed the quiet meta line.
export default function RoundResultPopup({
  result,
  revealedTitle,
  round,
  totalRounds,
  score,
  onContinue,
}) {
  const correct = result?.correct ?? true;
  const hidden = result === null;

  return (
    <div
      id="correct-guess-popup"
      className={`popup ${hidden ? "hidden" : ""} correct-popup ${correct ? "" : "wrong-answer"}`}
    >
      <div className="sheet w-[min(420px,100%)] pt-9 pb-[30px]">
        <div
          className="w-[60px] h-[60px] rounded-full mx-auto mb-[18px] flex items-center justify-center"
          style={{ background: correct ? "#0071e3" : "#ff453a" }}
        >
          <Icon path={correct ? PATHS.check : PATHS.cross} size={26} fill="#ffffff" />
        </div>

        <h2 className="m-0 text-[24px] font-semibold tracking-[-0.025em] text-light">
          {correct ? "Correct" : "Not this time"}
        </h2>
        <p className="mt-1.5 mb-0 text-[14px] text-dim tracking-[-0.01em]">
          {correct ? "You named it." : "The answer was"}
        </p>

        <div className="mt-[18px] mb-1.5 text-[clamp(20px,3vw,26px)] font-semibold tracking-[-0.02em] leading-[1.25] text-light">
          <span id="revealed-anime-title">{revealedTitle}</span>
        </div>

        <p className="mt-3.5 mb-0 text-[13px] text-tert tracking-[-0.01em] [font-variant-numeric:tabular-nums]">
          Round {round} of {totalRounds}
          <span className="mx-[7px] opacity-50">·</span>Score {score}
        </p>

        <button id="continue-btn" className="cta-btn mt-6" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
