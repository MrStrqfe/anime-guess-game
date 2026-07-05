import { supabase } from "../lib/supabaseClient";

// Records one finished game. roundResults is the ordered per-round
// correctness array (e.g. [true, false, true, ...]); all stat aggregation
// (totals, best score, streaks) happens server-side in the record_game RPC.
export async function recordGame(roundResults) {
  const { error } = await supabase.rpc("record_game", { p_results: roundResults });
  if (error) throw error;
}

export async function fetchMyStats(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}
