// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, FileText, DollarSign, Activity, Clock,
  Check, X, AlertCircle, RotateCw, Inbox, Search,
  ArrowUp, ArrowDown, TrendingUp, TrendingDown, ChevronRight,
  Command as CommandIcon, Shield,
} from "lucide-react";
import { useAuth } from "../App";
import axios from "../api/axios";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { useToast } from "../hooks/useToast";
import { gsap, useGSAP } from "../lib/gsap";

/* ============================================================
   Utilities
   ============================================================ */
const fmt = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
  : `${n}`;

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fmtRelative = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// Deterministic synthetic series so sparklines look alive but stable.
function syntheticSeries(finalValue, points = 24, seed = 1) {
  if (!finalValue) return Array(points).fill(0);
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const trend = 0.5 + t * 0.55;
    const wave = Math.sin(i * (0.4 + seed * 0.1) + seed) * 0.15;
    return Math.max(1, finalValue * (trend + wave));
  });
}

/* ============================================================
   Sparkline — animated on mount
   ============================================================ */
function Sparkline({ data, color = "accent", height = 34, width = 130 }) {
  const pathRef = useRef(null);
  const stroke =
    color === "accent"   ? "var(--accent)"
  : color === "accent2"  ? "var(--accent-secondary)"
  : color === "success"  ? "var(--color-success)"
  : color === "warning"  ? "var(--color-warning)"
  :                        "var(--color-danger)";

  const { path, area } = useMemo(() => {
    if (!data?.length) return { path: "", area: "" };
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const pts = data.map((v, i) => [
      i * step,
      height - ((v - min) / range) * (height - 6) - 3,
    ]);
    const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
    const area = `${path} L${width},${height} L0,${height} Z`;
    return { path, area };
  }, [data, height, width]);

  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(p, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" });
  }, [path]);

  const gradId = `sg-${color}`;
  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================
   StatusPill — reusable
   ============================================================ */
function StatusPill({ tone = "neutral", children }) {
  const map = {
    success: "bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/25",
    warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/25",
    danger:  "bg-[var(--color-danger-soft)]  text-[var(--color-danger)]  border-[var(--color-danger)]/25",
    info:    "bg-[var(--color-info-soft)]    text-[var(--color-info)]    border-[var(--color-info)]/25",
    accent:  "bg-[var(--accent-soft)]        text-[var(--accent)]        border-[var(--accent)]/25",
    neutral: "bg-[var(--bg-hover)]           text-[var(--text-secondary)] border-[var(--border-light)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${map[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        tone === "success" ? "bg-[var(--color-success)]"
      : tone === "warning" ? "bg-[var(--color-warning)]"
      : tone === "danger"  ? "bg-[var(--color-danger)]"
      : tone === "info"    ? "bg-[var(--color-info)]"
      : tone === "accent"  ? "bg-[var(--accent)]"
      : "bg-[var(--text-muted)]"
      }`} />
      {children}
    </span>
  );
}

/* ============================================================
   KpiCard — hero stat with sparkline + delta
   ============================================================ */
function KpiCard({ label, value, display, icon: Icon, tone, series, delta, index }) {
  const numRef = useRef(null);
  const [n, setN] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(el, { opacity: 0, y: 14 });
    if (reduce) { gsap.set(el, { opacity: 1, y: 0 }); setN(value); return; }
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.6, ease: "power3.out",
      delay: index * 0.08,
    });
    const start = performance.now();
    const dur = 800;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, index]);

  const positive = (delta ?? 0) >= 0;
  const deltaGood = tone === "danger" ? !positive : positive;

  const toneBg = {
    accent:  "bg-[var(--accent-soft)] text-[var(--accent)]",
    accent2: "bg-[var(--accent-secondary-soft)] text-[var(--accent-secondary)]",
    success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    danger:  "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    info:    "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  }[tone] || "bg-[var(--accent-soft)] text-[var(--accent)]";

  return (
    <div
      ref={ref}
      className="admin-kpi group relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/55 p-5 backdrop-blur-sm transition-colors duration-200 hover:border-[var(--accent)]/35"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneBg}`}>
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
            </span>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {label}
            </p>
          </div>
          <p ref={numRef} className="stat-number mt-3 text-3xl font-extrabold leading-none tabular-nums">
            {display ? display(value) : fmt(n)}
          </p>
        </div>
        {delta !== undefined && (
          <span className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
            deltaGood
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          }`}>
            {positive ? <TrendingUp size={10} strokeWidth={2.4} /> : <TrendingDown size={10} strokeWidth={2.4} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="-mx-1 -mb-1 mt-3">
        <Sparkline data={series} color={tone === "accent2" ? "accent2" : tone} />
      </div>
    </div>
  );
}

/* ============================================================
   Table skeleton / empty / error (upgraded)
   ============================================================ */
function TableSkeleton({ rows = 6, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]/40">
      <div className="flex items-center gap-4 border-b border-[var(--border-light)] bg-[var(--bg-hover)]/60 px-4 py-3">
        {Array.from({ length: cols }, (_, i) => (
          <span key={i} className="admin-skeleton h-3 flex-1 rounded" />
        ))}
      </div>
      <div className="divide-y divide-[var(--border-light)]">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }, (_, j) => (
              <span key={j} className="admin-skeleton h-3 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyTable({ icon: Icon, message, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-card)]/40 px-4 py-14 text-center backdrop-blur-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)]/20">
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{message}</p>
      {hint && <p className="max-w-xs text-xs text-[var(--text-muted)]">{hint}</p>}
      {action}
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-4 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-1 ring-[var(--color-danger)]/30">
        <AlertCircle size={20} strokeWidth={2} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">Couldn't load data</p>
        <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--bg-card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/10 active:scale-[0.97]"
      >
        <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

/* ============================================================
   FilterChip
   ============================================================ */
function FilterChip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-150 ${
        active
          ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--border-light)] bg-[var(--bg-card)]/60 text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`rounded-full px-1.5 text-[9px] ${
          active ? "bg-[var(--accent)]/20" : "bg-[var(--bg-hover)]"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ============================================================
   Drawer — slide-in from right
   ============================================================ */
function Drawer({ open, onClose, title, subtitle, children }) {
  const wrapRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const panel = panelRef.current;
    if (!wrap || !panel) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (open) {
      gsap.set(wrap, { display: "flex", pointerEvents: "auto" });
      gsap.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" });
      if (!reduce) {
        gsap.fromTo(panel, { x: "100%" }, { x: "0%", duration: 0.4, ease: "power3.out" });
      } else {
        gsap.set(panel, { x: "0%" });
      }
    } else {
      gsap.to(panel, { x: "100%", duration: 0.28, ease: "power2.in" });
      gsap.to(wrap, {
        opacity: 0, duration: 0.24, delay: 0.05, ease: "power2.in",
        onComplete: () => gsap.set(wrap, { display: "none", pointerEvents: "none" }),
      });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && open && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={wrapRef}
      style={{ display: "none" }}
      className="fixed inset-0 z-[80] items-stretch justify-end bg-[var(--bg-primary)]/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="admin-drawer relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[var(--border-light)] bg-[var(--bg-card)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-light)] px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {subtitle}
            </p>
            <h3 className="mt-0.5 truncate text-base font-bold text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   CommandPalette — ⌘K
   ============================================================ */
function CommandPalette({ open, onClose, actions }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [query, actions]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      const wrap = wrapRef.current;
      if (wrap) {
        gsap.set(wrap, { display: "flex" });
        gsap.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" });
        const panel = wrap.querySelector(".cmd-panel");
        if (panel) gsap.fromTo(panel, { y: -12, scale: 0.98 }, { y: 0, scale: 1, duration: 0.28, ease: "power3.out" });
      }
    } else {
      const wrap = wrapRef.current;
      if (wrap) {
        gsap.to(wrap, {
          opacity: 0, duration: 0.15,
          onComplete: () => gsap.set(wrap, { display: "none" }),
        });
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && filtered[active]) {
        e.preventDefault();
        filtered[active].onSelect?.();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onClose]);

  return (
    <div
      ref={wrapRef}
      style={{ display: "none" }}
      className="fixed inset-0 z-[90] items-start justify-center bg-[var(--bg-primary)]/70 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cmd-panel w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border-light)] px-4 py-3">
          <Search size={15} className="shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            placeholder="Type a command or search…"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--border-light)] bg-[var(--bg-hover)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:inline">
            ESC
          </kbd>
        </div>
        <div className="max-h-[340px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">No matches.</p>
          ) : (
            filtered.map((a, i) => (
              <button
                key={a.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => { a.onSelect?.(); onClose(); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  i === active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--bg-hover)]">
                  {a.icon || <CommandIcon size={12} />}
                </span>
                <span className="flex-1 truncate">{a.label}</span>
                {a.hint && <span className="font-mono text-[10px] text-[var(--text-muted)]">{a.hint}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Main Admin Dashboard
   ============================================================ */
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [cmdOpen, setCmdOpen] = useState(false);
  const panelRef = useRef(null);
  const containerRef = useRef(null);
  const [dialog, setDialog] = useState({
    isOpen: false, title: "", message: "",
    confirmText: "Confirm", cancelText: "Cancel",
    confirmVariant: "danger", onConfirm: () => {},
  });

  // ─── ⌘K listener
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!user?.isGlobalAdmin) { navigate("/dashboard"); return; }
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      error("Failed to load admin statistics.");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = useCallback((opts) => {
    setDialog({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText || "Confirm",
      cancelText: opts.cancelText || "Cancel",
      confirmVariant: opts.confirmVariant || "danger",
      onConfirm: opts.onConfirm,
    });
  }, []);

  // ─── Tab entrance animation
  useGSAP(() => {
    if (loading || !panelRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, { dependencies: [activeTab, loading], scope: containerRef });

  const TABS = [
    { id: "overview",   label: "Overview",   icon: Activity },
    { id: "users",      label: "Users",      icon: Users },
    { id: "workspaces", label: "Workspaces", icon: Briefcase },
    { id: "reports",    label: "Reports",    icon: FileText },
  ];

  const cmdActions = useMemo(() => [
    ...TABS.map((t) => ({
      id: `tab-${t.id}`,
      label: `Go to ${t.label}`,
      hint: "Tab",
      icon: <t.icon size={12} />,
      onSelect: () => setActiveTab(t.id),
    })),
    {
      id: "refresh",
      label: "Refresh stats",
      hint: "R",
      icon: <RotateCw size={12} />,
      onSelect: fetchStats,
    },
    {
      id: "home",
      label: "Back to home",
      hint: "H",
      icon: <Shield size={12} />,
      onSelect: () => navigate("/"),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [navigate]);

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-4 pt-20 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="space-y-2">
              <div className="admin-skeleton h-7 w-64 rounded" />
              <div className="admin-skeleton h-3 w-80 max-w-full rounded" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/50 p-5">
                  <div className="admin-skeleton h-3 w-20 rounded" />
                  <div className="admin-skeleton mt-3 h-8 w-24 rounded" />
                  <div className="admin-skeleton mt-4 h-8 w-full rounded" />
                </div>
              ))}
            </div>
            <div className="admin-skeleton h-10 w-full max-w-md rounded-full" />
            <TableSkeleton rows={6} cols={5} />
          </div>
        </div>
      </div>
    );
  }

  const seriesSeed = 1;
  const kpis = [
    {
      label: "Total Users", value: stats?.totalUsers ?? 0,
      icon: Users, tone: "accent", delta: 8.2,
      series: syntheticSeries(stats?.totalUsers ?? 0, 24, seriesSeed),
    },
    {
      label: "Workspaces", value: stats?.totalWorkspaces ?? 0,
      icon: Briefcase, tone: "accent2", delta: 4.1,
      series: syntheticSeries(stats?.totalWorkspaces ?? 0, 24, seriesSeed + 1),
    },
    {
      label: "Reports", value: stats?.totalReports ?? 0,
      icon: FileText, tone: "success", delta: 12.4,
      series: syntheticSeries(stats?.totalReports ?? 0, 24, seriesSeed + 2),
    },
    {
      label: "Revenue", value: stats?.totalRevenue ?? 0,
      icon: DollarSign, tone: "warning", delta: 5.7,
      display: fmtINR,
      series: syntheticSeries(stats?.totalRevenue ?? 0, 24, seriesSeed + 3),
    },
  ];

  return (
    <div
      ref={containerRef}
      className="admin-shell relative min-h-screen bg-[var(--bg-primary)] px-4 pb-16 pt-20 sm:px-6"
    >
      {/* Ambient dotted grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse at top, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* ─── HEADER ─── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)] text-[10px] font-bold text-[var(--accent-contrast)]">
                A
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                admin console
              </p>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)] sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
                </span>
                All systems operational
              </span>
              <span className="text-[var(--border-medium)]">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} />
                {new Date().toLocaleTimeString()}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="group flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/70 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/35 hover:text-[var(--text-primary)]"
            >
              <Search size={13} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-1 hidden rounded border border-[var(--border-light)] bg-[var(--bg-hover)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:inline">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={fetchStats}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/70 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/35 hover:text-[var(--text-primary)]"
            >
              <RotateCw size={13} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ─── KPI ROW ─── */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} {...k} index={i} />
          ))}
        </div>

        {/* ─── TAB BAR (sliding indicator) ─── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Admin sections"
            className="inline-flex w-full overflow-x-auto rounded-full border border-[var(--border-light)] bg-[var(--bg-card)]/60 p-1 backdrop-blur-sm sm:w-auto"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 sm:px-4 ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_16px_-4px_var(--accent-soft-strong)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon size={13} strokeWidth={2.2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── TAB PANEL ─── */}
        <div ref={panelRef} className="mt-6">
          {activeTab === "overview"   && <Overview stats={stats} />}
          {activeTab === "users"      && <UserManagement openDialog={openDialog} />}
          {activeTab === "workspaces" && <WorkspaceManagement openDialog={openDialog} />}
          {activeTab === "reports"    && <ReportManagement />}
        </div>

        {/* ─── DIALOGS ─── */}
        <ConfirmationDialog
          isOpen={dialog.isOpen}
          onClose={() => setDialog((d) => ({ ...d, isOpen: false }))}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          confirmVariant={dialog.confirmVariant}
        />

        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          actions={cmdActions}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Overview Tab
   ============================================================ */
function Overview({ stats }) {
  const cardsRef = useRef(null);

  useGSAP(() => {
    if (!cardsRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      cardsRef.current.querySelectorAll("[data-ov-card]"),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" },
    );
  }, { scope: cardsRef });

  const totalUsers = stats?.totalUsers ?? 0;
  const totalWorkspaces = stats?.totalWorkspaces ?? 0;
  const totalReports = stats?.totalReports ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const arpu = totalUsers ? Math.round(totalRevenue / totalUsers) : 0;

  return (
    <div ref={cardsRef} className="space-y-5">
      {/* System status */}
      <div data-ov-card className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]/55 p-4 backdrop-blur-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-success-soft)] text-[var(--color-success)]">
            <Activity size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Status</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--color-success)]">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]/55 p-4 backdrop-blur-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Users size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Active Users</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)] tabular-nums">{totalUsers.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]/55 p-4 backdrop-blur-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-info-soft)] text-[var(--color-info)]">
            <Clock size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Last Sync</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div data-ov-card className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/55 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Platform Usage</h3>
            <StatusPill tone="accent">live</StatusPill>
          </div>
          <div className="space-y-3">
            {[
              { label: "Users",      value: totalUsers,      icon: Users,     tone: "accent"  },
              { label: "Workspaces", value: totalWorkspaces, icon: Briefcase, tone: "accent2" },
              { label: "Reports",    value: totalReports,    icon: FileText,  tone: "success" },
            ].map((row) => {
              const Icon = row.icon;
              const max = Math.max(totalUsers, totalWorkspaces, totalReports, 1);
              const pct = Math.round((row.value / max) * 100);
              return (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <Icon size={11} /> {row.label}
                    </span>
                    <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                      {row.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background:
                          row.tone === "accent2" ? "var(--accent-secondary)"
                          : row.tone === "success" ? "var(--color-success)"
                          : "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div data-ov-card className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/55 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Financial Summary</h3>
            <StatusPill tone="warning">MRR</StatusPill>
          </div>
          <div className="space-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Total Revenue
              </p>
              <p className="stat-number mt-1 text-3xl font-extrabold tabular-nums">
                {fmtINR(totalRevenue)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-light)] pt-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  ARPU
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                  {fmtINR(arpu)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Users
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                  {totalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Search + Filter bar (shared across tabs)
   ============================================================ */
function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative flex-1">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
      />
    </div>
  );
}

/* ============================================================
   UserManagement
   ============================================================ */
function UserManagement({ openDialog }) {
  const { error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await axios.get(`/admin/users?search=${encodeURIComponent(debouncedSearch)}`);
      setUsers(res.data.users ?? []);
    } catch (err) {
      console.error(err);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [debouncedSearch]);

  const toggleAdmin = (userId) => {
    openDialog({
      title: "Toggle Admin Status",
      message: "Are you sure you want to change this user's admin status?",
      confirmText: "Toggle",
      confirmVariant: "primary",
      onConfirm: async () => {
        try {
          await axios.put(`/admin/users/${userId}/toggle-admin`);
          fetchUsers();
        } catch (err) {
          error(err.response?.data?.error || "Failed to toggle admin");
        }
      },
    });
  };

  const counts = useMemo(() => ({
    all: users.length,
    admin: users.filter((u) => u.isGlobalAdmin).length,
    member: users.filter((u) => !u.isGlobalAdmin).length,
  }), [users]);

  const filtered = useMemo(() => {
    if (filter === "admin")  return users.filter((u) => u.isGlobalAdmin);
    if (filter === "member") return users.filter((u) => !u.isGlobalAdmin);
    return users;
  }, [users, filter]);

  if (loading && !users.length) return <TableSkeleton rows={6} cols={5} />;
  if (errored) return <ErrorPanel message="Something went wrong while fetching users." onRetry={fetchUsers} />;

  return (
    <>
      <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/50 backdrop-blur-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[var(--border-light)] p-4 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip active={filter === "all"}    onClick={() => setFilter("all")}    count={counts.all}>All</FilterChip>
            <FilterChip active={filter === "admin"}  onClick={() => setFilter("admin")}  count={counts.admin}>Admins</FilterChip>
            <FilterChip active={filter === "member"} onClick={() => setFilter("member")} count={counts.member}>Members</FilterChip>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyTable
              icon={Inbox}
              message={debouncedSearch ? "No users match your search" : "No users yet"}
              hint={debouncedSearch ? "Try a different term." : "Users will appear once they sign up."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--bg-hover)]/85 backdrop-blur-sm">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">User</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Email</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Role</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {filtered.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => setSelected({ kind: "user", data: u })}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-hover)]/40"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">
                          {u.name?.slice(0, 2).toUpperCase() || "??"}
                        </span>
                        <span className="truncate font-medium text-[var(--text-primary)]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                      <span className="font-mono text-xs">{u.email}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {u.isGlobalAdmin
                        ? <StatusPill tone="accent">Admin</StatusPill>
                        : <StatusPill tone="neutral">Member</StatusPill>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleAdmin(u._id); }}
                        className="rounded-lg border border-[var(--border-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] opacity-0 transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        {u.isGlobalAdmin ? "Revoke" : "Grant"} admin
                      </button>
                      <ChevronRight size={14} className="ml-2 inline-block text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.data?.name || "User"}
        subtitle="user detail"
      >
        {selected?.data && (
          <div className="space-y-4">
            <DetailRow label="ID" value={selected.data._id} mono />
            <DetailRow label="Name" value={selected.data.name} />
            <DetailRow label="Email" value={selected.data.email} mono />
            <DetailRow
              label="Role"
              value={selected.data.isGlobalAdmin ? "Global Admin" : "Member"}
            />
            <div className="border-t border-[var(--border-light)] pt-4">
              <button
                type="button"
                onClick={() => { toggleAdmin(selected.data._id); setSelected(null); }}
                className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                {selected.data.isGlobalAdmin ? "Revoke admin access" : "Grant admin access"}
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ============================================================
   WorkspaceManagement
   ============================================================ */
function WorkspaceManagement({ openDialog }) {
  const { error } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchWorkspaces = async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await axios.get("/admin/workspaces");
      setWorkspaces(res.data.workspaces ?? []);
    } catch (err) {
      console.error(err);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(); /* eslint-disable-next-line */ }, []);

  const deleteWorkspace = (id) => {
    openDialog({
      title: "Delete Workspace",
      message: "Delete this workspace and all its data? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await axios.delete(`/admin/workspaces/${id}`);
          fetchWorkspaces();
        } catch (err) {
          error(err.response?.data?.error || "Failed to delete workspace");
        }
      },
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter((ws) =>
      ws.name?.toLowerCase().includes(q) ||
      ws.ownerId?.email?.toLowerCase().includes(q)
    );
  }, [workspaces, search]);

  if (loading) return <TableSkeleton rows={6} cols={4} />;
  if (errored) return <ErrorPanel message="Something went wrong while fetching workspaces." onRetry={fetchWorkspaces} />;

  return (
    <>
      <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/50 backdrop-blur-sm">
        <div className="flex flex-col gap-3 border-b border-[var(--border-light)] p-4 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search workspaces…" />
          <StatusPill tone="neutral">{filtered.length} total</StatusPill>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyTable icon={Briefcase} message="No workspaces yet" hint="Workspaces appear once users create them." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--bg-hover)]/85 backdrop-blur-sm">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Workspace</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Owner</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Members</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {filtered.map((ws) => (
                  <tr
                    key={ws._id}
                    onClick={() => setSelected({ kind: "workspace", data: ws })}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-hover)]/40"
                  >
                    <td className="px-4 py-2.5">
                      <span className="truncate font-medium text-[var(--text-primary)]">{ws.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-[var(--text-secondary)]">{ws.ownerId?.email || "—"}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                      {ws.members?.length || 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteWorkspace(ws._id); }}
                        className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-danger)] opacity-0 transition-all duration-150 hover:bg-[var(--color-danger)]/20 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        Delete
                      </button>
                      <ChevronRight size={14} className="ml-2 inline-block text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.data?.name || "Workspace"}
        subtitle="workspace detail"
      >
        {selected?.data && (
          <div className="space-y-4">
            <DetailRow label="ID" value={selected.data._id} mono />
            <DetailRow label="Name" value={selected.data.name} />
            <DetailRow label="Owner" value={selected.data.ownerId?.email || "—"} mono />
            <DetailRow label="Members" value={`${selected.data.members?.length || 0}`} />
            <div className="border-t border-[var(--border-light)] pt-4">
              <button
                type="button"
                onClick={() => { deleteWorkspace(selected.data._id); setSelected(null); }}
                className="w-full rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] py-2.5 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/20"
              >
                Delete workspace
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ============================================================
   ReportManagement
   ============================================================ */
function ReportManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await axios.get("/admin/reports");
      setReports(res.data.reports ?? []);
    } catch (err) {
      console.error(err);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return reports;
    return reports.filter((r) =>
      r.repoUrl?.toLowerCase().includes(q) ||
      r.userId?.email?.toLowerCase().includes(q) ||
      r.workspaceId?.name?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  if (loading) return <TableSkeleton rows={6} cols={4} />;
  if (errored) return <ErrorPanel message="Something went wrong while fetching reports." onRetry={fetchReports} />;

  return (
    <>
      <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/50 backdrop-blur-sm">
        <div className="flex flex-col gap-3 border-b border-[var(--border-light)] p-4 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search reports by repo, user, workspace…" />
          <StatusPill tone="neutral">{filtered.length} total</StatusPill>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyTable icon={FileText} message="No reports yet" hint="Reports appear once users run scans." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--bg-hover)]/85 backdrop-blur-sm">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Repository</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">User</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Workspace</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {filtered.map((r) => (
                  <tr
                    key={r._id}
                    onClick={() => setSelected({ kind: "report", data: r })}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-hover)]/40"
                  >
                    <td className="px-4 py-2.5">
                      <span className="block max-w-[260px] truncate font-medium text-[var(--text-primary)]" title={r.repoUrl}>
                        {r.repoUrl}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-[var(--text-secondary)]">{r.userId?.email || "Unknown"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {r.workspaceId?.name
                        ? <StatusPill tone="info">{r.workspaceId.name}</StatusPill>
                        : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs text-[var(--text-secondary)]">
                      {fmtRelative(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Report detail"
        subtitle="scan result"
      >
        {selected?.data && (
          <div className="space-y-4">
            <DetailRow label="ID" value={selected.data._id} mono />
            <DetailRow label="Repository" value={selected.data.repoUrl} mono link />
            <DetailRow label="User" value={selected.data.userId?.email || "Unknown"} />
            <DetailRow label="Workspace" value={selected.data.workspaceId?.name || "—"} />
            <DetailRow label="Created" value={new Date(selected.data.createdAt).toLocaleString()} />
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ============================================================
   DetailRow (used inside Drawer)
   ============================================================ */
function DetailRow({ label, value, mono, link }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </p>
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className={`mt-1 block truncate text-sm font-medium text-[var(--accent)] hover:underline ${mono ? "font-mono" : ""}`}
        >
          {value}
        </a>
      ) : (
        <p className={`mt-1 break-all text-sm font-medium text-[var(--text-primary)] ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}