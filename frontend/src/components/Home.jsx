import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { usePreferences } from "../context/PreferencesContext";

/* =========================================================
   PARTICLE FIELD – indigo theme
========================================================= */

function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.35 + 0.08,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.o})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

/* =========================================================
   TYPED WORD – flat accent color (no gradient text fill)
========================================================= */

function TypedWord({ words }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const word = words[index % words.length];
    const speed = del ? 38 : 85;

    if (!del && text === word) {
      const t = setTimeout(() => setDel(true), 1600);
      return () => clearTimeout(t);
    }
    if (del && text === "") {
      setDel(false);
      setIndex((i) => i + 1);
      return;
    }
    const t = setTimeout(() => {
      setText(del ? text.slice(0, -1) : word.slice(0, text.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [text, del, index, words]);

  return (
    <span className="text-[var(--accent)]">
      {text}
      <span className="text-[var(--accent)] animate-pulse">|</span>
    </span>
  );
}

/* =========================================================
   CODEVERITY LOGO – flat accent tile, no gradient
========================================================= */

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] animate-float"
        style={{ boxShadow: "0 8px 24px rgba(99,102,241,0.25)" }}
      >
        <div className="absolute inset-[1px] rounded-[11px] bg-[var(--bg-primary)]" />
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative text-[var(--accent)]"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-md bg-[var(--bg-secondary)] border border-[var(--border-light)]">
          <span className="text-[6px] font-bold text-[var(--accent)]">&lt;/&gt;</span>
        </div>
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)] animate-ping" />
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE CARD – indigo theme, with entrance animation
========================================================= */

function Feature({ icon, title, desc, delay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative cursor-default overflow-hidden rounded-xl p-5 text-left transition-all duration-300 ease-out"
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hovered ? "rgba(99,102,241,0.40)" : "var(--border-light)"}`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 20px 40px rgba(99,102,241,0.10)" : "none",
        animation: `fadeUp 0.6s ${delay} ease both`,
      }}
    >
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity duration-500"
        style={{
          background: "rgba(99,102,241,0.10)",
          opacity: hovered ? 0.65 : 0,
        }}
      />
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] transition-transform duration-300"
        style={{
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        {icon}
      </div>
      <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">{desc}</p>
    </div>
  );
}

/* =========================================================
   FEATURE ICONS
========================================================= */

function BugIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="7" width="8" height="12" rx="4" />
      <path d="M12 7V4M9 4h6M5 11H2M22 11h-3M5 17H3M21 17h-2M8 9 6 7M16 9l2-2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3" />
      <path d="M7.5 15h9" />
    </svg>
  );
}

/* =========================================================
   STAT PILL – indigo theme, hover scale + count-up on mount
========================================================= */

function StatPill({ value, label, delayMs = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [display, setDisplay] = useState(value);

  // Count up from 0 to the target number on mount (e.g. "100+" counts
  // 0→100 then appends the "+"). Purely cosmetic — falls back to the
  // static value immediately if the browser prefers reduced motion.
  useEffect(() => {
    const match = value.match(/\d+/);
    if (!match) {
      setDisplay(value);
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    const target = parseInt(match[0], 10);
    const prefix = value.slice(0, match.index);
    const suffix = value.slice(match.index + match[0].length);
    const duration = 900;
    let start;
    let raf;

    setDisplay(`${prefix}0${suffix}`);

    const startTimer = setTimeout(() => {
      const step = (ts) => {
        if (start === undefined) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        setDisplay(`${prefix}${current}${suffix}`);
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(startTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, delayMs]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex min-w-[110px] flex-col items-center rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-5 py-3 transition-all duration-300"
      style={{
        transform: hovered ? "scale(1.05)" : "scale(1)",
        borderColor: hovered ? "rgba(99,102,241,0.4)" : "var(--border-light)",
      }}
    >
      <span className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{display}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

/* =========================================================
   SCAN LINE – indigo sweep
========================================================= */

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.65),transparent)",
          boxShadow: "0 0 12px 2px rgba(99,102,241,0.3)",
          animation: "scanline 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* =========================================================
   HOME – now fully theme‑aware (Indigo Slate)
========================================================= */

export default function Home() {
  const token = localStorage.getItem("token");
  const [show, setShow] = useState(false);
  const { compact } = usePreferences();

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Compact overrides for the landing page (keep it visually balanced)
  const compactClasses = compact
    ? {
        container: "py-8",
        heading: "text-4xl sm:text-5xl md:text-[3.8rem]",
        subheading: "text-lg sm:text-xl",
        description: "text-xs sm:text-sm",
        brandMargin: "mb-5",
        badgeMargin: "mb-4",
        ctaMargin: "mb-6",
        statsMargin: "mb-8",
        featureGap: "gap-2",
        footerMargin: "mt-6",
        statPill: "px-4 py-2 min-w-[90px]",
        statValue: "text-lg",
        statLabel: "text-[8px]",
      }
    : {
        container: "py-16",
        heading: "text-5xl sm:text-6xl md:text-[4.4rem]",
        subheading: "text-xl sm:text-2xl",
        description: "text-sm sm:text-[15px]",
        brandMargin: "mb-7",
        badgeMargin: "mb-6",
        ctaMargin: "mb-9",
        statsMargin: "mb-12",
        featureGap: "gap-3",
        footerMargin: "mt-8",
        statPill: "px-5 py-3 min-w-[110px]",
        statValue: "text-xl",
        statLabel: "text-[9px]",
      };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-4 text-[var(--text-primary)] sm:px-6">
      {/* Background glows and dot grid – indigo */}
      <div
        className="pointer-events-none absolute left-1/2 top-[25%] h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "rgba(99,102,241,0.10)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full"
        style={{
          background: "rgba(99,102,241,0.06)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full"
        style={{
          background: "rgba(99,102,241,0.04)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <ParticleField />

      {/* MAIN CONTENT */}
      <div
        className={`relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center ${compactClasses.container} transition-all duration-700 ease-out ${
          show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="w-full max-w-5xl text-center">
          {/* BRAND */}
          <div
            className={`flex items-center justify-center gap-3 ${compactClasses.brandMargin}`}
            style={{ animation: "fadeDown 0.6s ease both" }}
          >
            <CodeVerityLogo />
            <div className="text-left">
              <p className="text-[12px] font-bold tracking-[0.22em] text-[var(--text-primary)] uppercase">
                CodeVerity
              </p>
              <p className="mt-0.5 text-[9px] text-[var(--text-secondary)]">
                AI-powered repository intelligence
              </p>
            </div>
          </div>

          {/* BADGE */}
          <div
            className={`mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)]/80 px-3.5 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] backdrop-blur-xl animate-pulse-glow ${compactClasses.badgeMargin}`}
            style={{ animation: "fadeDown 0.6s 0.05s ease both" }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            AI-powered GitHub code analysis
          </div>

          {/* HEADING — flat accent color, no gradient text fill */}
          <h1
            className={`mb-3 font-extrabold leading-[1.05] tracking-tight ${compactClasses.heading}`}
            style={{ animation: "fadeUp 0.6s 0.1s ease both" }}
          >
            <span className="text-[var(--text-primary)]">Code</span>
            <span className="text-[var(--accent)]">Verity</span>
          </h1>

          {/* TYPED SUBTITLE */}
          <p
            className={`mb-5 h-8 font-medium ${compactClasses.subheading}`}
            style={{ animation: "fadeUp 0.6s 0.2s ease both" }}
          >
            <TypedWord
              words={[
                "Finds your bugs.",
                "Flags vulnerabilities.",
                "Generates tests.",
                "Ships confidence.",
              ]}
            />
          </p>

          {/* DESCRIPTION */}
          <p
            className={`mx-auto mb-8 max-w-2xl leading-relaxed text-[var(--text-secondary)] ${compactClasses.description}`}
            style={{ animation: "fadeUp 0.6s 0.3s ease both" }}
          >
            Drop any public GitHub URL and get a complete AI-powered repository audit with architecture
            analysis, security findings, bug detection, performance insights, and generated tests.
          </p>

          {/* CTA BUTTONS — flat accent fill, no gradient */}
          <div
            className={`flex flex-wrap justify-center gap-3 ${compactClasses.ctaMargin}`}
            style={{ animation: "fadeUp 0.6s 0.4s ease both" }}
          >
            {token ? (
              <Link
                to="/dashboard"
                className="group relative overflow-hidden rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-contrast,#ffffff)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:scale-[1.03] active:scale-95"
                style={{ boxShadow: "0 0 30px rgba(99,102,241,0.25)" }}
              >
                <ScanLine />
                <span className="relative z-10">Open Dashboard →</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group relative overflow-hidden rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-contrast,#ffffff)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:scale-[1.03] active:scale-95"
                  style={{ boxShadow: "0 0 30px rgba(99,102,241,0.25)" }}
                >
                  <ScanLine />
                  <span className="relative z-10">Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/75 px-7 py-3 text-sm font-semibold text-[var(--text-primary)]/85 backdrop-blur-sm transition-all duration-200 hover:scale-[1.03] active:scale-95 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
                >
                  Get Started Free →
                </Link>
              </>
            )}
          </div>

          {/* TRUST LINE */}
          <div
            className="mb-8 flex items-center justify-center gap-2 text-[9px] text-[var(--text-muted)]"
            style={{ animation: "fadeUp 0.6s 0.45s ease both" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            No credit card required
            <span>•</span>
            Works with public GitHub repositories
          </div>

          {/* STATS — count up on mount */}
          <div
            className={`flex flex-wrap justify-center gap-2.5 ${compactClasses.statsMargin}`}
            style={{ animation: "fadeUp 0.6s 0.5s ease both" }}
          >
            <StatPill value="100+" label="Repos Scanned" delayMs={500} />
            <StatPill value="98%" label="Issue Accuracy" delayMs={600} />
            <StatPill value="<60s" label="Avg Audit Time" delayMs={700} />
          </div>

          {/* FEATURE SECTION LABEL */}
          <div
            className="mb-4 flex items-center gap-3"
            style={{ animation: "fadeUp 0.6s 0.52s ease both" }}
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border-light)]" />
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              What CodeVerity checks
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border-light)]" />
          </div>

          {/* FEATURE CARDS */}
          <div className={`grid ${compactClasses.featureGap} md:grid-cols-3`}>
            <Feature
              icon={<BugIcon />}
              title="AI Bug Detection"
              desc="Pinpoints logic errors, edge cases, and anti-patterns across your entire codebase."
              delay="0.55s"
            />
            <Feature
              icon={<ShieldIcon />}
              title="Security Analysis"
              desc="Scans for OWASP vulnerabilities, exposed secrets, and injection risks instantly."
              delay="0.65s"
            />
            <Feature
              icon={<FlaskIcon />}
              title="Smart Test Generation"
              desc="Creates useful test cases from your repository to help verify fixes and prevent regressions."
              delay="0.75s"
            />
          </div>

          {/* FOOTER */}
          <p
            className={`text-[9px] text-[var(--text-muted)] ${compactClasses.footerMargin}`}
            style={{ animation: "fadeUp 0.6s 0.85s ease both" }}
          >
            CodeVerity · AI Repository Intelligence
          </p>
        </div>
      </div>

      {/* ANIMATIONS – moved to global CSS, kept inline here as fallback */}
      <style>{`
        @keyframes fadeUp {
          from { transform: translateY(18px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeDown {
          from { transform: translateY(-12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scanline {
          0% { top: -2px; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}