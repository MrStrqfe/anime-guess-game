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

// `user-menu` / `user-menu-btn` class names are kept as bare hooks for the
// E2E verification scripts; styling lives in the utility classes.
// z-1100 keeps Sign In above the .popup overlays (z-index 1000) so it stays
// clickable on the intro screen.
const menuClasses = "user-menu fixed top-3 right-3 z-[1100] flex items-center gap-2.5";

const menuBtnClasses =
  "user-menu-btn bg-[rgba(5,8,18,0.65)] text-light border border-line rounded-lg " +
  "px-4 py-2 text-[0.85rem] font-body cursor-pointer backdrop-blur-[8px] " +
  "inline-flex items-center gap-1.5 transition-[border-color,box-shadow] duration-200 " +
  "hover:border-accent hover:shadow-[0_0_14px_rgba(41,216,255,0.3)]";

// Top-corner account area. Shows a Sign In button for guests, or the user's
// name plus Stats/Sign Out buttons when signed in. Renders nothing while the
// session is still loading or when Supabase isn't configured.
export default function UserMenu({ onOpenAuth, onOpenStats }) {
  const { user, enabled, loading, signOut } = useAuth();

  if (!enabled || loading) return null;

  if (!user) {
    return (
      <div className={menuClasses}>
        <button className={menuBtnClasses} onClick={onOpenAuth}>
          <i className="fas fa-sign-in-alt"></i> Sign In
        </button>
      </div>
    );
  }

  return (
    <div className={menuClasses}>
      <span className="text-light text-[0.9rem] inline-flex items-center gap-1.5 max-phone:hidden">
        <i className="fas fa-user-circle text-accent"></i> {displayName(user)}
      </span>
      <button className={menuBtnClasses} onClick={onOpenStats}>
        <i className="fas fa-chart-line"></i> My Stats
      </button>
      <button className={menuBtnClasses} onClick={() => signOut().catch(console.error)}>
        <i className="fas fa-sign-out-alt"></i> Sign Out
      </button>
    </div>
  );
}
