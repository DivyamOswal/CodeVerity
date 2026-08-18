import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";

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
  if (!token) {
    return {
      name: "",
      email: "",
    };
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return {
      name: payload.name ?? "",
      email: payload.email ?? "",
    };
  } catch {
    return {
      name: "",
      email: "",
    };
  }
}

function Icon({ name, size = 16 }) {
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

    logo: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle
          cx="12"
          cy="12"
          r="2.2"
          fill="currentColor"
          stroke="none"
        />

        <path d="M12 3.5v4" />
        <path d="M12 16.5v4" />
        <path d="M3.5 12h4" />
        <path d="M16.5 12h4" />

        <path d="M6 6l2.8 2.8" />
        <path d="M15.2 15.2L18 18" />

        <path d="M18 6l-2.8 2.8" />
        <path d="M8.8 15.2L6 18" />
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
    >
      {icons[name]}
    </svg>
  );
}

function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition ${
        danger
          ? "text-[#f85149] hover:bg-[#f85149]/10"
          : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          danger
            ? "bg-[#f85149]/5 text-[#f85149]"
            : "bg-[#21262d] text-[#8b949e] group-hover:text-[#58a6ff]"
        }`}
      >
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuth, token, logout } = useAuth();

  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dropRef = useRef(null);

  const initials = useMemo(
    () => getInitials(token),
    [token]
  );

  const userInfo = useMemo(
    () => getUserInfo(token),
    [token]
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(event.target)
      ) {
        setDropOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
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

  const NavigationItem = ({
    to,
    label,
    icon,
  }) => {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `relative flex h-9 items-center gap-2 rounded-lg px-3 text-[12px] font-medium transition-all duration-200 ${
            isActive
              ? "bg-[#1f6feb]/10 text-[#58a6ff]"
              : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={
                isActive
                  ? "text-[#58a6ff]"
                  : "text-[#484f58]"
              }
            >
              <Icon
                name={icon}
                size={14}
              />
            </span>

            <span>{label}</span>

            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[#58a6ff]" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-[#30363d] bg-[#161b22]">

      {/* =====================================================
          SAME CONTAINER WIDTH AS HISTORY PAGE
      ===================================================== */}

      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ===================================================
            LEFT - LOGO
        =================================================== */}

        <div className="flex min-w-0 items-center">

          <NavLink
            to="/"
            className="group flex items-center gap-2.5"
          >

            {/* Custom CodeVerity Logo */}

            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#30363d] bg-[#0d1117] text-[#58a6ff] shadow-[0_0_18px_rgba(88,166,255,0.08)] transition-all duration-200 group-hover:border-[#58a6ff]/40 group-hover:shadow-[0_0_20px_rgba(88,166,255,0.15)]">

              <div className="absolute inset-[3px] rounded-lg border border-[#7c3aed]/20" />

              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#3b82f6]/10 via-transparent to-[#8b5cf6]/10" />

              <Icon
                name="logo"
                size={19}
              />

              <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-[#161b22] bg-[#00d084]" />

            </div>

            {/* Brand */}

            <div className="hidden sm:block">

              <div className="flex items-center text-[15px] font-bold leading-none tracking-tight">

                <span className="text-[#f0f6fc]">
                  Code
                </span>

                <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                  Verity
                </span>

              </div>

              <p className="mt-1 text-[8px] font-medium uppercase leading-none tracking-[0.2em] text-[#484f58]">
                AI Code Intelligence
              </p>

            </div>

          </NavLink>

        </div>

        {/* ===================================================
            CENTER NAVIGATION
        =================================================== */}

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">

          {isAuth && (
            <>
              <NavigationItem
                to="/dashboard"
                label="Dashboard"
                icon="dashboard"
              />

              <NavigationItem
                to="/history"
                label="History"
                icon="history"
              />
            </>
          )}

        </div>

        {/* ===================================================
            RIGHT - USER
        =================================================== */}

        <div className="flex items-center">

          {isAuth ? (
            <div
              ref={dropRef}
              className="relative"
            >

              <button
                type="button"
                onClick={() =>
                  setDropOpen(
                    (previous) => !previous
                  )
                }
                className={`flex h-10 items-center gap-2 rounded-lg px-1.5 transition-all ${
                  dropOpen
                    ? "bg-[#21262d]"
                    : "hover:bg-[#21262d]"
                }`}
              >

                {/* Avatar */}

                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#7c3aed] text-[10px] font-bold text-white">

                  {initials}

                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#161b22] bg-[#00d084]" />

                </div>

                {/* User information */}

                <div className="hidden text-left lg:block">

                  <p className="max-w-[100px] truncate text-[11px] font-semibold leading-3 text-[#f0f6fc]">
                    {userInfo.name || initials}
                  </p>

                  <p className="mt-1 text-[8px] leading-3 text-[#484f58]">
                    Developer
                  </p>

                </div>

                <span
                  className={`ml-1 hidden text-[#484f58] transition-transform sm:block ${
                    dropOpen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  <Icon
                    name="chevron"
                    size={12}
                  />
                </span>

              </button>

              {/* User Dropdown */}

              {dropOpen && (
                <div className="absolute right-0 top-[50px] z-50 w-64 overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] shadow-2xl shadow-black/50">

                  <div className="border-b border-[#30363d] p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#7c3aed] text-xs font-bold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-[#f0f6fc]">
                          {userInfo.name || initials}
                        </p>

                        <p className="truncate text-[11px] text-[#484f58]">
                          {userInfo.email || "Signed in"}
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="py-2">

                    <DropdownItem
                      icon={
                        <Icon
                          name="profile"
                          size={15}
                        />
                      }
                      label="Profile"
                      onClick={() =>
                        navigate("/profile")
                      }
                    />

                    <DropdownItem
                      icon={
                        <Icon
                          name="settings"
                          size={15}
                        />
                      }
                      label="Settings"
                      onClick={() =>
                        navigate("/settings")
                      }
                    />

                    <DropdownItem
                      icon={
                        <Icon
                          name="history"
                          size={15}
                        />
                      }
                      label="Review History"
                      onClick={() =>
                        navigate("/history")
                      }
                    />

                    <DropdownItem
                      icon={
                        <Icon
                          name="dashboard"
                          size={15}
                        />
                      }
                      label="Dashboard"
                      onClick={() =>
                        navigate("/dashboard")
                      }
                    />

                  </div>

                  <div className="border-t border-[#30363d] py-2">

                    <DropdownItem
                      danger
                      icon={
                        <Icon
                          name="logout"
                          size={15}
                        />
                      }
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
                className="rounded-lg border border-[#30363d] bg-[#0d1117] px-3.5 py-2 text-[12px] font-medium text-[#8b949e] transition hover:bg-[#21262d] hover:text-[#f0f6fc]"
              >
                Sign in
              </NavLink>

              <NavLink
                to="/register"
                className="rounded-lg bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-3.5 py-2 text-[12px] font-semibold text-white transition hover:opacity-90"
              >
                Get started
              </NavLink>

            </div>

          )}

          {/* Mobile Menu */}

          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (previous) => !previous
              )
            }
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-[#30363d] bg-[#0d1117] text-[#8b949e] transition hover:bg-[#21262d] hover:text-[#f0f6fc] md:hidden"
          >
            {menuOpen ? "×" : "☰"}
          </button>

        </div>

      </div>

      {/* =====================================================
          MOBILE NAVIGATION
      ===================================================== */}

      {isAuth && menuOpen && (
        <div className="border-t border-[#30363d] bg-[#161b22] md:hidden">

          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                  isActive
                    ? "bg-[#1f6feb]/10 text-[#58a6ff]"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                }`
              }
            >
              <Icon
                name="dashboard"
                size={16}
              />

              Dashboard
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                  isActive
                    ? "bg-[#1f6feb]/10 text-[#58a6ff]"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                }`
              }
            >
              <Icon
                name="history"
                size={16}
              />

              History
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                  isActive
                    ? "bg-[#1f6feb]/10 text-[#58a6ff]"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                }`
              }
            >
              <Icon
                name="profile"
                size={16}
              />

              Profile
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                  isActive
                    ? "bg-[#1f6feb]/10 text-[#58a6ff]"
                    : "text-[#8b949e] hover:bg-[#21262d]"
                }`
              }
            >
              <Icon
                name="settings"
                size={16}
              />

              Settings
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-[#f85149] hover:bg-[#f85149]/10"
            >
              <Icon
                name="logout"
                size={16}
              />

              Sign out
            </button>

          </div>

        </div>
      )}

    </nav>
  );
}