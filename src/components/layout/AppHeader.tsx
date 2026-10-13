import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./app-header.css";

interface AppHeaderProps {
  /** Page title shown in the header */
  title: string;
  /** Open the mobile sidebar */
  onMenuClick: () => void;
  /** Current employee (for the avatar + dropdown) */
  employee: { firstName?: string; lastName?: string; email?: string } | null;
  /** Logout handler */
  onLogout: () => void;
}

/**
 * AppHeader — the top bar for the admin shell.
 * Self-contained markup + CSS so the layout is robust and consistent
 * across every screen. Left: hamburger (mobile) + page title.
 * Right: notifications + profile menu.
 */
export function AppHeader({ title, onMenuClick, employee, onLogout }: AppHeaderProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const initials = `${employee?.firstName?.charAt(0) ?? ""}${employee?.lastName?.charAt(0) ?? ""}` || "A";

  // Close the profile dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  return (
    <header className="app-header">
      {/* Left: hamburger + title */}
      <div className="app-header__left">
        <button
          type="button"
          className="app-header__burger"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="app-header__title">{title}</h1>
      </div>

      {/* Right: notifications + profile */}
      <div className="app-header__right">
        <button type="button" className="app-header__icon-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="app-header__dot" />
        </button>

        <div className="app-header__profile" ref={wrapRef}>
          <button
            type="button"
            className="app-header__avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
          >
            {initials.toUpperCase()}
          </button>

          {menuOpen && (
            <div className="app-header__menu">
              <div className="app-header__menu-head">
                <div className="app-header__avatar app-header__avatar--lg">{initials.toUpperCase()}</div>
                <div className="app-header__menu-id">
                  <span className="app-header__menu-name">
                    {employee?.firstName} {employee?.lastName}
                  </span>
                  <span className="app-header__menu-email">{employee?.email}</span>
                </div>
              </div>
              <div className="app-header__menu-divider" />
              <button
                type="button"
                className="app-header__menu-item"
                onClick={() => { navigate("/storage"); setMenuOpen(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
              <button
                type="button"
                className="app-header__menu-item app-header__menu-item--danger"
                onClick={() => { setMenuOpen(false); onLogout(); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
