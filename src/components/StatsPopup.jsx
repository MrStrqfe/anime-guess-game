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

  return (
    <div className={`popup ${visible ? "" : "hidden"}`}>
      <div className="popup-content anime-popup stats-popup">
        <button className="popup-close-btn" onClick={onClose} aria-label="Close">
          <i className="fas fa-times"></i>
        </button>
        <div className="popup-header">
          <h2>
            My Stats <i className="fas fa-chart-line"></i>
          </h2>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {!error && !stats && <p className="stats-loading">Loading...</p>}

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.games_played}</div>
              <div className="stat-label">Games Played</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_correct}</div>
              <div className="stat-label">Total Correct</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.best_score}/10</div>
              <div className="stat-label">Best Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatAverage(stats)}</div>
              <div className="stat-label">Avg Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatAccuracy(stats)}</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {stats.current_streak} <i className="fas fa-fire stat-fire"></i>
              </div>
              <div className="stat-label">Current Streak</div>
            </div>
            <div className="stat-card stat-card-wide">
              <div className="stat-value">{stats.longest_streak}</div>
              <div className="stat-label">Longest Streak</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
