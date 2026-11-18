import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSupabase, mightHaveSession, supabaseEnabled } from "../lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: false,
  enabled: false,
});

// Wraps the app and keeps the Supabase session in React state, so any
// component can ask "who is signed in?" via useAuth() instead of talking to
// Supabase directly. Also exposes the sign-in/sign-up/sign-out helpers.
//
// supabase-js is loaded lazily (see lib/supabaseClient.js): on startup only
// if this browser might already be signed in, otherwise the first time an
// auth helper is called. Guests never download it.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(() => mightHaveSession());
  const connectRef = useRef(null);

  // Loads supabase-js (once), restores any saved session and subscribes so
  // sign-ins/sign-outs update the UI immediately. Returns the client.
  const connect = useCallback(() => {
    if (!connectRef.current) {
      connectRef.current = getSupabase()
        .then(async (supabase) => {
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
          setLoading(false);

          supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            setLoading(false);
            // After an OAuth round-trip the URL carries ?code=...; clean it up
            // once supabase-js has exchanged it for a session.
            if (nextSession && window.location.search.includes("code=")) {
              window.history.replaceState({}, "", window.location.pathname);
            }
          });
          return supabase;
        })
        .catch((error) => {
          connectRef.current = null;
          setLoading(false);
          throw error;
        });
    }
    return connectRef.current;
  }, []);

  useEffect(() => {
    if (mightHaveSession()) connect().catch(console.error);
  }, [connect]);

  // Creates a new email/password account. Throws on failure so callers can
  // show the error message in the form.
  async function signUp(email, password) {
    const supabase = await connect();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  // Signs in with email/password. The onAuthStateChange listener above picks
  // up the new session, so there's nothing else to do here on success.
  async function signIn(email, password) {
    const supabase = await connect();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  // Starts an OAuth sign-in ("google", "discord", ...). This navigates the
  // browser away to the provider and back, so nothing after the call runs.
  async function signInWithProvider(provider) {
    const supabase = await connect();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Origin + pathname works for both localhost dev and the GitHub Pages
        // subpath (https://<user>.github.io/<repo>/).
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    const supabase = await connect();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = {
    user: session?.user ?? null,
    session,
    loading,
    enabled: supabaseEnabled,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Convenience hook: read the current user/session and auth helpers anywhere
// inside <AuthProvider>.
export function useAuth() {
  return useContext(AuthContext);
}
