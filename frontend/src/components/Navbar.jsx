// src/components/Navbar.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  History as HistoryIcon,
  Users,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  DollarSign,
  Info,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";
import { gsap, useGSAP } from "../lib/gsap";

// ─── Icon map (Lucide) ─────────────────────────────────────────
// Central map so `name` strings stay the same as before — no need
// to update call sites if icons ever change again.
const ICONS = {
  dashboard: LayoutGrid,
  history: HistoryIcon,
  users: Users,
  profile: UserIcon,
  settings: SettingsIcon,
  logout: LogOut,
  chevron: ChevronDown,
  pricing: DollarSign,
  about: Info,
  contact: Mail,
  shield: ShieldCheck,
};

function Icon({ name, size = 16, className = "", strokeWidth = 1.8 }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    />
  );
}

// ─── Helpers ───────────────────────────────────────────────────
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

// ─── Sizing (single source of truth) ───────────────────────────
// Replaces the 14-ternary matrix. One function, one place to edit.
function sizeFor(isScrolled, compact) {
  const s = isScrolled;
  const c = compact;
  return {
    height: s ? (c ? "h-12" : "h-14") : c ? "h-14" : "h-16",
    logo: s ? (c ? "h-7 w-7" : "h-8 w-8") : c ? "h-8 w-8" : "h-9 w-9",
    icon: s ? (c ? 13 : 15) : c ? 15 : 17,
    brand: s
      ? c
        ? "text-[11px]"
        : "text-[13px]"
      : c
        ? "text-[13px]"
        : "text-[15px]",
    brandSub: s
      ? c
        ? "text-[7px]"
        : "text-[8px]"
      : c
        ? "text-[8px]"
        : "text-[9px]",
    navItem: s ? (c ? "h-7" : "h-8") : c ? "h-8" : "h-9",
    navItemFont: s
      ? c
        ? "text-[10.5px]"
        : "text-[11.5px]"
      : c
        ? "text-[11.5px]"
        : "text-[12.5px]",
    avatar: s ? (c ? "h-6 w-6" : "h-7 w-7") : c ? "h-7 w-7" : "h-8 w-8",
    avatarFont: s
      ? c
        ? "text-[9px]"
        : "text-[10px]"
      : c
        ? "text-[10px]"
        : "text-[11px]",
    userName: s
      ? c
        ? "text-[10px]"
        : "text-[11px]"
      : c
        ? "text-[11px]"
        : "text-[12px]",
    userRole: s ? "text-[9px]" : "text-[10px]",
    button: s
      ? c
        ? "px-2.5 py-1 text-[11px]"
        : "px-3 py-1.5 text-[12px]"
      : c
        ? "px-3 py-1.5 text-[12px]"
        : "px-3.5 py-2 text-[13px]",
    triggerH: s ? (c ? "h-8" : "h-9") : c ? "h-9" : "h-10",
    hamburger: s ? (c ? "h-8 w-8" : "h-9 w-9") : c ? "h-9 w-9" : "h-10 w-10",
  };
}

// ─── Hooks ─────────────────────────────────────────────────────
function useScrolled(threshold = 50) {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return isScrolled;
}

function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

// ─── Dropdown item ─────────────────────────────────────────────
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
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
          danger
            ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
            : "bg-[var(--bg-hover)] text-[var(--text-muted)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)]"
        }`}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── Desktop nav item (extracted — was remounting on every scroll) ─
function NavigationItem({ to, label, icon, navItemH, navItemFont, iconSize }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-1.5 rounded-lg px-3 font-mono transition-all duration-200 ${navItemH} ${navItemFont} ${
          isActive
            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
            : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={`absolute left-1.5 right-1.5 top-0 h-[2px] rounded-full bg-[var(--accent)] transition-opacity duration-200 ${
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
            }`}
          />
          <Icon
            name={icon}
            size={iconSize}
            className={`transition-transform duration-200 group-hover:scale-110 ${
              isActive ? "text-[var(--accent)]" : ""
            }`}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

// ─── Mobile nav item (extracted — was 9x copy-paste) ────────────
function MobileNavItem({ to, label, icon, iconSize, danger = false, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg border-l-2 px-4 py-3 font-mono text-sm transition-all duration-200 ${
          danger
            ? "border-transparent text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
            : isActive
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        }`
      }
    >
      <Icon
        name={icon}
        size={iconSize}
        className="transition-transform duration-200 group-hover:scale-110"
      />
      <span>{label}</span>
    </NavLink>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuth, token, logout, user } = useAuth();
  const { compact } = usePreferences();

  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isScrolled = useScrolled(50);

  const navRef = useRef(null);
  const navContentRef = useRef(null);
  const logoRef = useRef(null);
  const navItemsRef = useRef([]);
  const dropRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const addNavItemRef = useCallback((el) => {
    if (el && !navItemsRef.current.includes(el)) navItemsRef.current.push(el);
  }, []);

  const initials = useMemo(() => getInitials(token), [token]);
  const userInfo = useMemo(() => getUserInfo(token), [token]);
  const s = sizeFor(isScrolled, compact);

  useOutsideClick(dropRef, () => setDropOpen(false));

  // Close both menus on route change
  useEffect(() => {
    setDropOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Escape closes dropdown + mobile menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDropOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Body scroll lock while mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // ─── GSAP entrance (unchanged behavior) ──────────────────────
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          [
            navRef.current,
            logoRef.current,
            ...navItemsRef.current,
            navContentRef.current,
          ].forEach(
            (el) =>
              el && gsap.set(el, { clearProps: "opacity,visibility,transform" }),
          );
        },
      });

      if (navRef.current) {
        tl.from(navRef.current, { y: -18, autoAlpha: 0, duration: 0.55 });
      }
      if (logoRef.current) {
        tl.from(
          logoRef.current,
          { scale: 0.85, autoAlpha: 0, duration: 0.4, ease: "back.out(1.5)" },
          "-=0.3",
        );
      }
      if (navItemsRef.current?.length) {
        tl.from(
          navItemsRef.current,
          { y: -8, autoAlpha: 0, duration: 0.35, stagger: 0.055 },
          "-=0.25",
        );
      }
      if (navContentRef.current) {
        tl.from(
          navContentRef.current,
          { x: 8, autoAlpha: 0, duration: 0.35 },
          "-=0.25",
        );
      }
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      if (navRef.current) gsap.set(navRef.current, { clearProps: "all" });
    });

    return () => {
      mm.revert();
      if (logoRef.current) gsap.set(logoRef.current, { clearProps: "all" });
      if (navRef.current) gsap.set(navRef.current, { clearProps: "all" });
    };
  });

  // ─── GSAP mobile menu open/close (GPU-accelerated) ───────────
  useGSAP(
    () => {
      const el = mobileMenuRef.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(el, {
          height: menuOpen ? "auto" : 0,
          autoAlpha: menuOpen ? 1 : 0,
          duration: menuOpen ? 0.28 : 0.22,
          ease: menuOpen ? "power2.out" : "power2.in",
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, {
          height: menuOpen ? "auto" : 0,
          autoAlpha: menuOpen ? 1 : 0,
        });
      });

      return () => mm.revert();
    },
    { dependencies: [menuOpen], scope: navRef },
  );

  const handleLogout = () => {
    setDropOpen(false);
    logout();
    navigate("/login");
  };

  // Scrolled surface: real change, not just shadow
  const bgClass = isScrolled
    ? "bg-[var(--bg-secondary)]/85 backdrop-blur-md shadow-lg shadow-black/20"
    : "bg-[var(--bg-primary)]";

  return (
    <nav
      ref={navRef}
      className={`fixed inset-x-0 top-0 z-50 border-b border-[var(--border-light)] transition-all duration-200 ease-out ${bgClass} ${s.height}`}
    >
      <div
        ref={navContentRef}
        className="mx-auto flex h-full max-w-7xl items-center gap-3 px-3 sm:px-6 lg:px-8"
      >
        {/* LEFT — Logo & brand */}
        <div className="flex min-w-0 shrink-0 items-center">
          <NavLink
            ref={logoRef}
            to="/"
            className="group flex min-w-0 items-center gap-2.5 transition-all duration-200"
          >
            <div
              className={`relative flex shrink-0 items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] transition-all duration-200 ease-out group-hover:border-[var(--accent)]/50 group-hover:shadow-[0_0_0_3px_var(--accent-soft)] group-hover:scale-[1.03] ${s.logo}`}
            >
              <Icon
                name="shield"
                size={s.icon}
                className="text-[var(--accent)] transition-transform duration-300 group-hover:rotate-[-4deg]"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)]">
                <span className="font-mono text-[6px] font-bold text-[var(--accent)]">
                  {"</>"}
                </span>
              </span>
              <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)]">
                <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)] opacity-75" />
              </span>
            </div>

            <div className="flex min-w-0 flex-col">
              <div
                className={`flex items-center truncate font-bold leading-none tracking-tight transition-all duration-200 ${s.brand}`}
              >
                <span className="text-[var(--text-primary)]">Code</span>
                <span className="text-[var(--accent)]">Verity</span>
              </div>
              <p
                className={`hidden truncate font-mono font-medium uppercase leading-none tracking-[0.2em] text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--text-secondary)] sm:block ${s.brandSub}`}
              >
                AI Code Intelligence
              </p>
            </div>
          </NavLink>
        </div>

        {/* CENTER — nav (flex-1, no absolute positioning) */}
        <div className="hidden flex-1 justify-center md:flex">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-1 shadow-sm transition-colors duration-200 hover:border-[var(--accent)]/25">
            {isAuth && (
              <>
                <span ref={addNavItemRef}>
                  <NavigationItem
                    to="/dashboard"
                    label="Dashboard"
                    icon="dashboard"
                    navItemH={s.navItem}
                    navItemFont={s.navItemFont}
                    iconSize={s.icon - 4}
                  />
                </span>
                <span ref={addNavItemRef}>
                  <NavigationItem
                    to="/workspace"
                    label="Workspace"
                    icon="users"
                    navItemH={s.navItem}
                    navItemFont={s.navItemFont}
                    iconSize={s.icon - 4}
                  />
                </span>
                <span ref={addNavItemRef}>
                  <NavigationItem
                    to="/history"
                    label="History"
                    icon="history"
                    navItemH={s.navItem}
                    navItemFont={s.navItemFont}
                    iconSize={s.icon - 4}
                  />
                </span>
              </>
            )}
            <span ref={addNavItemRef}>
              <NavigationItem
                to="/pricing"
                label="Pricing"
                icon="pricing"
                navItemH={s.navItem}
                navItemFont={s.navItemFont}
                iconSize={s.icon - 4}
              />
            </span>
            <span ref={addNavItemRef}>
              <NavigationItem
                to="/about"
                label="About Us"
                icon="about"
                navItemH={s.navItem}
                navItemFont={s.navItemFont}
                iconSize={s.icon - 4}
              />
            </span>
            <span ref={addNavItemRef}>
              <NavigationItem
                to="/contact"
                label="Contact"
                icon="contact"
                navItemH={s.navItem}
                navItemFont={s.navItemFont}
                iconSize={s.icon - 4}
              />
            </span>
          </div>
        </div>

        {/* RIGHT — user / auth actions */}
        <div className="flex shrink-0 items-center gap-1">
          {isAuth ? (
            <div ref={dropRef} className="relative">
              <button
                type="button"
                onClick={() => setDropOpen((p) => !p)}
                aria-haspopup="true"
                aria-expanded={dropOpen}
                aria-label="Open user menu"
                className={`flex items-center gap-2 rounded-lg px-1.5 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 ${s.triggerH} ${
                  dropOpen
                    ? "bg-[var(--bg-hover)]"
                    : "hover:bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`relative flex shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] font-mono font-bold text-[var(--accent-contrast)] transition-transform duration-200 hover:scale-[1.04] ${s.avatar} ${s.avatarFont}`}
                >
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-primary)] bg-[var(--color-success)]" />
                </div>

                <div className="hidden text-left lg:block">
                  <p
                    className={`max-w-[100px] truncate font-semibold leading-3 text-[var(--text-primary)] transition-all duration-200 ${s.userName}`}
                  >
                    {userInfo.name || initials}
                  </p>
                  <p
                    className={`mt-1 font-mono leading-3 text-[var(--text-muted)] transition-all duration-200 ${s.userRole}`}
                  >
                    {userInfo.role || "developer"}
                  </p>
                </div>

                <span
                  className={`ml-1 hidden text-[var(--text-muted)] transition-transform duration-200 ease-out sm:block ${
                    dropOpen ? "rotate-180" : ""
                  }`}
                >
                  <Icon name="chevron" size={isScrolled ? 10 : 12} />
                </span>
              </button>

              {/* Dropdown */}
              <div
                className={`absolute right-0 top-[calc(100%+8px)] z-50 w-[calc(100vw-1.5rem)] max-w-[16rem] origin-top-right overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-2xl shadow-black/40 transition-all duration-200 ease-out sm:w-64 sm:max-w-none ${
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
                className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${s.button}`}
              >
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className={`whitespace-nowrap rounded-lg bg-[var(--accent)] font-semibold tracking-tight text-[var(--accent-contrast)] shadow-sm shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-md hover:scale-[1.02] active:scale-95 ${s.button}`}
              >
                Get started
              </NavLink>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((p) => !p)}
            className={`relative ml-1 flex shrink-0 items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 md:hidden ${s.hamburger}`}
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

      {/* ─── Mobile menu (GSAP-animated) ──────────────────────── */}
      <div
        ref={mobileMenuRef}
        style={{ height: 0, opacity: 0 }}
        className="overflow-hidden border-t border-[var(--border-light)] bg-[var(--bg-card)] md:hidden"
      >
        <div className="mx-auto max-h-[calc(100vh-4rem)] max-w-7xl space-y-1 overflow-y-auto px-3 py-3">
          {isAuth && (
            <>
              <MobileNavItem
                to="/dashboard"
                label="dashboard"
                icon="dashboard"
                iconSize={compact ? 14 : 16}
              />
              <MobileNavItem
                to="/workspace"
                label="workspace"
                icon="users"
                iconSize={compact ? 14 : 16}
              />
              <MobileNavItem
                to="/history"
                label="history"
                icon="history"
                iconSize={compact ? 14 : 16}
              />
            </>
          )}
          <MobileNavItem
            to="/pricing"
            label="pricing"
            icon="pricing"
            iconSize={compact ? 14 : 16}
          />
          <MobileNavItem
            to="/about"
            label="about us"
            icon="about"
            iconSize={compact ? 14 : 16}
          />
          <MobileNavItem
            to="/contact"
            label="contact"
            icon="contact"
            iconSize={compact ? 14 : 16}
          />
          {user?.isGlobalAdmin && (
            <MobileNavItem
              to="/admin"
              label="admin"
              icon="shield"
              iconSize={compact ? 14 : 16}
            />
          )}

          {isAuth ? (
            <>
              <MobileNavItem
                to="/profile"
                label="profile"
                icon="profile"
                iconSize={compact ? 14 : 16}
              />
              <MobileNavItem
                to="/settings"
                label="settings"
                icon="settings"
                iconSize={compact ? 14 : 16}
              />
              <button
                type="button"
                onClick={handleLogout}
                className="group flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-4 py-3 text-left font-mono text-sm text-[var(--color-danger)] transition-all duration-200 hover:border-[var(--color-danger)]/40 hover:bg-[var(--color-danger-soft)]"
              >
                <Icon
                  name="logout"
                  size={compact ? 14 : 16}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <NavLink
                to="/login"
                className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-semibold tracking-tight text-[var(--accent-contrast)] shadow-sm shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-95"
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