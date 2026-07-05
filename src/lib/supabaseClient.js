import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When the env vars are missing (e.g. a fork without a Supabase project),
// the app runs in guest-only mode: no sign-in UI, no stats persistence.
export const supabaseEnabled = Boolean(url && anonKey);

export const supabase = supabaseEnabled ? createClient(url, anonKey) : null;
