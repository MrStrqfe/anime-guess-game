import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Icon, { PATHS } from "./icons";

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

// Top-right account corner. Guests get a person-icon circle that opens the
// sign-in sheet; signed-in players get their initial, which toggles a
// frosted dropdown (name, My Stats, Sign Out). Renders nothing while the
// session is still loading or when Supabase isn't configured.
// `user-menu` / `user-menu-btn` class names are kept as bare hooks for the
// E2E verification scripts; z-1100 keeps the button above the .popup
// overlays (z-index 1000) so it stays clickable on the intro screen.
export default function UserMenu({ onOpenAuth, onOpenStats }) {
  const { user, enabled, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close the dropdown when the user clicks anywhere outside it.
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  if (!enabled || loading) return null;

  return (
    <div
      ref={wrapperRef}
      className="user-menu fixed top-4 right-4 z-[1100] flex flex-col items-end gap-2"
    >
      <button
        className="user-menu-btn corner-btn text-[13px] font-semibold"
        aria-label="Account"
        title="Account"
        onClick={() => (user ? setMenuOpen((open) => !open) : onOpenAuth())}
      >
        {user ? (
          displayName(user)[0].toUpperCase()
        ) : (
          <Icon path={PATHS.person} size={16} fill="rgba(245,245,247,0.85)" />
        )}
      </button>

      {user && menuOpen && (
        <div className="user-dropdown">
          <div className="px-3 pt-2.5 pb-2 mb-1 text-[13px] font-semibold text-light border-b border-line-soft">
            {displayName(user)}
          </div>
          <button
            onClick={() => {
              setMenuOpen(false);
              onOpenStats();
            }}
          >
            My Stats
          </button>
          <button
            className="!text-danger"
            onClick={() => {
              setMenuOpen(false);
              signOut().catch(console.error);
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
