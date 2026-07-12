import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchMyStats } from "../api/stats";
import Icon, { PATHS } from "./icons";

// Average correct answers per game, one decimal place. "—" until the user
// has played at least one game (also avoids dividing by zero).
function formatAverage(stats) {
  if (!stats.games_played) return "—";
  return (stats.total_correct / stats.games_played).toFixed(1);
}

// Lifetime accuracy as a whole percentage, e.g. "73%". Same "—" guard as above.
function formatAccuracy(stats) {
  if (!stats.total_answered) return "—";
  return `${Math.round((stats.total_correct / stats.total_answered) * 100)}%`;
}

// "My Stats" sheet: fetches the signed-in user's profile row from Supabase
// each time it opens and lays the numbers out in a grid of quiet stat tiles.
export default function StatsPopup({ visible, onClose }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  // Refetch on every open so the popup always shows the latest numbers
  // (stats may have changed since the last time it was opened).
  useEffect(() => {
    if (!visible || !user) return;
    setStats(null);
    setError("");
    fetchMyStats(user.id)
      .then(setStats)
      .catch(() => setError("Could not load your stats. Please try again."));
  }, [visible, user]);

  const statTiles = stats
    ? [
        { value: stats.games_played, label: "Games Played" },
        { value: stats.total_correct, label: "Total Correct" },
        { value: `${stats.best_score}/10`, label: "Best Score" },
        { value: formatAverage(stats), label: "Avg Score" },
        { value: formatAccuracy(stats), label: "Accuracy" },
        { value: stats.current_streak, label: "Current Streak" },
        { value: stats.longest_streak, label: "Longest Streak" },
      ]
    : [];

  return (
    <div className={`popup ${visible ? "" : "hidden"} z-[1050]`}>
      <div className="sheet stats-popup w-[min(460px,100%)] px-7 pb-7">
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          <Icon path={PATHS.cross} size={12} />
        </button>
        <h2 className="m-0 mb-[22px] text-[24px] font-semibold tracking-[-0.025em] text-light">
          My Stats
        </h2>

        {error && (
          <p className="auth-error m-0 text-[13px] text-danger tracking-[-0.01em]">{error}</p>
        )}
        {!error && !stats && (
          <p className="text-dim text-[14px] tracking-[-0.01em] my-6">Loading…</p>
        )}

        {stats && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5">
            {statTiles.map(({ value, label }) => (
              <div
                key={label}
                className="bg-tile border border-line-soft rounded-[14px] pt-4 px-2.5 pb-3.5"
              >
                <div className="text-[26px] font-semibold tracking-[-0.02em] text-light [font-variant-numeric:tabular-nums]">
                  {value}
                </div>
                <div className="text-[12px] text-dim mt-1 tracking-[-0.01em]">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
