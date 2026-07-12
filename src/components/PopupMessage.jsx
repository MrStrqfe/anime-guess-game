import { useEffect, useState } from "react";

// A frosted capsule toast that shows `message` for ~2.2 seconds and hides
// itself. `trigger` is a counter, not a boolean: the parent bumps it each
// time the toast should appear, which also restarts the timer if it's
// already showing. `id` distinguishes multiple instances (validation vs.
// clip-source errors); `tone` colors the little status dot.
export default function PopupMessage({ trigger, message, id = "popup-message", tone = "error" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timeout);
  }, [trigger]);

  return (
    <div id={id} className={`toast-message ${visible ? "" : "hidden"}`}>
      <span
        className="dot"
        style={{ background: tone === "info" ? "#0071e3" : "#ff453a" }}
      ></span>
      {message}
    </div>
  );
}
