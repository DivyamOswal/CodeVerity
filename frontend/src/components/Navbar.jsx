import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";
import { gsap, useGSAP } from "../lib/gsap";

// -----------------------------------------------------------------
// Helper functions (unchanged)
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
  if (!token) return { name: "", email: "", role: "" };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const name = payload.name ?? payload.fullName ?? payload.username ?? "";
    return {
      name,
      email: payload.email ?? "",
      role: payload.role ?? "developer",
    };
  } catch {
    return { name: "", email: "", role: "" };
  }
}

// -----------------------------------------------------------------
// Icons (unchanged)
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
    users: (
      <>
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
        <path d="M4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" />
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
    pricing: (
      <>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7" />
      </>
    ),
    about: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-5" />
        <path d="M12 8h.01" />
      </>
    ),
    contact: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
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
// DropdownItem (unchanged)
// -----------------------------------------------------------------

function DropdownItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors duration-150 ${
        danger
          ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 ${
          danger
            ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
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
  const { isAuth, token, logout, user } = useAuth();
  const { compact } = usePreferences();

  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navRef = useRef(null);
  const navContentRef = useRef(null);
  const logoRef = useRef(null);
  const navItemsRef = useRef([]);
  const dropRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const activeIndicatorRef = useRef(null);

  const addNavItemRef = (element) => {
    if (element && !navItemsRef.current.includes(element)) {
      navItemsRef.current.push(element);
    }
  };

  const initials = useMemo(() => getInitials(token), [token]);
  const userInfo = useMemo(() => getUserInfo(token), [token]);

  // ─── Scroll handler ──────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Outside click for dropdown ─────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropRef.current && !dropRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ─── Close dropdown / mobile menu on route change ──────────
  useEffect(() => {
    setDropOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // ─── Prevent body scroll when mobile menu is open ──────────
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // ─── GSAP entrance animation (unchanged) ────────────────────
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      if (navRef.current) {
        timeline.from(navRef.current, {
          y: -18,
          autoAlpha: 0,
          duration: 0.55,
        });
      }

      if (logoRef.current) {
        timeline.from(
          logoRef.current,
          {
            scale: 0.85,
            autoAlpha: 0,
            duration: 0.4,
            ease: "back.out(1.5)",
          },
          "-=0.3"
        );
      }

      if (navItemsRef.current && navItemsRef.current.length) {
        timeline.from(
          navItemsRef.current,
          {
            y: -8,
            autoAlpha: 0,
            duration: 0.35,
            stagger: 0.055,
          },
          "-=0.25"
        );
      }

      if (navContentRef.current) {
        timeline.from(
          navContentRef.current,
          {
            x: 8,
            autoAlpha: 0,
            duration: 0.35,
          },
          "-=0.25"
        );
      }
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      if (navRef.current) {
        gsap.set(navRef.current, { clearProps: "all" });
      }
    });

    return () => mm.revert();
  });

  const handleLogout = () => {
    setDropOpen(false);
    logout();
    navigate("/login");
  };

  // ─── Sizing classes (dynamic based on compact & scroll) ──
  const baseHeight = compact ? "h-14" : "h-16";
  const shrunkHeight = compact ? "h-12" : "h-13";
  const navbarHeight = isScrolled ? shrunkHeight : baseHeight;

  const logoSize = isScrolled
    ? compact
      ? "h-7 w-7"
      : "h-8 w-8"
    : compact
    ? "h-8 w-8"
    : "h-9 w-9";

  const iconSize = isScrolled
    ? compact
      ? 13
      : 15
    : compact
    ? 15
    : 17;

  const brandTextSize = isScrolled
    ? compact
      ? "text-[11px]"
      : "text-[13px]"
    : compact
    ? "text-[13px]"
    : "text-[15px]";

  const brandSubSize = isScrolled
    ? compact
      ? "text-[6px]"
      : "text-[7px]"
    : compact
    ? "text-[7px]"
    : "text-[8px]";

  const navItemHeight = isScrolled
    ? compact
      ? "h-6"
      : "h-7"
    : compact
    ? "h-7"
    : "h-8";

  const navItemFont = isScrolled
    ? compact
      ? "text-[9.5px]"
      : "text-[10.5px]"
    : compact
    ? "text-[10.5px]"
    : "text-[11.5px]";

  const avatarSize = isScrolled
    ? compact
      ? "h-6 w-6"
      : "h-7 w-7"
    : compact
    ? "h-7 w-7"
    : "h-8 w-8";

  const avatarFont = isScrolled
    ? compact
      ? "text-[8px]"
      : "text-[9px]"
    : compact
    ? "text-[9px]"
    : "text-[10px]";

  const userInfoNameSize = isScrolled
    ? compact
      ? "text-[9px]"
      : "text-[10px]"
    : compact
    ? "text-[10px]"
    : "text-[11px]";

  const userInfoRoleSize = isScrolled
    ? compact
      ? "text-[6px]"
      : "text-[7px]"
    : compact
    ? "text-[7px]"
    : "text-[8px]";

  const buttonPadding = isScrolled
    ? compact
      ? "px-2.5 py-1 text-[10px]"
      : "px-3 py-1.5 text-[11px]"
    : compact
    ? "px-3 py-1.5 text-[11px]"
    : "px-3.5 py-2 text-[12px]";

  const mobileMenuPadding = compact ? "py-2 px-3" : "py-3 px-4";
  const mobileMenuItemPadding = compact
    ? "px-3 py-2.5 text-sm"
    : "px-4 py-3 text-sm";

  // ─── Background & shadow ─────────────────────────────────────
  const bgClass = isScrolled
    ? "bg-[var(--bg-primary)]/95 shadow-lg shadow-black/10"
    : "bg-[var(--bg-primary)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-primary)]/70";

  const NavigationItem = ({ to, label, icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-1.5 rounded-lg px-3 font-mono transition-colors duration-200 ${navItemHeight} ${navItemFont} ${
          isActive
            ? "bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={`absolute left-1.5 right-1.5 top-0 h-[2px] rounded-full bg-[var(--accent)] transition-opacity duration-200 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
          <Icon
            name={icon}
            size={isScrolled ? (compact ? 10 : 11) : compact ? 12 : 13}
            className={isActive ? "text-[var(--accent)]" : ""}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <nav
      ref={navRef}
      className={`sticky top-0 z-50 border-b border-[var(--border-light)] transition-all duration-200 ease-out ${bgClass} ${navbarHeight}`}
    >
      <div
        ref={navContentRef}
        className={`mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 ${
          compact ? "px-3 sm:px-4" : ""
        }`}
      >
        {/* LEFT – Logo */}
        <div className="flex min-w-0 items-center">
          <NavLink
            ref={logoRef}
            to="/"
            className="group flex items-center gap-2.5 transition-all duration-200"
          >
            <div
              className={`relative flex shrink-0 items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] transition-all duration-200 ease-out group-hover:border-[var(--accent)]/50 group-hover:shadow-[0_0_0_3px_var(--accent-soft)] ${logoSize}`}
            >
              <Icon
                name="shield"
                size={iconSize}
                className="text-[var(--accent)]"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)]">
                <span className="font-mono text-[5px] font-bold text-[var(--accent)]">
                  {"</>"}
                </span>
              </span>
              <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)]">
                <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)] opacity-75" />
              </span>
            </div>

            <div className="hidden sm:block">
              <div
                className={`flex items-center font-bold leading-none tracking-tight transition-all duration-200 ${brandTextSize}`}
              >
                <span className="text-[var(--text-primary)]">Code</span>
                <span className="text-[var(--accent)]">Verity</span>
              </div>
              <p
                className={`mt-1 font-mono font-medium uppercase leading-none tracking-[0.2em] text-[var(--text-muted)] transition-all duration-200 ${brandSubSize}`}
              >
                AI Code Intelligence
              </p>
            </div>
          </NavLink>
        </div>

        {/* CENTER – Navigation */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-1 shadow-sm md:flex">
          {isAuth && (
            <>
              <NavigationItem
                to="/dashboard"
                label="Dashboard"
                icon="dashboard"
              />
              <NavigationItem to="/workspace" label="Workspace" icon="users" />
              <NavigationItem to="/history" label="History" icon="history" />
            </>
          )}
          <NavigationItem to="/pricing" label="Pricing" icon="pricing" />
          <NavigationItem to="/about" label="About Us" icon="about" />
          <NavigationItem to="/contact" label="Contact" icon="contact" />
        </div>

        {/* RIGHT – User */}
        <div className="flex items-center gap-1">
          {isAuth ? (
            <div ref={dropRef} className="relative">
              <button
                type="button"
                onClick={() => setDropOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={dropOpen}
                className={`flex items-center gap-2 rounded-lg px-1.5 transition-colors duration-150 ${
                  isScrolled
                    ? compact
                      ? "h-8"
                      : "h-9"
                    : compact
                    ? "h-9"
                    : "h-10"
                } ${dropOpen ? "bg-[var(--bg-hover)]" : "hover:bg-[var(--bg-hover)]"}`}
              >
                <div
                  className={`relative flex shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] font-mono font-bold text-[var(--accent-contrast)] transition-all duration-200 ${avatarSize} ${avatarFont}`}
                >
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-primary)] bg-[var(--color-success)]" />
                </div>

                <div className="hidden text-left lg:block">
                  <p
                    className={`max-w-[100px] truncate font-semibold leading-3 text-[var(--text-primary)] transition-all duration-200 ${userInfoNameSize}`}
                  >
                    {userInfo.name || initials}
                  </p>
                  <p
                    className={`mt-1 font-mono leading-3 text-[var(--text-muted)] transition-all duration-200 ${userInfoRoleSize}`}
                  >
                    {userInfo.role || "developer"}
                  </p>
                </div>

                <span
                  className={`ml-1 hidden text-[var(--text-muted)] transition-transform duration-200 ease-out sm:block ${
                    dropOpen ? "rotate-180" : ""
                  }`}
                >
                  <Icon name="chevron" size={isScrolled ? (compact ? 9 : 10) : compact ? 10 : 12} />
                </span>
              </button>

              {/* Dropdown (unchanged) */}
              <div
                className={`absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-2xl shadow-black/40 transition-all duration-200 ease-out ${
                  dropOpen
                    ? "translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                }`}
              >
                <div className="border-b border-[var(--border-light)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] font-mono text-xs font-bold text-[var(--accent-contrast)]">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {userInfo.name || initials}
                      </p>
                      <p className="truncate font-mono text-[11px] text-[var(--text-secondary)]">
                        {userInfo.email || "signed-in"}
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
                  {user?.isGlobalAdmin && (
                    <DropdownItem
                      icon={<Icon name="shield" size={15} />}
                      label="Admin"
                      onClick={() => navigate("/admin")}
                    />
                  )}
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
                className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${buttonPadding}`}
              >
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className={`whitespace-nowrap rounded-lg bg-[var(--accent)] font-semibold tracking-tight text-[var(--accent-contrast)] shadow-sm shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-95 ${buttonPadding}`}
              >
                Get started
              </NavLink>
            </div>
          )}

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`relative ml-1 flex items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] md:hidden ${
              isScrolled
                ? compact
                  ? "h-8 w-8"
                  : "h-9 w-9"
                : compact
                ? "h-9 w-9"
                : "h-10 w-10"
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

      {/* Mobile Navigation (unchanged) */}
      <div
        className={`overflow-hidden border-t border-[var(--border-light)] bg-[var(--bg-card)] transition-all duration-200 ease-out md:hidden ${
          menuOpen
            ? "max-h-[36rem] opacity-100"
            : "max-h-0 border-t-0 opacity-0"
        }`}
      >
        <div className={`mx-auto max-w-7xl space-y-1 ${mobileMenuPadding}`}>
          {isAuth && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`
                }
              >
                <Icon name="dashboard" size={compact ? 14 : 16} />
                dashboard
              </NavLink>
              <NavLink
                to="/workspace"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`
                }
              >
                <Icon name="users" size={compact ? 14 : 16} />
                workspace
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`
                }
              >
                <Icon name="history" size={compact ? 14 : 16} />
                history
              </NavLink>
            </>
          )}
          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`
            }
          >
            <Icon name="pricing" size={compact ? 14 : 16} />
            pricing
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`
            }
          >
            <Icon name="about" size={compact ? 14 : 16} />
            about us
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`
            }
          >
            <Icon name="contact" size={compact ? 14 : 16} />
            contact
          </NavLink>
          {user?.isGlobalAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`
              }
            >
              <Icon name="shield" size={compact ? 14 : 16} />
              admin
            </NavLink>
          )}

          {isAuth ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`
                }
              >
                <Icon name="profile" size={compact ? 14 : 16} />
                profile
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg border-l-2 font-mono transition-colors duration-200 ${mobileMenuItemPadding} ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`
                }
              >
                <Icon name="settings" size={compact ? 14 : 16} />
                settings
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className={`flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent text-left font-mono text-[var(--color-danger)] transition-colors duration-200 hover:bg-[var(--color-danger-soft)] ${mobileMenuItemPadding}`}
              >
                <Icon name="logout" size={compact ? 14 : 16} />
                sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <NavLink
                to="/login"
                className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-semibold tracking-tight text-[var(--accent-contrast)] shadow-sm shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)]"
              >
                Get started
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}