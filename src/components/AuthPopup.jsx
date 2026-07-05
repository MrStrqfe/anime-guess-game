import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPopup({ visible, onClose }) {
  const { signIn, signUp, signInWithProvider } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (isSignup) await signUp(email, password);
      else await signIn(email, password);
      setEmail("");
      setPassword("");
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleProvider(provider) {
    setError("");
    try {
      await signInWithProvider(provider);
      // The browser redirects away; nothing else to do here.
    } catch (err) {
      setError(err.message || "Could not start sign-in. Please try again.");
    }
  }

  return (
    <div className={`popup ${visible ? "" : "hidden"}`}>
      <div className="popup-content anime-popup auth-popup">
        <button className="popup-close-btn" onClick={onClose} aria-label="Close">
          <i className="fas fa-times"></i>
        </button>
        <div className="popup-header">
          <h2>
            {isSignup ? "Create Account" : "Sign In"} <i className="fas fa-user"></i>
          </h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="neon-btn auth-submit-btn" disabled={busy}>
            <span>{busy ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}</span>
            <i className="fas fa-arrow-right"></i>
          </button>
        </form>

        <div className="auth-divider">or continue with</div>

        <div className="oauth-buttons">
          <button className="oauth-btn" onClick={() => handleProvider("google")}>
            <i className="fab fa-google"></i> Google
          </button>
          <button className="oauth-btn" onClick={() => handleProvider("discord")}>
            <i className="fab fa-discord"></i> Discord
          </button>
        </div>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "No account yet?"}{" "}
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError("");
            }}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
        <p className="auth-guest-note">You can keep playing as a guest — stats just won't be saved.</p>
      </div>
    </div>
  );
}
