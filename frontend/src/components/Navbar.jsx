import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";

// -----------------------------------------------------------------
// THEME — add these to your global CSS (e.g. index.css / theme file)
// alongside your existing --bg-primary / --border-light / etc.
// -----------------------------------------------------------------
//
// :root {
//   --accent: #F2624C;            /* coral — primary brand accent */
//   --accent-hover: #FF7A61;      /* coral, lighter — hover state */
//   --accent-soft: rgba(242, 98, 76, 0.12);   /* tinted backgrounds */
//   --accent-soft-strong: rgba(242, 98, 76, 0.22);
//   --accent-contrast: #0A0A0B;   /* text/icon color ON TOP of solid accent */
// }
//
// No gradients anywhere — every accent surface below is a flat color.

// -----------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------

function getInitials(token) {
  if (!token) return "U";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const name = payload.name ?? payload.email ?? "";
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  } catch {
    return "U";
  }
}

function getUserInfo(token) {
  if (!token) return { name: "", email: "" };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { name: payload.name ?? "", email: payload.email ?? "" };
  } catch {
    return { name: "", email: "" };
  }
}

// -----------------------------------------------------------------
// Icons
// -----------------------------------------------------------------

function Icon({ name, size = 16, className = "" }) {
  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.49a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.41-1.41.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 11a1.7 1.7 0 0 0-.34-1.88L9 9.06l1.41-1.41.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 13.38 6.5V6h2v.5a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.41 1.41-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v2h-.5A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 3v18" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {icons[name]}
    </svg>
  );
}

// -----------------------------------------------------------------
// DropdownItem
// -----------------------------------------------------------------

function DropdownItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors duration-150 ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 ${
          danger
            ? "bg-red-500/5 text-red-400"
            : "bg-[var(--bg-hover)] text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent-soft)]"
        }`}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

// -----------------------------------------------------------------
// Main Navbar
// -----------------------------------------------------------------

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuth, token, logout } = useAuth();
  const { compact } = usePreferences();

  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropRef = useRef(null);

  const initials = useMemo(() => getInitials(token), [token]);
  const userInfo = useMemo(() => getUserInfo(token), [token]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropRef.current && !dropRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setDropOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setDropOpen(false);
    logout();
    navigate("/login");
  };

  // Compact overrides
  const navbarHeight = compact ? "h-14" : "h-16";
  const logoSize = compact ? "h-8 w-8" : "h-9 w-9";
  const iconSize = compact ? 15 : 17;
  const brandTextSize = compact ? "text-[13px]" : "text-[15px]";
  const brandSubSize = compact ? "text-[7px]" : "text-[8px]";
  const navItemHeight = compact ? "h-8" : "h-9";
  const navItemFont = compact ? "text-[11px]" : "text-[12px]";
  const avatarSize = compact ? "h-7 w-7" : "h-8 w-8";
  const avatarFont = compact ? "text-[9px]" : "text-[10px]";
  const userInfoNameSize = compact ? "text-[10px]" : "text-[11px]";
  const userInfoRoleSize = compact ? "text-[7px]" : "text-[8px]";
  const buttonPadding = compact ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-[12px]";
  const mobileMenuPadding = compact ? "py-2 px-3" : "py-3 px-4";
  const mobileMenuItemPadding = compact ? "px-3 py-2.5 text-sm" : "px-4 py-3 text-sm";

  const NavigationItem = ({ to, label, icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-2 rounded-lg px-3 transition-colors duration-200 ${navItemHeight} ${navItemFont} font-medium ${
          isActive
            ? "text-[var(--accent)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={
              isActive
                ? "text-[var(--accent)]"
                : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-200"
            }
          >
            <Icon name={icon} size={compact ? 12 : 14} />
          </span>
          <span>{label}</span>
          <span
            className={`pointer-events-none absolute bottom-0 left-3 right-3 h-[2px] origin-center rounded-full bg-[var(--accent)] transition-transform duration-200 ${
              isActive ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </>
      )}
    </NavLink>
  );

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-[var(--border-light)] bg-[var(--bg-primary)]/95 backdrop-blur-sm ${navbarHeight}`}
    >
      <div
        className={`mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 ${
          compact ? "px-3 sm:px-4" : ""
        }`}
      >
        {/* LEFT – Logo */}
        <div className="flex min-w-0 items-center">
          <NavLink to="/" className="group flex items-center gap-2.5">
            <div
              className={`relative flex shrink-0 items-center justify-center rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] transition-all duration-300 group-hover:border-[var(--accent)]/50 group-hover:shadow-[0_0_0_3px_var(--accent-soft)] ${logoSize}`}
            >
              <Icon name="shield" size={iconSize} className="text-[var(--accent)]" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)]">
                <span className="text-[5px] font-bold text-[var(--accent)]">{"</>"}</span>
              </span>
              <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)]">
                <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)] opacity-75" />
              </span>
            </div>

            <div className="hidden sm:block">
              <div className={`flex items-center font-bold leading-none tracking-tight ${brandTextSize}`}>
                <span className="text-[var(--text-primary)]">Code</span>
                <span className="text-[var(--accent)]">Verity</span>
              </div>
              <p
                className={`mt-1 font-medium uppercase leading-none tracking-[0.2em] text-[var(--text-muted)] ${brandSubSize}`}
              >
                AI Code Intelligence
              </p>
            </div>
          </NavLink>
        </div>

        {/* CENTER – Navigation */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {isAuth && (
            <>
              <NavigationItem to="/dashboard" label="Dashboard" icon="dashboard" />
              <NavigationItem to="/history" label="History" icon="history" />
            </>
          )}
        </div>

        {/* RIGHT – User */}
        <div className="flex items-center">
          {isAuth ? (
            <div ref={dropRef} className="relative">
              <button
                type="button"
                onClick={() => setDropOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-lg px-1.5 transition-colors duration-150 ${
                  compact ? "h-9" : "h-10"
                } ${dropOpen ? "bg-[var(--bg-hover)]" : "hover:bg-[var(--bg-hover)]"}`}
              >
                <div
                  className={`relative flex shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] font-bold text-[var(--accent-contrast)] ${avatarSize} ${avatarFont}`}
                >
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-primary)] bg-emerald-400" />
                </div>

                <div className="hidden text-left lg:block">
                  <p
                    className={`max-w-[100px] truncate font-semibold leading-3 text-[var(--text-primary)] ${userInfoNameSize}`}
                  >
                    {userInfo.name || initials}
                  </p>
                  <p className={`mt-1 leading-3 text-[var(--text-muted)] ${userInfoRoleSize}`}>Developer</p>
                </div>

                <span
                  className={`ml-1 hidden text-[var(--text-muted)] transition-transform duration-200 sm:block ${
                    dropOpen ? "rotate-180" : ""
                  }`}
                >
                  <Icon name="chevron" size={compact ? 10 : 12} />
                </span>
              </button>

              {/* Dropdown — kept mounted so open/close both animate */}
              <div
                className={`absolute right-0 top-[50px] z-50 w-64 origin-top-right overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-2xl shadow-black/50 transition-all duration-150 ease-out ${
                  dropOpen
                    ? "translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                }`}
              >
                <div className="border-b border-[var(--border-light)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-xs font-bold text-[var(--accent-contrast)]">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {userInfo.name || initials}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-secondary)]">
                        {userInfo.email || "Signed in"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <DropdownItem
                    icon={<Icon name="profile" size={15} />}
                    label="Profile"
                    onClick={() => navigate("/profile")}
                  />
                  <DropdownItem
                    icon={<Icon name="settings" size={15} />}
                    label="Settings"
                    onClick={() => navigate("/settings")}
                  />
                  <DropdownItem
                    icon={<Icon name="history" size={15} />}
                    label="Review History"
                    onClick={() => navigate("/history")}
                  />
                  <DropdownItem
                    icon={<Icon name="dashboard" size={15} />}
                    label="Dashboard"
                    onClick={() => navigate("/dashboard")}
                  />
                </div>

                <div className="border-t border-[var(--border-light)] py-2">
                  <DropdownItem
                    danger
                    icon={<Icon name="logout" size={15} />}
                    label="Sign out"
                    onClick={handleLogout}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <NavLink
                to="/login"
                className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${buttonPadding}`}
              >
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className={`rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-contrast)] transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-95 ${buttonPadding}`}
              >
                Get started
              </NavLink>
            </div>
          )}

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`relative ml-2 flex items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] md:hidden ${
              compact ? "h-8 w-8" : "h-9 w-9"
            }`}
          >
            <span className="relative flex h-3.5 w-4 flex-col justify-between">
              <span
                className={`h-[1.5px] w-full rounded-full bg-current transition-transform duration-200 ${
                  menuOpen ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`h-[1.5px] w-full rounded-full bg-current transition-opacity duration-150 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`h-[1.5px] w-full rounded-full bg-current transition-transform duration-200 ${
                  menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation — animated height/opacity, no unmount-jank */}
      {isAuth && (
        <div
          className={`overflow-hidden border-t border-[var(--border-light)] bg-[var(--bg-card)] transition-all duration-200 ease-out md:hidden ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 border-t-0 opacity-0"
          }`}
        >
          <div className={`mx-auto max-w-7xl space-y-1 ${mobileMenuPadding}`}>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition-colors duration-150 ${mobileMenuItemPadding} ${
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`
              }
            >
              <Icon name="dashboard" size={compact ? 14 : 16} />
              Dashboard
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition-colors duration-150 ${mobileMenuItemPadding} ${
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`
              }
            >
              <Icon name="history" size={compact ? 14 : 16} />
              History
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition-colors duration-150 ${mobileMenuItemPadding} ${
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`
              }
            >
              <Icon name="profile" size={compact ? 14 : 16} />
              Profile
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition-colors duration-150 ${mobileMenuItemPadding} ${
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`
              }
            >
              <Icon name="settings" size={compact ? 14 : 16} />
              Settings
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-lg text-left text-red-400 transition-colors duration-150 hover:bg-red-500/10 ${mobileMenuItemPadding}`}
            >
              <Icon name="logout" size={compact ? 14 : 16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}