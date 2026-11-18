const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When the env vars are missing (e.g. a fork without a Supabase project),
// the app runs in guest-only mode: no sign-in UI, no stats persistence.
export const supabaseEnabled = Boolean(url && anonKey);

// supabase-js is the largest dependency in the app, and most players are
// guests who never need it. It's code-split into its own chunk and only
// downloaded the first time getSupabase() is called: when there's a saved
// session, an OAuth redirect to finish, or the player opens sign-in.
let clientPromise = null;

export function getSupabase() {
  if (!supabaseEnabled) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then(({ createClient }) => createClient(url, anonKey))
      .catch((error) => {
        clientPromise = null; // a failed chunk download can be retried later
        throw error;
      });
  }
  return clientPromise;
}

// Whether this browser might already be signed in, checked without loading
// supabase-js: either a session it saved earlier (stored under
// "sb-<project-ref>-auth-token") or an OAuth redirect waiting to be
// exchanged (?code=...).
export function mightHaveSession() {
  if (!supabaseEnabled) return false;
  if (new URLSearchParams(window.location.search).has("code")) return true;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") && key.endsWith("-auth-token")) return true;
    }
  } catch {
    // Storage blocked: there can't be a saved session either.
  }
  return false;
}
