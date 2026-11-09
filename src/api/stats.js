import { supabase } from "../lib/supabaseClient";

// Records one finished game. roundResults is the ordered per-round
// correctness array (e.g. [true, false, true, ...]); all stat aggregation
// (totals, best score, streaks) happens server-side in the record_game RPC.
export async function recordGame(roundResults) {
  // rpc = execute a custom PostgreSQL function directly from the server
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

// Records one finished daily for the signed-in player. attempts holds the
// stage that got each anime (1-3) or 0 for a miss; the server works out the
// points from that (100 / 60 / 30). It ignores repeats for the same puzzle
// and returns the updated daily streak:
// { current, longest }.
export async function recordDaily(puzzleNumber, attempts) {
  const { data, error } = await supabase.rpc("record_daily", {
    p_puzzle: puzzleNumber,
    p_attempts: attempts,
  });
  if (error) throw error;
  return data;
}
