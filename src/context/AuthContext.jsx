import { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "../lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: false,
  enabled: false,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      // After an OAuth round-trip the URL carries ?code=...; clean it up once
      // supabase-js has exchanged it for a session.
      if (nextSession && window.location.search.includes("code=")) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithProvider(provider) {
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

export function useAuth() {
  return useContext(AuthContext);
}
