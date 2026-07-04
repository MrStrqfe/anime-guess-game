import { useEffect, useState } from "react";

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
