import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { usePreferences } from "../context/PreferencesContext";
import { gsap, ScrollTrigger, ScrollSmoother, useGSAP } from "../lib/gsap";
import {
  PRICING_PLANS,
  formatPrice,
  formatTokens,
} from "../components/PricingPlans";

// ============================================================
//  Color helpers
// ============================================================
function getCSSColor(varName, fallbackHex) {
  if (typeof window === "undefined") return fallbackHex;
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val || fallbackHex;
}

// ============================================================
//  TypedWord
// ============================================================
function TypedWord({ words }) {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[index];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < currentWord.length) {
            setDisplay((prev) => prev + currentWord[charIndex]);
            setCharIndex(charIndex + 1);
          } else {
            setIsDeleting(true);
          }
        } else {
          if (charIndex > 0) {
            setDisplay((prev) => prev.slice(0, -1));
            setCharIndex(charIndex - 1);
          } else {
            setIsDeleting(false);
            setIndex((i) => (i + 1) % words.length);
          }
        }
      },
      isDeleting ? 30 : 80,
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, index, words]);

  return (
    <span className="text-[var(--accent)]">
      {display}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-[var(--accent)]" />
    </span>
  );
}

// ============================================================
//  CodeVerityLogo
// ============================================================
function CodeVerityLogo() {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
      <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative text-[var(--accent)]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)]">
        <span className="text-[6px] font-bold text-[var(--accent)]">&lt;/&gt;</span>
      </div>
      <span className="absolute -top-0.5 -left-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
    </div>
  );
}

// ============================================================
//  MagneticWrap
// ============================================================
function MagneticWrap({ children, strength = 18, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo((relX / rect.width) * strength);
      yTo((relY / rect.height) * strength);
    };
    const handleLeave = () => { xTo(0); yTo(0); };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
//  RevealHeading
// ============================================================
function RevealHeading({ children, as: Tag = "h2", className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.clipPath = "inset(0 0 0 0)";
      el.style.opacity = 1;
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          gsap.fromTo(
            el,
            { clipPath: "inset(0 100% 0 0)", opacity: 0 },
            { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 0.9, ease: "power4.out" },
          );
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className} style={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}>
      {children}
    </Tag>
  );
}

// ============================================================
//  Feature card
// ============================================================
function Feature({ icon, title, desc, index }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--mx", `${x}%`);
    cardRef.current.style.setProperty("--my", `${y}%`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="feature-card group relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/40 p-6 backdrop-blur-sm transition-[border-color,background-color] duration-300 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)]/70"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), var(--accent-soft), transparent 45%)",
        }}
      />

      <div className="relative flex items-center justify-between">
        <span className="feature-icon inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          {icon}
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="relative mt-5 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="relative mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{desc}</p>

      <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-[var(--accent)] to-transparent transition-all duration-500 group-hover:w-full" />
    </div>
  );
}

// ============================================================
//  Icons
// ============================================================
function BugIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a8 8 0 0 0 8-8V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a8 8 0 0 0 8 8z" />
      <path d="M18 13h-2" /><path d="M8 13H6" /><path d="M10 4 8 2" />
      <path d="M14 4 16 2" /><path d="M12 22v-4" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function FlaskIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v7.527a2 2 0 0 1-.293 1.086L6.172 16.5a2 2 0 0 0-.276.922L6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l-.104-1.578a2 2 0 0 0-.276-.922l-3.535-5.887A2 2 0 0 1 14 9.527V2" />
      <path d="M8 2h8" />
    </svg>
  );
}

// ============================================================
//  StatPill
// ============================================================
function StatPill({ value, label, delayMs = 0 }) {
  const [display, setDisplay] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!hasStarted) return;
    setDisplay(0);
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) { setDisplay(value); return; }
    const isPct = String(value).includes("%");
    const isPlus = String(value).includes("+");
    const isLt = String(value).includes("<");
    const duration = 800;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(num * eased);
      let output = isPct ? `${current}%` : isPlus ? `${current}+` : isLt ? `<${current}s` : String(current);
      setDisplay(output);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, hasStarted]);

  return (
    <div className="stat-card relative flex min-w-[130px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[var(--accent)]/25 bg-[var(--bg-card)]/50 px-5 py-4 backdrop-blur-md">
      <span className="stat-number text-2xl font-extrabold tabular-nums">{display}</span>
      <span className="text-[10px] font-medium tracking-wide text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

// ============================================================
//  ScanLine / BranchGlyph / TechBadge
// ============================================================
function ScanLine() {
  return (
    <span className="absolute inset-0 z-0 overflow-hidden">
      <span className="animate-scanline absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent-contrast)] to-transparent opacity-40" />
    </span>
  );
}
function BranchGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v12" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}
function TechBadge({ label, mark }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/60 px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[var(--accent-soft)] font-mono text-[8px] font-bold text-[var(--accent)]">
        {mark}
      </span>
      {label}
    </span>
  );
}

// ============================================================
//  TechStrip
// ============================================================
function TechStrip() {
  const items = [
    { label: "GitHub", mark: <BranchGlyph /> },
    { label: "TypeScript", mark: "TS" },
    { label: "JavaScript", mark: "JS" },
    { label: "Python", mark: "Py" },
    { label: "Java", mark: "Jv" },
  ];
  return (
    <div className="mb-8 flex flex-col items-center gap-2.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Works with</p>
      <div className="marquee-mask relative w-full max-w-xs overflow-hidden sm:max-w-sm">
        <div className="marquee-track flex w-max gap-2">
          {[...items, ...items].map((item, i) => (
            <TechBadge key={`${item.label}-${i}`} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  HeroRepoInput
// ============================================================
function HeroRepoInput({ isAuthed }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const isValid = /^https:\/\/github\.com\/[^/]+\/[^/]+/.test(value.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    const target = isAuthed
      ? `/dashboard?repo=${encodeURIComponent(value.trim())}`
      : `/register?repo=${encodeURIComponent(value.trim())}`;
    navigate(target);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mb-6 w-full max-w-lg lg:mx-0">
      <div className={`flex overflow-hidden rounded-xl border bg-[var(--bg-card)]/70 backdrop-blur-md transition-all duration-200 ${touched && !isValid ? "border-[var(--color-danger)]/50" : "border-[var(--border-light)] focus-within:border-[var(--accent)]/60 focus-within:shadow-[0_0_24px_-6px_var(--accent-soft-strong)]"}`}>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--accent)]">$</span>
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); if (touched) setTouched(false); }}
            placeholder="https://github.com/username/repository"
            aria-label="GitHub repository URL"
            className="h-11 w-full bg-transparent pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:text-sm"
          />
        </div>
        <button type="submit" className="m-1 shrink-0 rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent-contrast)] transition-colors duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.98] sm:text-sm">
          Analyze →
        </button>
      </div>
      {touched && !isValid && (
        <p className="mt-1.5 text-[10px] text-[var(--color-danger)]">Enter a valid GitHub repository URL.</p>
      )}
    </form>
  );
}

// ============================================================
//  SampleReportModal
// ============================================================
function SampleReportModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--bg-primary)]/80 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Sample audit report">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-xl)]">
        <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Sample audit</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">expressjs/express</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">✕</button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="var(--border-light)" strokeWidth="3.5" />
                <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="var(--color-success)" strokeWidth="3.5" strokeDasharray="88,100" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">A</span>
            </div>
            <div className="flex-1 text-xs text-[var(--text-secondary)]">
              Well-structured middleware architecture with clear separation of concerns.
              Minor performance opportunities in route matching; no critical security issues found.
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[["Quality", 91], ["Security", 88], ["Perf", 82], ["Maint.", 90]].map(([label, val]) => (
              <div key={label} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-2 text-center">
                <p className="text-sm font-bold text-[var(--text-primary)]">{val}</p>
                <p className="text-[9px] text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 font-medium text-[var(--color-success)]">0 critical bugs</span>
            <span className="rounded-full bg-[var(--color-info-soft)] px-2.5 py-1 font-medium text-[var(--color-info)]">18 tests generated</span>
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent)]">3 suggestions</span>
          </div>
          <p className="text-center text-[10px] text-[var(--text-muted)]">This is a static preview. Run a real scan to see your own repository's audit.</p>
          <Link to="/register" onClick={onClose} className="block w-full rounded-lg bg-[var(--accent)] py-2.5 text-center text-sm font-semibold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)]">
            Scan your own repo →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  ComparisonSection
// ============================================================
function ComparisonSection() {
  const rows = [
    { label: "Understands intent, not just syntax", linter: false, verity: true },
    { label: "Generates working tests from your code", linter: false, verity: true },
    { label: "Explains findings in plain English", linter: false, verity: true },
    { label: "Catches style/formatting issues", linter: true, verity: true },
    { label: "Requires config files to set up", linter: true, verity: false },
  ];

  const rowRefs = useRef([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.idx);
            gsap.fromTo(
              entry.target,
              { opacity: 0, x: -20 },
              { opacity: 1, x: 0, duration: 0.5, ease: "power2.out", delay: idx * 0.06 },
            );
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    rowRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="comparison" className="border-t border-[var(--border-light)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">not just another linter</p>
        <RevealHeading className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Linters catch typos. CodeVerity catches problems.
        </RevealHeading>
        <p className="mb-10 max-w-2xl text-sm text-[var(--text-secondary)]">
          Static analyzers check syntax against rules. CodeVerity reads your code the way a senior
          engineer would — understanding architecture, intent, and risk, not just style violations.
        </p>
        <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
          <div className="grid grid-cols-[1fr_90px_90px] border-b border-[var(--border-light)] bg-[var(--bg-hover)]/50 px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] sm:grid-cols-[1fr_120px_120px] sm:px-5">
            <span />
            <span className="text-center">Linters</span>
            <span className="text-center text-[var(--accent)]">CodeVerity</span>
          </div>
          {rows.map((row, i) => (
            <div
              key={row.label}
              ref={(el) => (rowRefs.current[i] = el)}
              data-idx={i}
              className={`comparison-row grid grid-cols-[1fr_90px_90px] items-center px-4 py-3 text-xs text-[var(--text-secondary)] sm:grid-cols-[1fr_120px_120px] sm:px-5 sm:text-sm ${i !== rows.length - 1 ? "border-b border-[var(--border-light)]" : ""}`}
            >
              <span className="pr-2 text-[var(--text-primary)]">{row.label}</span>
              <span className="flex justify-center">
                {row.linter ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" /> : <span className="text-[var(--text-muted)]">—</span>}
              </span>
              <span className="flex justify-center">
                {row.verity ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : <span className="text-[var(--text-muted)]">—</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  CodeIntelligenceOrb
// ============================================================
function CodeIntelligenceOrb({ badgeRefs }) {
  const outerRef = useRef(null);
  const mountRef = useRef(null);
  const stateRef = useRef({ target: { x: 0, y: 0 } });
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldMount) return;
    const mount = mountRef.current;
    if (!mount) return;

    let cleanup = () => {};

    try {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const accentColor = new THREE.Color(getCSSColor("--accent", "#c084fc"));
      const secondaryColor = new THREE.Color(getCSSColor("--accent-secondary", "#818cf8"));

      let width = mount.clientWidth;
      let height = mount.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.z = 5.2;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.4));
      const coreLight = new THREE.PointLight(accentColor, 3.6, 8);
      coreLight.position.set(0, 0, 0);
      scene.add(coreLight);
      const rimLight = new THREE.PointLight(secondaryColor, 2.2, 6);
      rimLight.position.set(2, 2, 2);
      scene.add(rimLight);

      const group = new THREE.Group();
      scene.add(group);

      const shellGeo = new THREE.IcosahedronGeometry(1.7, 1);
      const shellEdges = new THREE.EdgesGeometry(shellGeo);
      const shellMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.5 });
      const shell = new THREE.LineSegments(shellEdges, shellMat);
      group.add(shell);

      const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);
      const coreMat = new THREE.MeshStandardMaterial({
        color: accentColor, emissive: accentColor, emissiveIntensity: 1.6,
        roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.75,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      const haloGeo = new THREE.RingGeometry(1.05, 1.15, 64);
      const haloMat = new THREE.MeshBasicMaterial({
        color: secondaryColor, side: THREE.DoubleSide, transparent: true, opacity: 0.35,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2.3;
      group.add(halo);

      const particleCount = 160;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 2.3 + Math.random() * 0.5;
        const y = (Math.random() - 0.5) * 0.6;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: secondaryColor, size: 0.038, transparent: true, opacity: 0.9, sizeAttenuation: true,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      particles.rotation.x = 0.45;
      scene.add(particles);

      let animationFrame;
      const render = () => renderer.render(scene, camera);

      const animate = () => {
        group.rotation.y += 0.0035;
        group.rotation.x += (stateRef.current.target.x - group.rotation.x) * 0.04;
        group.rotation.y += (stateRef.current.target.y - group.rotation.y) * 0.02;
        particles.rotation.y -= 0.0018;
        halo.rotation.z += 0.002;
        render();
        animationFrame = requestAnimationFrame(animate);
      };

      if (reduceMotion) {
        group.rotation.set(0.3, 0.6, 0);
        particles.rotation.x = 0.45;
        render();
      } else {
        animate();
      }

      const handleMouseMove = (e) => {
        const rect = mount.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        stateRef.current.target = { x: ny * 0.6, y: nx * 0.8 };
      };
      const handleMouseLeave = () => { stateRef.current.target = { x: 0, y: stateRef.current.target.y }; };

      if (!reduceMotion) {
        mount.addEventListener("mousemove", handleMouseMove);
        mount.addEventListener("mouseleave", handleMouseLeave);
      }

      const handleResize = () => {
        width = mount.clientWidth;
        height = mount.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        if (reduceMotion) render();
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(mount);

      cleanup = () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        mount.removeEventListener("mousemove", handleMouseMove);
        mount.removeEventListener("mouseleave", handleMouseLeave);
        shellGeo.dispose(); shellEdges.dispose(); shellMat.dispose();
        coreGeo.dispose(); coreMat.dispose();
        haloGeo.dispose(); haloMat.dispose();
        particleGeo.dispose(); particleMat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    } catch (err) {
      console.error("Orb render failed (likely WebGL unavailable):", err);
    }

    return cleanup;
  }, [shouldMount]);

  return (
    <div ref={outerRef} className="relative mx-auto w-full max-w-md" style={{ transformStyle: "preserve-3d" }}>
      <div ref={(el) => (badgeRefs.current[0] = el)} className="orb-badge absolute -top-4 -right-3 z-20 flex items-center gap-2 rounded-xl border border-[var(--color-danger)]/25 bg-[var(--bg-card)]/90 px-3.5 py-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22a8 8 0 0 0 8-8V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a8 8 0 0 0 8 8z" />
            <path d="M18 13h-2" /><path d="M8 13H6" /><path d="M10 4 8 2" />
            <path d="M14 4 16 2" /><path d="M12 22v-4" />
          </svg>
        </span>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Bugs found</p>
          <p className="font-mono text-sm font-bold text-[var(--text-primary)]">0 critical</p>
        </div>
      </div>

      <div ref={(el) => (badgeRefs.current[1] = el)} className="orb-badge absolute -bottom-5 -left-4 z-20 flex items-center gap-2.5 rounded-xl border border-[var(--accent)]/25 bg-[var(--bg-card)]/90 px-3.5 py-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="relative h-9 w-9 shrink-0">
          <svg viewBox="0 0 36 36" className="-rotate-90">
            <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="var(--border-light)" strokeWidth="4" />
            <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray="92,100" strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">A+</span>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Grade</p>
          <p className="font-mono text-xs font-semibold text-[var(--color-success)]">92 / 100</p>
        </div>
      </div>

      <div ref={(el) => (badgeRefs.current[2] = el)} className="orb-badge absolute top-2 left-2 z-10 hidden items-center gap-1.5 rounded-full border border-[var(--color-info)]/25 bg-[var(--bg-card)]/90 px-3 py-1.5 shadow-lg backdrop-blur-md sm:flex">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-info)]" />
        <span className="font-mono text-[10px] font-medium text-[var(--color-info)]">12 tests generated</span>
      </div>

      <div ref={mountRef} className="relative z-0 h-[340px] w-full sm:h-[380px]" />
    </div>
  );
}

// ============================================================
//  SectionDots
// ============================================================
function SectionDots({ sections, activeId, onJump }) {
  return (
    <div className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex" aria-label="Page sections">
      {sections.map((s) => {
        const isActive = activeId === s.id;
        return (
          <button key={s.id} onClick={() => onJump(s.id)} className="group relative flex items-center justify-end" aria-label={`Jump to ${s.label}`} aria-current={isActive ? "true" : undefined}>
            <span className="pointer-events-none absolute right-5 whitespace-nowrap rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] px-2 py-1 font-mono text-[9px] text-[var(--text-secondary)] opacity-0 shadow-[var(--shadow-md)] transition-opacity duration-150 group-hover:opacity-100">
              {s.label}
            </span>
            <span className={`rounded-full transition-all duration-300 ${isActive ? "h-6 w-1.5 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" : "h-1.5 w-1.5 bg-[var(--border-medium)] group-hover:bg-[var(--text-muted)]"}`} />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
//  BackToTop — NEW, purely additive. Fades in with the sticky
//  CTA once the hero has scrolled past, since a page this long
//  benefits from a quick way back up.
// ============================================================
function BackToTop({ visible, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Back to top"
      className={`fixed bottom-20 right-4 z-[55] flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card)]/95 text-[var(--text-secondary)] shadow-[var(--shadow-md)] backdrop-blur-md transition-all duration-300 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] sm:bottom-6 sm:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}

// ============================================================
//  HowItWorks
// ============================================================
function HowItWorks() {
  const steps = [
    { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>), title: "Paste your GitHub URL", desc: "Enter any public repository link. CodeVerity immediately reads the codebase structure." },
    { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>), title: "AI scans every file", desc: "Our engine examines architecture, dependencies, security, and potential bugs in seconds." },
    { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>), title: "Get actionable insights", desc: "Receive a clear report with test suggestions, vulnerability fixes, and performance tips." },
  ];

  const stepRefs = useRef([]);
  // NEW: ref for the scrubbed progress line, replacing the raw
  // document.createElement approach — same visual intent (a line
  // that fills in as you scroll through this section), now a real
  // JSX element with matching CSS so it actually renders, and no
  // risk of duplicating itself on effect re-runs.
  const progressLineRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.idx);
            gsap.fromTo(
              entry.target,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: idx * 0.15 },
            );
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="relative border-t border-[var(--border-light)] px-4 py-16 sm:px-6">
      <div ref={progressLineRef} className="how-progress-line" aria-hidden="true" />
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">the process</p>
        <div className="mb-10 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <RevealHeading className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">How it works</RevealHeading>
          <p className="text-sm text-[var(--text-secondary)]">Repository in, report out — three steps.</p>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              ref={(el) => (stepRefs.current[idx] = el)}
              data-idx={idx}
              className={`relative px-0 py-6 sm:px-6 sm:py-0 ${idx !== 0 ? "sm:border-l sm:border-[var(--border-light)]" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">{step.icon}</span>
                <span className="font-mono text-xs text-[var(--text-muted)]">0{idx + 1}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">{step.title}</h3>
              <p className="mt-1.5 max-w-[26ch] text-xs leading-relaxed text-[var(--text-secondary)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  Testimonials
// ============================================================
function Testimonials() {
  const testimonials = [
    { quote: "CodeVerity caught a critical security flaw our team overlooked. The generated tests saved us hours.", author: "Sarah Chen", role: "Lead Engineer, Finlytics" },
    { quote: "I use it before every PR. The bug detection is surprisingly accurate — it's like having a senior reviewer.", author: "Marcus Rivera", role: "Full-stack Developer, OpenSource Collective" },
    { quote: "We integrated it into our CI pipeline. Now every commit gets an instant AI audit. Game changer.", author: "Dr. Aisha Patel", role: "CTO, DevSafe" },
  ];

  const cardRefs = useRef([]);
  const [activeIdx, setActiveIdx] = useState(null);

  useEffect(() => {
    const observers = cardRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) setActiveIdx(i); },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <section id="testimonials" className="border-t border-[var(--border-light)] bg-[var(--bg-secondary)]/30 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">social proof</p>
        <RevealHeading className="mb-10 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Trusted by developers already shipping with it
        </RevealHeading>
        <div className="testimonial-grid grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              ref={(el) => (cardRefs.current[i] = el)}
              className={`testimonial-card flex flex-col rounded-xl border bg-[var(--bg-card)] p-6 transition-all duration-300 ${activeIdx === i ? "border-[var(--accent)]/50 shadow-[var(--shadow-lg)] md:-translate-y-1" : "border-[var(--border-light)]"}`}
            >
              <span className="mb-3 font-mono text-3xl leading-none text-[var(--accent)]">&ldquo;</span>
              <p className="flex-1 text-sm leading-relaxed text-[var(--text-primary)]">{t.quote}</p>
              <div className="mt-5 flex items-center gap-2.5 border-t border-[var(--border-light)] pt-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[var(--accent)]">
                  {t.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{t.author}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  Pricing
// ============================================================
function Pricing() {
  const plans = PRICING_PLANS;
  const cardsRef = useRef([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      gsap.set(card, { rotateY: i === 0 ? 20 : i === 2 ? -20 : 0, y: 30, opacity: 0 });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          cardsRef.current.forEach((card, i) => {
            if (!card) return;
            gsap.to(card, {
              rotateY: 0,
              y: 0,
              opacity: 1,
              duration: 1.1,
              ease: "power3.out",
              delay: i * 0.12,
            });
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    const first = cardsRef.current[0];
    if (first) observer.observe(first);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" className="border-t border-[var(--border-light)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl" style={{ perspective: "1400px" }}>
        <div className="mb-10 text-center">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">plans</p>
          <RevealHeading className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Simple, transparent pricing</RevealHeading>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">Start for free, upgrade as you grow.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((plan, idx) => {
            const price = plan.monthly.INR;
            const isFree = price === 0;
            const displayPrice = formatPrice(price, "INR");
            return (
              <div
                key={plan.id}
                ref={(el) => (cardsRef.current[idx] = el)}
                style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                className={`relative overflow-hidden rounded-xl border bg-[var(--bg-card)] p-6 text-left transition-all duration-200 ${plan.highlight ? "border-[var(--accent)]" : "border-[var(--border-light)] hover:border-[var(--accent)]/30"}`}
              >
                {plan.highlight && <span className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
                  {plan.highlight && <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-semibold text-[var(--accent)]">Most popular</span>}
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-3xl font-extrabold text-[var(--text-primary)]">{displayPrice}</span>
                  {!isFree && <span className="ml-1 text-sm text-[var(--text-muted)]">/mo</span>}
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)]">
                    {formatTokens(plan.tokensPerMonth)} tokens / mo
                  </span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-[var(--text-secondary)]">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <svg className="mt-0.5 h-3 w-3 shrink-0 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={isFree ? "/register" : `/checkout?plan=${plan.id}&cycle=monthly&currency=INR`}
                  className={`mt-6 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 ${plan.highlight ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]" : "border border-[var(--border-light)] text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-[10px] text-[var(--text-muted)]">All prices in INR. Yearly plans offer 20% off — see full pricing page.</p>
      </div>
    </section>
  );
}

// ============================================================
//  FAQ
// ============================================================
function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    { q: "What types of repositories does CodeVerity support?", a: "Currently we support public GitHub repositories written in JavaScript, TypeScript, Python, and Java. More languages coming soon." },
    { q: "Is my code stored or shared?", a: "No. CodeVerity processes your repository in memory and never stores any source code. All analysis is temporary and encrypted." },
    { q: "Can I use CodeVerity for private repositories?", a: "Yes, with the Pro or Enterprise plan you can scan private repositories with full OAuth security." },
    { q: "How accurate is the AI bug detection?", a: "Our models are trained on millions of open-source fixes and achieve over 98% accuracy on common bug patterns, with continuous improvement." },
    { q: "How is this different from ESLint or SonarQube?", a: "Linters check syntax against fixed rules. CodeVerity reads the code the way a senior engineer would — understanding architecture and intent, not just style violations — and explains findings in plain English instead of rule IDs." },
    { q: "Do I need to configure anything before my first scan?", a: "No setup required. Paste a public GitHub URL and CodeVerity analyzes it immediately — no config files, no CI pipeline changes." },
  ];
  const toggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section id="faq" className="border-t border-[var(--border-light)] bg-[var(--bg-secondary)]/30 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">questions</p>
        <RevealHeading as="h2" className="mb-10 block text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Frequently asked questions
        </RevealHeading>
        <div className="mx-auto max-w-3xl divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
          {faqs.map((faq, idx) => (
            <div key={idx}>
              <button onClick={() => toggle(idx)} className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-150 hover:bg-[var(--bg-hover)]/50">
                <span className="text-sm font-medium text-[var(--text-primary)]">{faq.q}</span>
                <span className={`ml-4 shrink-0 font-mono text-lg text-[var(--accent)] transition-transform duration-200 ${openIndex === idx ? "rotate-45" : ""}`}>+</span>
              </button>
              {openIndex === idx && (
                <div className="px-4 pb-4 text-xs leading-relaxed text-[var(--text-secondary)]">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  Footer
// ============================================================
function Footer({ isLoggedIn }) {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-light)] bg-[var(--accent)] px-4 pt-16 pb-8 sm:px-6">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-2xl font-extrabold leading-tight text-[var(--accent-contrast)] sm:text-3xl">AI-powered code<br />intelligence.</h3>
            <p className="mt-3 max-w-[220px] text-[12px] leading-relaxed text-[var(--accent-contrast)]/70">One repo. Every insight. Built by developers who care about quality.</p>
          </div>
          <div>
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-contrast)]/60">Product</h4>
            <ul className="space-y-2">
              {isLoggedIn ? (
                <>
                  <li><Link to="/dashboard" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Dashboard</Link></li>
                  <li><Link to="/workspace" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Workspace</Link></li>
                  <li><Link to="/history" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">History</Link></li>
                  <li><Link to="/pricing" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Pricing</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/pricing" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Pricing</Link></li>
                  <li><Link to="/login" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Sign In</Link></li>
                  <li><Link to="/register" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Get Started</Link></li>
                  <li><Link to="/about" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">About</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-contrast)]/60">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">About</Link></li>
              <li><Link to="/support" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Support</Link></li>
              <li><Link to="/privacy" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Privacy</Link></li>
              {/* FIXED: was `hover:text([var(--accent-contrast)]` — malformed
                  arbitrary-value class (missing "!" and "-"), meaning this
                  link's hover color never applied. Now matches every other
                  footer link's pattern. */}
              <li><Link to="/terms" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-contrast)]/60">Company</h4>
            <ul className="space-y-2">
              <li><a href="mailto:support@codeverity.dev" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Contact</a></li>
              <li><Link to="/about" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">About Us</Link></li>
              <li><span className="text-[12px] text-[var(--accent-contrast)]/60">© {new Date().getFullYear()}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--accent-contrast)]/15 pt-6 sm:flex-row">
          <p className="text-[10px] text-[var(--accent-contrast)]/60">Built with ❤️ for developers everywhere.</p>
          <div className="flex items-center gap-4 text-[10px] text-[var(--accent-contrast)]/70">
            <Link to="/privacy" className="transition hover:text-[var(--accent-contrast)]">Privacy</Link>
            <Link to="/terms" className="transition hover:text-[var(--accent-contrast)]">Terms</Link>
            <Link to="/support" className="transition hover:text-[var(--accent-contrast)]">Support</Link>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-16 flex select-none flex-col items-center gap-4">
        <div className="rounded-2xl bg-[var(--bg-primary)] p-1 shadow-2xl ring-1 ring-[var(--accent-contrast)]/20">
          <CodeVerityLogo />
        </div>
        <div className="pointer-events-none w-full overflow-hidden text-center" style={{ maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)" }}>
          <span className="block whitespace-nowrap font-extrabold leading-none tracking-tight text-[var(--accent-contrast)]/10" style={{ fontSize: "clamp(3.5rem, 15vw, 10rem)" }}>
            CodeVerity
          </span>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
//  HOME
// ============================================================
export default function Home() {
  const token = localStorage.getItem("token");
  const { compact } = usePreferences();

  const [stats, setStats] = useState({ totalScans: 0, avgQuality: 0, avgTime: "0s" });
  const [statsLoading, setStatsLoading] = useState(true);
  const [showSampleModal, setShowSampleModal] = useState(false);
  // NEW: drives BackToTop visibility, reusing the same "past hero"
  // boundary the sticky CTA already tracks.
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/stats/public`);
        const text = await res.text();
        if (!res.ok) throw new Error(`Stats API failed: ${res.status}`);
        if (!text.trim()) throw new Error("Stats API returned an empty response");
        const data = JSON.parse(text);
        if (data.success) {
          setStats({
            totalScans: data.stats.totalScans ?? 0,
            avgQuality: data.stats.avgQuality ?? 0,
            avgTime: data.stats.avgTime || "< 2 min",
          });
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const containerRef = useRef(null);
  const heroSectionRef = useRef(null);
  const brandRef = useRef(null);
  const badgeRef = useRef(null);
  const headingRef = useRef(null);
  const typedRef = useRef(null);
  const descriptionRef = useRef(null);
  const ctasRef = useRef(null);
  const trustRef = useRef(null);
  const statsRef = useRef(null);
  const featureLabelRef = useRef(null);
  const featureGridRef = useRef(null);
  const featureCardsRef = useRef([]);
  const bgGlow1Ref = useRef(null);
  const bgGlow2Ref = useRef(null);
  const bgGridRef = useRef(null);

  const howRef = useRef(null);
  const comparisonRef = useRef(null);
  const testimonialRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);

  const orbPerspectiveRef = useRef(null);
  const orbTiltRef = useRef(null);
  const orbBadgeRefs = useRef([]);

  const progressRef = useRef(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [statsReplayKey, setStatsReplayKey] = useState(0);
  const statsInViewRef = useRef(false);

  const SECTIONS = [
    { id: "hero", label: "Top" },
    { id: "how-it-works", label: "How it works" },
    { id: "testimonials", label: "Testimonials" },
    { id: "pricing", label: "Pricing" },
    { id: "faq", label: "FAQ" },
  ];
  const [activeSection, setActiveSection] = useState("hero");

  const jumpToSection = (id) => {
    const el = document.getElementById(id) || containerRef.current;
    if (!el) return;

    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(el, true, "top 90px");
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(0, true);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        /* ---------- Progress bar ---------- */
        if (progressRef.current) {
          gsap.set(progressRef.current, { scaleX: 0 });
          const setProgress = gsap.quickTo(progressRef.current, "scaleX", { duration: 0.25, ease: "power2.out" });
          ScrollTrigger.create({
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => setProgress(self.progress),
          });
        }

        /* ---------- Active section tracking ---------- */
        SECTIONS.forEach(({ id }) => {
          const el = document.getElementById(id);
          if (!el) return;
          ScrollTrigger.create({
            trigger: el,
            start: "top center",
            end: "bottom center",
            onEnter: () => setActiveSection(id),
            onEnterBack: () => setActiveSection(id),
          });
        });

        /* ---------- Sticky CTA + back-to-top ---------- */
        if (heroSectionRef.current) {
          ScrollTrigger.create({
            trigger: heroSectionRef.current,
            start: "bottom top",
            onEnter: () => { setShowStickyCta(true); setShowBackToTop(true); },
            onLeaveBack: () => { setShowStickyCta(false); setShowBackToTop(false); },
          });
        }

        /* ---------- Stats replay ---------- */
        if (statsRef.current) {
          ScrollTrigger.create({
            trigger: statsRef.current,
            start: "top 90%",
            onEnter: () => {
              if (!statsInViewRef.current) { statsInViewRef.current = true; setStatsReplayKey((k) => k + 1); }
            },
            onLeave: () => { statsInViewRef.current = false; },
            onEnterBack: () => {
              if (!statsInViewRef.current) { statsInViewRef.current = true; setStatsReplayKey((k) => k + 1); }
            },
            onLeaveBack: () => { statsInViewRef.current = false; },
          });
        }

        /* ---------- Hero intro timeline ---------- */
        const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });
        tl.fromTo(brandRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 })
          .fromTo(badgeRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
          .fromTo(headingRef.current, { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, "-=0.3")
          .fromTo(typedRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
          .fromTo(descriptionRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
          .fromTo(ctasRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, "-=0.3")
          .fromTo(trustRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2");

        if (statsRef.current) {
          gsap.fromTo(statsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.5 });
        }

        /* ---------- Orb entrance ---------- */
        if (orbTiltRef.current && orbPerspectiveRef.current) {
          gsap.set(orbTiltRef.current, {
            rotateY: -18,
            rotateX: 8,
            scale: 0.94,
            transformPerspective: 1200,
          });

          ScrollTrigger.create({
            trigger: orbPerspectiveRef.current,
            start: "top 90%",
            once: true,
            onEnter: () => {
              gsap.to(orbTiltRef.current, {
                rotateY: 0,
                rotateX: 0,
                scale: 1,
                duration: 1.4,
                ease: "power3.out",
              });
            },
          });

          gsap.to(orbTiltRef.current, {
            y: "+=10",
            duration: 3.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1.5,
          });
        }

        /* ---------- Feature label ---------- */
        if (featureLabelRef.current) {
          ScrollTrigger.create({
            trigger: featureLabelRef.current,
            start: "top 85%",
            onEnter: () => {
              gsap.fromTo(
                featureLabelRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
              );
            },
            once: true,
          });
        }

        /* ---------- Feature cards cover-flow ---------- */
        if (featureGridRef.current && featureCardsRef.current.length) {
          const cards = featureCardsRef.current.filter(Boolean);
          const isMobileFlow = window.matchMedia("(max-width: 639px)").matches;

          if (isMobileFlow) {
            cards.forEach((card, idx) => {
              gsap.fromTo(
                card,
                { opacity: 0, y: 24 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.6,
                  ease: "power2.out",
                  delay: idx * 0.1,
                  scrollTrigger: {
                    trigger: card,
                    start: "top 90%",
                    toggleActions: "play none none reverse",
                  },
                },
              );
            });
          } else {
            const coverFlowPoses = [
              { rotateY: 26, rotateX: -6, z: -140, scale: 0.92 },
              { rotateY: 0, rotateX: -3, z: 90, scale: 1.04 },
              { rotateY: -26, rotateX: -6, z: -140, scale: 0.92 },
            ];
            const deepSpaceStates = [
              { rotateY: 55, rotateX: -14, z: -500 },
              { rotateY: 0, rotateX: -18, z: -620 },
              { rotateY: -55, rotateX: -14, z: -500 },
            ];

            const flowTl = gsap.timeline({
              defaults: { ease: "power2.inOut" },
              scrollTrigger: {
                trigger: featureGridRef.current,
                start: "top 92%",
                end: "bottom 25%",
                scrub: 1,
              },
            });

            cards.forEach((card, idx) => {
              flowTl.fromTo(
                card,
                { ...deepSpaceStates[idx], opacity: 0 },
                { opacity: 1, ...coverFlowPoses[idx], duration: 1.1 },
                idx * 0.12,
              );
            });

            flowTl.to(
              cards,
              {
                y: (idx) => -18 - idx * 7,
                rotateX: "-=2",
                duration: 0.8,
                stagger: 0.05,
                ease: "none",
              },
              ">-0.05",
            );
          }
        }

        /* ---------- Feature card hover: 3D lift + icon spin ---------- */
        featureCardsRef.current.forEach((el) => {
          if (!el) return;
          const card = el.querySelector(".feature-card");
          const icon = el.querySelector(".feature-icon");
          if (!card) return;

          const onEnter = () => {
            gsap.to(card, { y: -6, duration: 0.35, ease: "power2.out" });
            if (icon) gsap.to(icon, { rotate: -6, scale: 1.08, duration: 0.4, ease: "back.out(2)" });
          };
          const onLeave = () => {
            gsap.to(card, { y: 0, duration: 0.35, ease: "power2.out" });
            if (icon) gsap.to(icon, { rotate: 0, scale: 1, duration: 0.4, ease: "power2.out" });
          };
          el.addEventListener("mouseenter", onEnter);
          el.addEventListener("mouseleave", onLeave);
          el._cleanup = () => {
            el.removeEventListener("mouseenter", onEnter);
            el.removeEventListener("mouseleave", onLeave);
          };
        });

        /* ---------- Section fade-ins ---------- */
        const sections = [
          { ref: howRef, start: "top 85%" },
          { ref: comparisonRef, start: "top 85%" },
          { ref: testimonialRef, start: "top 85%" },
          { ref: pricingRef, start: "top 85%" },
          { ref: faqRef, start: "top 85%" },
        ];
        sections.forEach(({ ref, start }) => {
          if (!ref.current) return;
          ScrollTrigger.create({
            trigger: ref.current,
            start,
            onEnter: () => {
              gsap.fromTo(
                ref.current,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", clearProps: "opacity, transform" },
              );
            },
            once: true,
          });
        });

        /* ---------- Parallax glows ---------- */
        const bgGlow1 = bgGlow1Ref.current;
        const bgGlow2 = bgGlow2Ref.current;
        const bgGrid = bgGridRef.current;

        if (bgGlow1) {
          const setY1 = gsap.quickTo(bgGlow1, "y", { duration: 0.3, ease: "power1.out" });
          ScrollTrigger.create({ trigger: containerRef.current, start: "top top", end: "bottom top", onUpdate: (self) => setY1(self.progress * 200) });
        }
        if (bgGlow2) {
          const setY2 = gsap.quickTo(bgGlow2, "y", { duration: 0.3, ease: "power1.out" });
          ScrollTrigger.create({ trigger: containerRef.current, start: "top top", end: "bottom top", onUpdate: (self) => setY2(-self.progress * 150) });
        }
        if (bgGrid) {
          const setY3 = gsap.quickTo(bgGrid, "y", { duration: 0.3, ease: "power1.out" });
          ScrollTrigger.create({ trigger: containerRef.current, start: "top top", end: "bottom top", onUpdate: (self) => setY3(self.progress * 50) });
        }

        /* ---------- Orb badges ---------- */
        const animateBadges = () => {
          const badges = orbBadgeRefs.current.filter(Boolean);
          if (!badges.length) return;

          gsap.fromTo(
            badges,
            { opacity: 0, scale: 0.85, y: 12 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.15,
              ease: "back.out(1.6)",
              delay: 0.4,
            },
          );

          badges.forEach((el, i) => {
            gsap.to(el, {
              y: "+=8",
              duration: 3 + i * 0.6,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: 1.5 + i * 0.4,
            });
          });
        };
        requestAnimationFrame(animateBadges);

        /* ═══════════════════════════════════════════════════
           MODERN POLISH LAYER
           ═══════════════════════════════════════════════════ */

        /* ---------- How-it-works scrubbed progress line ---------- */
        const howProgressLine = howRef.current?.querySelector(".how-progress-line");
        if (howProgressLine) {
          gsap.fromTo(
            howProgressLine,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: howRef.current,
                start: "top 70%",
                end: "bottom 60%",
                scrub: true,
              },
            },
          );
        }

        /* ---------- Section heading parallax drift ---------- */
        gsap.utils.toArray("section h2").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 12 },
            {
              y: -12,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        });

        /* ---------- Testimonial cards blur + stagger reveal ---------- */
        if (testimonialRef.current) {
          const cards = testimonialRef.current.querySelectorAll(".testimonial-card");
          if (cards.length) {
            gsap.fromTo(
              cards,
              { opacity: 0, y: 40, filter: "blur(8px)" },
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.8,
                stagger: 0.12,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: testimonialRef.current,
                  start: "top 75%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          }
        }

        /* ---------- Pricing cards subtle lift on scroll ---------- */
        if (pricingRef.current) {
          const cards = pricingRef.current.querySelectorAll(".grid > div");
          if (cards.length) {
            gsap.fromTo(
              cards,
              { y: 24 },
              {
                y: 0,
                duration: 0.9,
                stagger: 0.1,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: pricingRef.current,
                  start: "top 80%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          }
        }

        /* ---------- FAQ rows cascading reveal ---------- */
        if (faqRef.current) {
          const rows = faqRef.current.querySelectorAll("button");
          if (rows.length) {
            gsap.fromTo(
              rows,
              { opacity: 0, x: -12 },
              {
                opacity: 1,
                x: 0,
                duration: 0.45,
                stagger: 0.05,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: faqRef.current,
                  start: "top 80%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          }
        }

        /* ---------- Comparison rows: subtle accent-line on scroll ---------- */
        if (comparisonRef.current) {
          const rows = comparisonRef.current.querySelectorAll(".comparison-row");
          rows.forEach((row) => {
            row.addEventListener("mouseenter", () => {
              gsap.to(row, { backgroundColor: "var(--accent-soft)", duration: 0.25 });
            });
            row.addEventListener("mouseleave", () => {
              gsap.to(row, { backgroundColor: "transparent", duration: 0.25 });
            });
          });
        }

        return () => {
          ScrollTrigger.getAll().forEach((st) => st.kill());
          featureCardsRef.current.forEach((el) => el?._cleanup?.());
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [
            brandRef.current, badgeRef.current, headingRef.current, typedRef.current,
            descriptionRef.current, ctasRef.current, trustRef.current, statsRef.current,
            featureLabelRef.current, featureCardsRef.current, howRef.current, comparisonRef.current,
            testimonialRef.current, pricingRef.current, faqRef.current,
            orbTiltRef.current, ...(orbBadgeRefs.current || []),
          ].filter(Boolean),
          { opacity: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1, clearProps: "all" },
        );
        setShowStickyCta(false);
        setShowBackToTop(false);
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [] },
  );

  const compactClasses = compact
    ? {
        container: "pt-32 pb-8",
        heading: "text-3xl sm:text-4xl md:text-[3rem]",
        subheading: "text-base sm:text-lg",
        description: "text-xs sm:text-sm",
        brandMargin: "mb-4",
        badgeMargin: "mb-3",
        ctaMargin: "mb-5",
        statsMargin: "mb-6",
        featureGap: "gap-x-6 gap-y-8",
      }
    : {
        container: "pt-28 pb-16",
        heading: "text-4xl sm:text-5xl md:text-[3.6rem]",
        subheading: "text-lg sm:text-xl",
        description: "text-sm sm:text-base",
        brandMargin: "mb-6",
        badgeMargin: "mb-5",
        ctaMargin: "mb-7",
        statsMargin: "mb-10",
        featureGap: "gap-x-8 gap-y-10",
      };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-transparent px-4 text-[var(--text-primary)] sm:px-6">
      <div ref={progressRef} className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-[var(--accent)]" style={{ transform: "scaleX(0)" }} aria-hidden="true" />

      <SectionDots sections={SECTIONS} activeId={activeSection} onJump={jumpToSection} />

      <BackToTop visible={showBackToTop} onClick={scrollToTop} />

      {showSampleModal && <SampleReportModal onClose={() => setShowSampleModal(false)} />}

      <div
        className={`fixed bottom-0 left-0 right-0 z-[55] flex items-center justify-between gap-3 border-t border-[var(--border-light)] bg-[var(--bg-card)]/95 px-4 py-3 backdrop-blur-md transition-all duration-300 sm:px-6 ${showStickyCta ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}`}
      >
        <div className="flex items-center gap-2">
          <div className="hidden h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] sm:flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-contrast)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span className="text-xs font-medium text-[var(--text-primary)] sm:text-sm">Ready to audit your repository?</span>
        </div>
        <Link to={token ? "/dashboard" : "/register"} className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]">
          {token ? "Open Dashboard" : "Get Started Free"}
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .stat-card { box-shadow: 0 0 20px -5px var(--accent-soft-strong), inset 0 0 10px var(--accent-soft); }
        .stat-card:hover { box-shadow: 0 0 30px -5px var(--accent), inset 0 0 15px var(--accent-soft-strong); border-color: var(--accent); }
        .stat-number {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; color: transparent;
          filter: drop-shadow(0 0 8px var(--accent-soft-strong));
        }
        .hero-title-glow {
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 50%, var(--text-primary) 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; color: transparent;
          filter: drop-shadow(0 0 20px var(--accent-soft-strong));
          animation: gradient-shift 5s ease infinite;
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; }
        }
        .marquee-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
          mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
        }
        .marquee-track {
          animation: marquee-scroll 18s linear infinite;
        }
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .feature-card { will-change: transform; }
        .testimonial-card { will-change: transform, opacity, filter; }
        /* NEW: real CSS for the how-it-works scrubbed progress line —
           previously created via document.createElement with no
           matching styles, so it rendered as an invisible 0x0 div.
           Sits as a thin bar under the section's top border, filling
           left-to-right as you scroll through the section. */
        .how-progress-line {
          position: absolute;
          top: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, var(--accent), var(--accent-secondary, var(--accent)));
          transform-origin: left center;
          transform: scaleX(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}} />

      <div ref={bgGlow1Ref} className="pointer-events-none absolute left-1/2 top-[25%] h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-soft)] opacity-70 blur-3xl" />
      <div ref={bgGlow2Ref} className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
      <div ref={bgGridRef} className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div id="hero" ref={heroSectionRef} className={`relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center ${compactClasses.container}`}>
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <div ref={brandRef} className={`flex items-center justify-center gap-3 lg:justify-start ${compactClasses.brandMargin}`}>
              <CodeVerityLogo />
              <div className="text-left">
                <p className="text-[12px] font-bold tracking-[0.22em] text-[var(--text-primary)]">CodeVerity</p>
                <p className="mt-0.5 text-[9px] text-[var(--text-secondary)]">AI-powered repository intelligence</p>
              </div>
            </div>

            <div ref={badgeRef} className={`inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)]/60 px-3.5 py-1.5 text-[10px] font-medium tracking-wide text-[var(--text-secondary)] backdrop-blur-xl ${compactClasses.badgeMargin}`}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
              AI-powered GitHub code analysis
            </div>

            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] lg:text-left">
              understand your code, instantly
            </p>

            <h1 ref={headingRef} className={`mb-3 font-extrabold leading-[1.05] tracking-tight ${compactClasses.heading}`}>
              <span className="hero-title-glow">CodeVerity</span>
            </h1>

            <p ref={typedRef} className={`mb-5 h-8 font-medium ${compactClasses.subheading}`}>
              <TypedWord words={["Finds your bugs.", "Flags vulnerabilities.", "Generates tests.", "Ships confidence."]} />
            </p>

            <p ref={descriptionRef} className={`mx-auto mb-6 max-w-2xl leading-relaxed text-[var(--text-secondary)] lg:mx-0 ${compactClasses.description}`}>
              Drop any public GitHub URL and get a complete AI-powered repository audit — architecture analysis, security findings, bug detection, performance insights, and generated tests.
            </p>

            <HeroRepoInput isAuthed={!!token} />

            <div ref={ctasRef} className={`flex flex-wrap justify-center gap-3 lg:justify-start ${compactClasses.ctaMargin}`}>
              {token ? (
                <MagneticWrap>
                  <Link to="/dashboard" className="group relative overflow-hidden rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition-colors duration-200 hover:bg-[var(--accent-hover)]" style={{ boxShadow: "0 0 30px var(--accent-soft-strong)" }}>
                    <ScanLine />
                    <span className="relative z-10">Open Dashboard →</span>
                  </Link>
                </MagneticWrap>
              ) : (
                <MagneticWrap>
                  <Link to="/register" className="group relative overflow-hidden rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition-colors duration-200 hover:bg-[var(--accent-hover)]" style={{ boxShadow: "0 8px 24px -6px var(--accent-soft-strong)" }}>
                    <ScanLine />
                    <span className="relative z-10">Get Started Free →</span>
                  </Link>
                </MagneticWrap>
              )}
              <MagneticWrap strength={14}>
                <button
                  onClick={() => setShowSampleModal(true)}
                  className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/75 px-7 py-3 text-sm font-semibold text-[var(--text-primary)] backdrop-blur-sm transition-colors duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
                >
                  See a sample audit
                </button>
              </MagneticWrap>
            </div>

            <div ref={trustRef} className="flex items-center justify-center gap-2 text-[9px] text-[var(--text-muted)] lg:justify-start">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              No credit card required
              <span>•</span>
              Works with public GitHub repositories
            </div>
          </div>

          <div ref={orbPerspectiveRef} className="mx-auto w-full max-w-md lg:mx-0" style={{ perspective: "1400px" }}>
            <div ref={orbTiltRef} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
              <CodeIntelligenceOrb badgeRefs={orbBadgeRefs} />
            </div>
          </div>
        </div>

        <div className="mt-14 w-full max-w-6xl text-center">
          <TechStrip />

          <div ref={statsRef} className={`mx-auto flex w-fit flex-wrap justify-center gap-4 ${compactClasses.statsMargin}`}>
            <StatPill key={`scans-${statsReplayKey}`} value={statsLoading ? "..." : `${stats.totalScans}+`} label="Repos Scanned" delayMs={200} />
            <StatPill key={`quality-${statsReplayKey}`} value={statsLoading ? "..." : `${stats.avgQuality}%`} label="Issue Accuracy" delayMs={300} />
            <StatPill key={`time-${statsReplayKey}`} value={statsLoading ? "..." : stats.avgTime} label="Avg Audit Time" delayMs={400} />
          </div>

          <div ref={featureLabelRef} className="mb-6 text-left">
            <p className="text-sm font-semibold text-[var(--text-primary)]">What CodeVerity checks</p>
          </div>

          <div
            ref={featureGridRef}
            className={`grid grid-cols-1 ${compactClasses.featureGap} sm:grid-cols-3`}
            style={{ perspective: "1400px", perspectiveOrigin: "center 40%" }}
          >
            <div
              ref={(el) => (featureCardsRef.current[0] = el)}
              style={{ transformStyle: "preserve-3d", willChange: "transform" }}
            >
              <Feature icon={<BugIcon />} title="AI Bug Detection" desc="Pinpoints logic errors, edge cases, and anti-patterns across your entire codebase." index={0} />
            </div>
            <div
              ref={(el) => (featureCardsRef.current[1] = el)}
              style={{ transformStyle: "preserve-3d", willChange: "transform" }}
            >
              <Feature icon={<ShieldIcon />} title="Security Analysis" desc="Scans for OWASP vulnerabilities, exposed secrets, and injection risks instantly." index={1} />
            </div>
            <div
              ref={(el) => (featureCardsRef.current[2] = el)}
              style={{ transformStyle: "preserve-3d", willChange: "transform" }}
            >
              <Feature icon={<FlaskIcon />} title="Smart Test Generation" desc="Creates useful test cases from your repository to help verify fixes and prevent regressions." index={2} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div ref={howRef}><HowItWorks /></div>
        <div ref={comparisonRef}><ComparisonSection /></div>
        <div ref={testimonialRef}><Testimonials /></div>
        <div ref={pricingRef}><Pricing /></div>
        <div ref={faqRef}><FAQ /></div>
        <Footer isLoggedIn={!!token} />
      </div>
    </div>
  );
}
