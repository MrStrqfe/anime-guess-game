import { useEffect, useState } from "react";

// Wrong-guess toast ("Not quite — N guesses left", or "Skipped — hint
// unlocked" after a daily Skip), shown for ~2.2 seconds
// after each wrong (non-final) guess. `trigger` is a counter bumped per
// wrong guess; `hide` force-closes the toast early when the round-result
// sheet takes over the screen.
export default function IncorrectGuessPopup({ trigger, hide, remainingGuesses, skipped }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timeout);
  }, [trigger]);

  useEffect(() => {
    if (hide) setVisible(false);
  }, [hide]);

  return (
    <div
      id="incorrect-guess-popup"
      className={`toast-message ${visible ? "" : "hidden"}`}
      key={trigger}
    >
      <span className="dot" style={{ background: skipped ? "#ffd60a" : "#ff453a" }}></span>
      {skipped
        ? "Skipped — hint unlocked"
        : `Not quite — ${remainingGuesses} ${remainingGuesses === 1 ? "guess" : "guesses"} left`}
    </div>
  );
}
