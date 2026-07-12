// Game-over sheet with the final score and accuracy. Signed-in players see a
// "saved" note; guests get a sign-in prompt (when auth is configured).
export default function ScorePopup({ visible, score, totalQuestions, onPlayAgain, signedIn, onOpenAuth }) {
  const accuracy = Math.round((score / totalQuestions) * 100);

  return (
    <div id="score-popup" className={`popup ${visible ? "" : "hidden"}`}>
      <div className="sheet w-[min(420px,100%)] pt-10 pb-8">
        <p className="m-0 text-[13px] font-medium tracking-[0.06em] uppercase text-dim">
          Game over
        </p>
        <div className="mt-3.5 mb-0.5 text-[72px] font-semibold tracking-[-0.04em] leading-none text-light [font-variant-numeric:tabular-nums]">
          <span id="final-score">{score}</span>
        </div>
        <p className="m-0 text-[15px] text-dim tracking-[-0.01em]">
          out of <span id="total-questions">{totalQuestions}</span>
          <span className="mx-[7px] opacity-50">·</span>
          <span id="accuracy">{accuracy}%</span> accuracy
        </p>
        {signedIn && (
          <p className="mt-4 mb-0 text-[13px] text-tert tracking-[-0.01em]">
            Saved to your profile
          </p>
        )}
        {!signedIn && onOpenAuth && (
          <p className="mt-4 mb-0 text-[13px] text-tert tracking-[-0.01em]">
            <button
              type="button"
              className="bg-transparent border-none p-0 text-link text-[13px] font-body cursor-pointer"
              onClick={onOpenAuth}
            >
              Sign in
            </button>{" "}
            to save your stats
          </p>
        )}
        <button id="play-again-btn" className="cta-btn mt-[26px]" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
