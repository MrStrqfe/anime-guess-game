import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchMyStats } from "../api/stats";

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

// "My Stats" popup: fetches the signed-in user's profile row from Supabase
// each time it opens and lays the numbers out in a card grid.
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

  const statCards = stats
    ? [
        { value: stats.games_played, label: "Games Played" },
        { value: stats.total_correct, label: "Total Correct" },
        { value: `${stats.best_score}/10`, label: "Best Score" },
        { value: formatAverage(stats), label: "Avg Score" },
        { value: formatAccuracy(stats), label: "Accuracy" },
        {
          value: (
            <>
              {stats.current_streak} <i className="fas fa-fire text-warning text-[1.05rem]"></i>
            </>
          ),
          label: "Current Streak",
        },
        { value: stats.longest_streak, label: "Longest Streak", wide: true },
      ]
    : [];

  return (
    <div className={`popup ${visible ? "" : "hidden"}`}>
      <div className="popup-content anime-popup stats-popup">
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
            My Stats <i className="fas fa-chart-line"></i>
          </h2>
        </div>

        {error && <p className="auth-error text-danger text-[0.88rem]">{error}</p>}
        {!error && !stats && <p className="text-dim my-6">Loading...</p>}

        {stats && (
          <div className="grid grid-cols-3 max-phone:grid-cols-2 gap-2.5 mt-4">
            {statCards.map(({ value, label, wide }) => (
              <div
                key={label}
                className={`bg-[rgba(140,170,255,0.05)] border border-line rounded-lg px-2.5 py-3.5 ${
                  wide ? "col-span-2 max-phone:col-span-1" : ""
                }`}
              >
                <div className="font-display text-[1.45rem] font-bold text-accent">{value}</div>
                <div className="text-[0.75rem] text-dim mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
