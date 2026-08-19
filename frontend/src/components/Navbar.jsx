import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";

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
// Icons – all SVG paths remain the same, colors are handled via className
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
// DropdownItem – green themed
// -----------------------------------------------------------------

function DropdownItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          danger
            ? "bg-red-500/5 text-red-400"
            : "bg-[#21262d] text-[#484f58] group-hover:text-[#3fb950]"
        }`}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

// -----------------------------------------------------------------
// Main Navbar – now supports compact mode
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

  const handleLogout = () => {
    setDropOpen(false);
    logout();
    navigate("/login");
  };

  // Compact overrides for navbar
  const navbarHeight = compact ? "h-14" : "h-16";
  const logoSize = compact ? "h-8 w-8" : "h-9 w-9";
  const iconSize = compact ? 16 : 18;
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

  // Navigation item with compact overrides
  const NavigationItem = ({ to, label, icon }) => {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `relative flex items-center gap-2 rounded-lg px-3 transition-all duration-200 ${navItemHeight} ${navItemFont} font-medium ${
            isActive
              ? "bg-[#238636]/10 text-[#3fb950]"
              : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={isActive ? "text-[#3fb950]" : "text-[#484f58]"}>
              <Icon name={icon} size={compact ? 12 : 14} />
            </span>
            <span>{label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[#3fb950]" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <nav className={`sticky top-0 z-50 border-b border-[#30363d] bg-[#0d1117] ${navbarHeight}`}>
      <div className={`mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 ${compact ? "px-3 sm:px-4" : ""}`}>
        {/* LEFT – Logo */}
        <div className="flex min-w-0 items-center">
          <NavLink to="/" className="group flex items-center gap-2.5">
            <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-lg shadow-green-500/20 ${logoSize}`}>
              <div className="absolute inset-[1px] rounded-[11px] bg-[#0d1117]" />
              <Icon name="shield" size={iconSize} className="relative text-green-400" />
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-md bg-[#161b22] border border-[#30363d] flex items-center justify-center">
                <span className="text-[5px] font-bold text-green-400">&lt;/&gt;</span>
              </span>
              <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            </div>

            <div className="hidden sm:block">
              <div className={`flex items-center font-bold leading-none tracking-tight ${brandTextSize}`}>
                <span className="text-[#f0f6fc]">Code</span>
                <span className="text-[#3fb950]">Verity</span>
              </div>
              <p className={`mt-1 font-medium uppercase leading-none tracking-[0.2em] text-[#484f58] ${brandSubSize}`}>
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
                className={`flex items-center gap-2 rounded-lg px-1.5 transition-all ${compact ? "h-9" : "h-10"} ${
                  dropOpen ? "bg-[#21262d]" : "hover:bg-[#21262d]"
                }`}
              >
                <div className={`relative flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 font-bold text-white ${avatarSize} ${avatarFont}`}>
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d1117] bg-emerald-400" />
                </div>

                <div className="hidden text-left lg:block">
                  <p className={`max-w-[100px] truncate font-semibold leading-3 text-[#f0f6fc] ${userInfoNameSize}`}>
                    {userInfo.name || initials}
                  </p>
                  <p className={`mt-1 leading-3 text-[#484f58] ${userInfoRoleSize}`}>Developer</p>
                </div>

                <span
                  className={`ml-1 hidden text-[#484f58] transition-transform sm:block ${
                    dropOpen ? "rotate-180" : ""
                  }`}
                >
                  <Icon name="chevron" size={compact ? 10 : 12} />
                </span>
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-[50px] z-50 w-64 overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] shadow-2xl shadow-black/50">
                  <div className="border-b border-[#30363d] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-xs font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#f0f6fc]">
                          {userInfo.name || initials}
                        </p>
                        <p className="truncate text-[11px] text-[#8b949e]">
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

                  <div className="border-t border-[#30363d] py-2">
                    <DropdownItem
                      danger
                      icon={<Icon name="logout" size={15} />}
                      label="Sign out"
                      onClick={handleLogout}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <NavLink
                to="/login"
                className={`rounded-lg border border-[#30363d] bg-[#0d1117] font-medium text-[#8b949e] transition hover:bg-[#21262d] hover:text-[#f0f6fc] ${buttonPadding}`}
              >
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className={`rounded-lg bg-gradient-to-r from-[#238636] to-[#2ea043] font-semibold text-white transition hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/20 ${buttonPadding}`}
              >
                Get started
              </NavLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`ml-2 flex items-center justify-center rounded-lg border border-[#30363d] bg-[#0d1117] text-[#8b949e] transition hover:bg-[#21262d] hover:text-[#f0f6fc] md:hidden ${compact ? "h-8 w-8 text-sm" : "h-9 w-9 text-base"}`}
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isAuth && menuOpen && (
        <div className="border-t border-[#30363d] bg-[#161b22] md:hidden">
          <div className={`mx-auto max-w-7xl space-y-1 ${mobileMenuPadding}`}>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition ${mobileMenuItemPadding} ${
                  isActive
                    ? "bg-[#238636]/10 text-[#3fb950]"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                }`
              }
            >
              <Icon name="dashboard" size={compact ? 14 : 16} />
              Dashboard
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition ${mobileMenuItemPadding} ${
                  isActive
                    ? "bg-[#238636]/10 text-[#3fb950]"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                }`
              }
            >
              <Icon name="history" size={compact ? 14 : 16} />
              History
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition ${mobileMenuItemPadding} ${
                  isActive
                    ? "bg-[#238636]/10 text-[#3fb950]"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                }`
              }
            >
              <Icon name="profile" size={compact ? 14 : 16} />
              Profile
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition ${mobileMenuItemPadding} ${
                  isActive
                    ? "bg-[#238636]/10 text-[#3fb950]"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                }`
              }
            >
              <Icon name="settings" size={compact ? 14 : 16} />
              Settings
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-lg text-left text-red-400 hover:bg-red-500/10 ${mobileMenuItemPadding}`}
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