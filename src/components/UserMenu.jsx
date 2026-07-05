import { useAuth } from "../context/AuthContext";

// Best-effort friendly name for the signed-in user: OAuth profile name if
// available, otherwise the part of their email before the @, otherwise a
// generic fallback.
function displayName(user) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Player"
  );
}

// Top-corner account area. Shows a Sign In button for guests, or the user's
// name plus Stats/Sign Out buttons when signed in. Renders nothing while the
// session is still loading or when Supabase isn't configured.
export default function UserMenu({ onOpenAuth, onOpenStats }) {
  const { user, enabled, loading, signOut } = useAuth();

  if (!enabled || loading) return null;

  if (!user) {
    return (
      <div className="user-menu">
        <button className="user-menu-btn" onClick={onOpenAuth}>
          <i className="fas fa-sign-in-alt"></i> Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="user-menu">
      <span className="user-menu-name">
        <i className="fas fa-user-circle"></i> {displayName(user)}
      </span>
      <button className="user-menu-btn" onClick={onOpenStats}>
        <i className="fas fa-chart-line"></i> My Stats
      </button>
      <button className="user-menu-btn" onClick={() => signOut().catch(console.error)}>
        <i className="fas fa-sign-out-alt"></i> Sign Out
      </button>
    </div>
  );
}
