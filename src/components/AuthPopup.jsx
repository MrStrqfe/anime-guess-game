import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Icon, { PATHS } from "./icons";

// Sign In / Sign Up sheet. One form handles both modes (toggled by the link
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
    <div className={`popup ${visible ? "" : "hidden"} z-[1050]`}>
      <div className="sheet auth-popup w-[min(400px,100%)] pb-[26px]">
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          <Icon path={PATHS.cross} size={12} />
        </button>
        <h2 className="m-0 mb-1 text-[24px] font-semibold tracking-[-0.025em] text-light">
          {isSignup ? "Create Account" : "Sign In"}
        </h2>
        <p className="m-0 mb-[22px] text-[13px] text-dim tracking-[-0.01em]">
          Track your stats across games.
        </p>

        {/* `auth-input` / `auth-error` stay as bare class hooks for the E2E scripts */}
        <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
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
          {error && (
            <p className="auth-error m-0 text-[13px] text-danger tracking-[-0.01em]">{error}</p>
          )}
          <button type="submit" className="cta-btn mt-1.5 w-full" disabled={busy}>
            {busy ? "Please wait…" : isSignup ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-5 mb-3.5 flex items-center gap-3">
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]"></div>
          <span className="text-[11px] tracking-[0.08em] uppercase text-tert">
            or continue with
          </span>
          <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]"></div>
        </div>

        <div className="flex gap-2.5 justify-center">
          <button className={oauthBtnClasses} onClick={() => handleProvider("google")}>
            Google
          </button>
          <button className={oauthBtnClasses} onClick={() => handleProvider("discord")}>
            Discord
          </button>
        </div>

        <p className="mt-5 mb-0 text-[13px] text-dim tracking-[-0.01em]">
          {isSignup ? "Already have an account?" : "No account yet?"}{" "}
          <button
            type="button"
            className="bg-transparent border-none p-0 text-link text-[13px] font-body cursor-pointer"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError("");
            }}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
        <p className="mt-2 mb-0 text-[12px] text-faint tracking-[-0.01em]">
          You can keep playing as a guest — stats just won't be saved.
        </p>
      </div>
    </div>
  );
}

const authInputClasses =
  "auth-input w-full box-border h-11 px-[18px] rounded-xl font-body text-[14px] tracking-[-0.01em] " +
  "text-light bg-fill border border-line transition-[border-color,box-shadow] duration-200 " +
  "focus:outline-none focus:border-accent focus:shadow-[0_0_0_4px_rgba(0,113,227,0.32)] " +
  "placeholder:text-[rgba(245,245,247,0.36)]";

const oauthBtnClasses =
  "flex-1 h-[42px] rounded-[980px] bg-fill border border-line text-light font-body " +
  "text-[14px] tracking-[-0.01em] cursor-pointer transition-colors duration-200 " +
  "hover:bg-fill-hover";
