import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// Sign In / Sign Up popup. One form handles both modes (toggled by the link
// at the bottom), plus Google/Discord OAuth buttons.
export default function AuthPopup({ visible, onClose }) {
  const { signIn, signUp, signInWithProvider } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  // Submits the email/password form for whichever mode is active. On success
  // the form is cleared and the popup closes; on failure the Supabase error
  // is shown inline. `busy` disables the button to prevent double submits.
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

  // Kicks off an OAuth sign-in; if it works the browser navigates away to
  // the provider, so we only need to handle the error case here.
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
        <button
          className="absolute top-3 right-3.5 z-[2] text-dim text-[1.2rem] cursor-pointer
            transition-colors duration-200 hover:text-primary"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="fas fa-times"></i>
        </button>
        <div className="popup-header">
          <h2>
            {isSignup ? "Create Account" : "Sign In"} <i className="fas fa-user"></i>
          </h2>
        </div>

        {/* `auth-input` / `auth-error` stay as bare class hooks for the E2E scripts */}
        <form className="flex flex-col gap-3 mx-auto max-w-[360px]" onSubmit={handleSubmit}>
          <input
            type="email"
            className={authInputClasses}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            className={authInputClasses}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
          {error && <p className="auth-error text-danger text-[0.88rem]">{error}</p>}
          <button
            type="submit"
            className="neon-btn mt-2 disabled:opacity-60 disabled:cursor-wait"
            disabled={busy}
          >
            <span>{busy ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}</span>
            <i className="fas fa-arrow-right"></i>
          </button>
        </form>

        <div className="mt-[1.2rem] mb-[0.8rem] text-dim text-[0.78rem] uppercase tracking-[2px]">
          or continue with
        </div>

        <div className="flex justify-center gap-3">
          <button className={oauthBtnClasses} onClick={() => handleProvider("google")}>
            <i className="fab fa-google"></i> Google
          </button>
          <button className={oauthBtnClasses} onClick={() => handleProvider("discord")}>
            <i className="fab fa-discord"></i> Discord
          </button>
        </div>

        <p className="mt-[1.2rem] text-dim text-[0.88rem]">
          {isSignup ? "Already have an account?" : "No account yet?"}{" "}
          <button
            type="button"
            className="text-accent text-[0.88rem] font-body underline underline-offset-[3px] cursor-pointer"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError("");
            }}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
        <p className="mt-[0.6rem] text-[rgba(214,226,255,0.4)] text-[0.78rem]">
          You can keep playing as a guest — stats just won't be saved.
        </p>
      </div>
    </div>
  );
}

const authInputClasses =
  "auth-input w-full px-[18px] py-3 text-[0.95rem] font-body text-light bg-[rgba(5,8,18,0.75)] " +
  "border border-line rounded-lg transition-[border-color,box-shadow] duration-200 " +
  "focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(41,216,255,0.18)] " +
  "placeholder:text-[rgba(214,226,255,0.4)]";

const oauthBtnClasses =
  "bg-[rgba(140,170,255,0.06)] text-light border border-line rounded-lg px-[22px] py-2.5 " +
  "text-[0.9rem] font-body cursor-pointer inline-flex items-center gap-2 " +
  "transition-[border-color,background-color] duration-200 " +
  "hover:border-accent hover:bg-[rgba(41,216,255,0.08)]";
