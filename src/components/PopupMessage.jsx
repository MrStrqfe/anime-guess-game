import { useEffect, useState } from "react";

// A small toast that shows `message` for 2 seconds and hides itself.
// `trigger` is a counter, not a boolean: the parent bumps it each time the
// toast should appear, which also restarts the timer if it's already showing.
export default function PopupMessage({ trigger, message }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timeout);
  }, [trigger]);

  return (
    <div id="popup-message" className={visible ? "" : "hidden"}>
      <i className="fas fa-exclamation-circle"></i> {message}
    </div>
  );
}
