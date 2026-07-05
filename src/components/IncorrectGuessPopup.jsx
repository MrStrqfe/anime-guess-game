import { useEffect, useState } from "react";

// "Incorrect Guess" toast, shown for 2 seconds after each wrong (non-final)
// guess. `trigger` is a counter bumped per wrong guess; `hide` force-closes
// the toast early when the round-result popup takes over the screen.
export default function IncorrectGuessPopup({ trigger, hide }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timeout);
  }, [trigger]);

  useEffect(() => {
    if (hide) setVisible(false);
  }, [hide]);

  return (
    <div
      id="incorrect-guess-popup"
      className={`incorrect-popup ${visible ? "" : "hidden"}`}
      key={trigger}
    >
      Incorrect Guess
    </div>
  );
}
