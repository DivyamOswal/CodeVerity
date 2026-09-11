import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { usePreferences } from "../context/PreferencesContext";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import {
  PRICING_PLANS,
  formatPrice,
  formatTokens,
} from "../components/PricingPlans";

// ============================================================
//  Reads the current --accent token and converts it to an "r,g,b"
//  string for use in canvas fillStyle/strokeStyle.
// ============================================================
function getAccentRGB() {
  if (typeof window === "undefined") return "34,211,238";
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  if (isNaN(bigint)) return "34,211,238";
  return `${(bigint >> 16) & 255},${(bigint >> 8) & 255},${bigint & 255}`;
}

// ============================================================
//  COMPONENT: NeuralNetworkBackground 
// ============================================================
function NeuralNetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const accentRGB = getAccentRGB();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width, height;
    let particles = [];
    let animationFrame;
    let mouse = { x: null, y: null, radius: 150 };

    const resize = () => {
      width = document.documentElement.clientWidth;
      height = document.documentElement.clientHeight;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      initParticles();
    };

    function initParticles() {
      const particleCount = Math.min(Math.floor((width * height) / 15000), 100);
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 1.5 + 0.5,
        });
      }
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.x != null && mouse.y != null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            p.x += (dx / dist) * force * 2;
            p.y += (dy / dist) * force * 2;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRGB}, 0.4)`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${accentRGB}, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        if (mouse.x != null && mouse.y != null) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${accentRGB}, ${0.3 * (1 - dist / mouse.radius)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    if (reduceMotion) {
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRGB}, 0.4)`;
        ctx.fill();
      });
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}

// ============================================================
//  COMPONENT: TypedWord
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
            setTimeout(() => {}, 1500);
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
//  COMPONENT: CodeVerityLogo
// ============================================================
function CodeVerityLogo() {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
      <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
      <svg
        width="18"
        height="18"
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
      <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)]">
        <span className="text-[6px] font-bold text-[var(--accent)]">
          &lt;/&gt;
        </span>
      </div>
      <span className="absolute -top-0.5 -left-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
    </div>
  );
}

// ============================================================
//  COMPONENT: Feature
// ============================================================
function Feature({ icon, title, desc, index }) {
  return (
    <div className="group relative border-t border-[var(--border-light)] pt-5 transition-colors duration-200 hover:border-[var(--accent)]/50">
      <div className="flex items-center justify-between">
        <span className="text-[var(--accent)]">{icon}</span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
        {desc}
      </p>
    </div>
  );
}

// ============================================================
//  ICON COMPONENTS
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
//  COMPONENT: StatPill (Glowing card effect)
// ============================================================
function StatPill({ value, label, delayMs = 0 }) {
  const [display, setDisplay] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasStarted(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!hasStarted) return;
    setDisplay(0);
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return;
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
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, hasStarted]);

  return (
    <div className="stat-card relative flex min-w-[130px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-card)]/50 px-5 py-4 backdrop-blur-md transition-all duration-300">
      <span className="stat-number text-2xl font-extrabold tabular-nums">
        {display}
      </span>
      <span className="text-[10px] font-medium tracking-wide text-[var(--text-secondary)]">
        {label}
      </span>
    </div>
  );
}

// ============================================================
//  COMPONENT: ScanLine
// ============================================================
function ScanLine() {
  return (
    <span className="absolute inset-0 z-0 overflow-hidden">
      <span className="animate-scanline absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent-contrast)] to-transparent opacity-40" />
    </span>
  );
}

// ============================================================
//  COMPONENT: CodeShowcase3D — replaces the old single flat
//  ScanReportCard3D. This is a layered scene: a central floating
//  terminal/editor window (extending the app's existing editor-
//  chrome identity — traffic lights, tab label, line gutter) with
//  three result badges floating around it at different depths.
//  badgeRefs is populated by the parent so each badge can get its
//  own independent scroll-entrance stagger + idle float loop.
//  Pure markup/CSS — all motion lives in Home's useGSAP block.
// ============================================================
function CodeShowcase3D({ badgeRefs }) {
  return (
    <div className="relative mx-auto w-full max-w-md" style={{ transformStyle: "preserve-3d" }}>
      {/* Floating badge: bug count */}
      <div
        ref={(el) => (badgeRefs.current[0] = el)}
        className="absolute -top-6 -right-5 z-20 flex items-center gap-2 rounded-xl border border-[var(--color-danger)]/25 bg-[var(--bg-card)] px-3.5 py-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
        style={{ transformStyle: "preserve-3d" }}
      >
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

      {/* Floating badge: grade ring */}
      <div
        ref={(el) => (badgeRefs.current[1] = el)}
        className="absolute -bottom-7 -left-6 z-20 flex items-center gap-2.5 rounded-xl border border-[var(--accent)]/25 bg-[var(--bg-card)] px-3.5 py-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="relative h-9 w-9 shrink-0">
          <svg viewBox="0 0 36 36" className="-rotate-90">
            <path
              d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
              fill="none"
              stroke="var(--border-light)"
              strokeWidth="4"
            />
            <path
              d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="4"
              strokeDasharray="92,100"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
            A+
          </span>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Grade</p>
          <p className="font-mono text-xs font-semibold text-[var(--color-success)]">92 / 100</p>
        </div>
      </div>

      {/* Floating badge: tests generated */}
      <div
        ref={(el) => (badgeRefs.current[2] = el)}
        className="absolute -top-4 left-8 z-10 hidden items-center gap-1.5 rounded-full border border-[var(--color-info)]/25 bg-[var(--bg-card)] px-3 py-1.5 shadow-lg sm:flex"
        style={{ transformStyle: "preserve-3d" }}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-info)]" />
        <span className="font-mono text-[10px] font-medium text-[var(--color-info)]">12 tests generated</span>
      </div>

      {/* MAIN: floating terminal / editor window */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_50px_100px_-30px_var(--accent-soft-strong)]">
        <div className="flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-warning)]/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]/60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">analyzer.ts</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            live scan
          </span>
        </div>

        <div className="flex">
          <div className="hidden select-none flex-col items-end gap-[7px] border-r border-[var(--border-light)] px-3 py-5 font-mono text-[10px] leading-[1.6] text-[var(--text-muted)]/50 sm:flex">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <pre className="flex-1 overflow-hidden px-4 py-5 font-mono text-[11px] leading-[1.6]">
            <code>
              <span className="text-[var(--accent-secondary)]">function</span>{" "}
              <span className="text-[var(--accent)]">auditRepository</span>
              <span className="text-[var(--text-secondary)]">(repo) {"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-[var(--text-muted)]">// scan architecture &amp; deps</span>
              {"\n"}
              {"  "}
              <span className="text-[var(--accent-secondary)]">const</span>{" "}
              <span className="text-[var(--text-primary)]">issues</span>{" "}
              <span className="text-[var(--text-secondary)]">= </span>
              <span className="text-[var(--accent)]">scan</span>
              <span className="text-[var(--text-secondary)]">(repo);</span>
              {"\n"}
              {"  "}
              <span className="text-[var(--accent-secondary)]">if</span>{" "}
              <span className="text-[var(--text-secondary)]">(issues.</span>
              <span className="text-[var(--color-danger)]">critical</span>
              <span className="text-[var(--text-secondary)]">) </span>
              <span className="text-[var(--accent-secondary)]">return</span>{" "}
              <span className="text-[var(--color-warning)]">"fail"</span>
              <span className="text-[var(--text-secondary)]">;</span>
              {"\n"}
              {"  "}
              <span className="text-[var(--accent-secondary)]">return</span>{" "}
              <span className="text-[var(--color-success)]">"A+"</span>
              <span className="text-[var(--text-secondary)]">;</span>
              {"\n"}
              <span className="text-[var(--text-secondary)]">{"}"}</span>
              <span className="ml-0.5 inline-block h-[1em] w-[6px] translate-y-[2px] animate-pulse bg-[var(--accent)]" />
            </code>
          </pre>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2">
          <span className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--text-muted)]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3v12" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
            main
          </span>
          <span className="font-mono text-[9px] font-semibold text-[var(--color-success)]">0 errors · A+ grade</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SECTION: How It Works
// ============================================================
function HowItWorks() {
  const steps = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      title: "Paste your GitHub URL",
      desc: "Enter any public repository link. CodeVerity immediately reads the codebase structure.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: "AI scans every file",
      desc: "Our engine examines architecture, dependencies, security, and potential bugs in seconds.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      title: "Get actionable insights",
      desc: "Receive a clear report with test suggestions, vulnerability fixes, and performance tips.",
    },
  ];

  return (
    <section className="border-t border-[var(--border-light)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            How it works
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Repository in, report out — three steps.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`relative px-0 py-6 sm:px-6 sm:py-0 ${
                idx !== 0 ? "sm:border-l sm:border-[var(--border-light)]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  {step.icon}
                </span>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  0{idx + 1}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                {step.title}
              </h3>
              <p className="mt-1.5 max-w-[26ch] text-xs leading-relaxed text-[var(--text-secondary)]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  SECTION: Testimonials
// ============================================================
function Testimonials() {
  const testimonials = [
    {
      quote: "CodeVerity caught a critical security flaw our team overlooked. The generated tests saved us hours.",
      author: "Sarah Chen",
      role: "Lead Engineer, Finlytics",
    },
    {
      quote: "I use it before every PR. The bug detection is surprisingly accurate — it's like having a senior reviewer.",
      author: "Marcus Rivera",
      role: "Full-stack Developer, OpenSource Collective",
    },
    {
      quote: "We integrated it into our CI pipeline. Now every commit gets an instant AI audit. Game changer.",
      author: "Dr. Aisha Patel",
      role: "CTO, DevSafe",
    },
  ];

  return (
    <section className="border-t border-[var(--border-light)] bg-[var(--bg-secondary)]/30 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Trusted by developers already shipping with it
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 transition-colors duration-200 hover:border-[var(--accent)]/30"
            >
              <span className="mb-3 font-mono text-3xl leading-none text-[var(--accent)]">
                "
              </span>
              <p className="flex-1 text-sm leading-relaxed text-[var(--text-primary)]">
                {t.quote}
              </p>
              <div className="mt-5 flex items-center gap-2.5 border-t border-[var(--border-light)] pt-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[var(--accent)]">
                  {t.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {t.author}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {t.role}
                  </p>
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
//  SECTION: Pricing
// ============================================================
function Pricing() {
  const plans = PRICING_PLANS;

  return (
    <section className="border-t border-[var(--border-light)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
            Start for free, upgrade as you grow.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const price = plan.monthly.INR;
            const isFree = price === 0;
            const displayPrice = formatPrice(price, "INR");

            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-xl border bg-[var(--bg-card)] p-6 text-left transition-all duration-200 ${
                  plan.highlight
                    ? "border-[var(--accent)]"
                    : "border-[var(--border-light)] hover:border-[var(--accent)]/30"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {plan.name}
                  </h3>
                  {plan.highlight && (
                    <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-semibold text-[var(--accent)]">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                    {displayPrice}
                  </span>
                  {!isFree && (
                    <span className="ml-1 text-sm text-[var(--text-muted)]">
                      /mo
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)]">
                    {formatTokens(plan.tokensPerMonth)} tokens / mo
                  </span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-[var(--text-secondary)]">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-3 w-3 shrink-0 text-[var(--accent)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={
                    isFree
                      ? "/register"
                      : `/checkout?plan=${plan.id}&cycle=monthly&currency=INR`
                  }
                  className={`mt-6 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
                    plan.highlight
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                      : "border border-[var(--border-light)] text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-[10px] text-[var(--text-muted)]">
          All prices in INR. Yearly plans offer 20% off — see full pricing page.
        </p>
      </div>
    </section>
  );
}

// ============================================================
//  SECTION: FAQ
// ============================================================
function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "What types of repositories does CodeVerity support?",
      a: "Currently we support public GitHub repositories written in JavaScript, TypeScript, Python, and Java. More languages coming soon.",
    },
    {
      q: "Is my code stored or shared?",
      a: "No. CodeVerity processes your repository in memory and never stores any source code. All analysis is temporary and encrypted.",
    },
    {
      q: "Can I use CodeVerity for private repositories?",
      a: "Yes, with the Pro or Enterprise plan you can scan private repositories with full OAuth security.",
    },
    {
      q: "How accurate is the AI bug detection?",
      a: "Our models are trained on millions of open-source fixes and achieve over 98% accuracy on common bug patterns, with continuous improvement.",
    },
  ];

  const toggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section className="border-t border-[var(--border-light)] bg-[var(--bg-secondary)]/30 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
          {faqs.map((faq, idx) => (
            <div key={idx}>
              <button
                onClick={() => toggle(idx)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-150 hover:bg-[var(--bg-hover)]/50"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {faq.q}
                </span>
                <span
                  className={`ml-4 shrink-0 font-mono text-lg text-[var(--accent)] transition-transform duration-200 ${
                    openIndex === idx ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {openIndex === idx && (
                <div className="px-5 pb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  FOOTER (Dynamic based on login state)
// ============================================================
function Footer({ isLoggedIn }) {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-light)] bg-[var(--accent)] px-4 pt-16 pb-8 sm:px-6">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-2xl font-extrabold leading-tight text-[var(--accent-contrast)] sm:text-3xl">
              AI-powered code
              <br />
              intelligence.
            </h3>
            <p className="mt-3 max-w-[220px] text-[12px] leading-relaxed text-[var(--accent-contrast)]/70">
              One repo. Every insight. Built by developers who care about
              quality.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-contrast)]/60">
              Product
            </h4>
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
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-contrast)]/60">
              Resources
            </h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">About</Link></li>
              <li><Link to="/support" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Support</Link></li>
              <li><Link to="/privacy" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Privacy</Link></li>
              <li><Link to="/terms" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Terms</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-contrast)]/60">
              Company
            </h4>
            <ul className="space-y-2">
              <li><a href="mailto:support@codeverity.dev" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">Contact</a></li>
              <li><Link to="/about" className="!text-[var(--accent-contrast)]/85 text-[12px] transition hover:!text-[var(--accent-contrast)]">About Us</Link></li>
              <li><span className="text-[12px] text-[var(--accent-contrast)]/60">© {new Date().getFullYear()}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--accent-contrast)]/15 pt-6 sm:flex-row">
          <p className="text-[10px] text-[var(--accent-contrast)]/60">
            Built with ❤️ for developers everywhere.
          </p>
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
        <div
          className="pointer-events-none w-full overflow-hidden text-center"
          style={{
            maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          }}
        >
          <span
            className="block whitespace-nowrap font-extrabold leading-none tracking-tight text-[var(--accent-contrast)]/10"
            style={{ fontSize: "clamp(3.5rem, 15vw, 10rem)" }}
          >
            CodeVerity
          </span>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
//  MAIN HOME COMPONENT
// ============================================================
export default function Home() {
  const token = localStorage.getItem("token");
  const { compact } = usePreferences();

  const [stats, setStats] = useState({
    totalScans: 0,
    avgQuality: 0,
    avgTime: "0s",
  });
  const [statsLoading, setStatsLoading] = useState(true);

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
  const brandRef = useRef(null);
  const badgeRef = useRef(null);
  const headingRef = useRef(null);
  const typedRef = useRef(null);
  const descriptionRef = useRef(null);
  const ctasRef = useRef(null);
  const trustRef = useRef(null);
  const statsRef = useRef(null);
  const featureLabelRef = useRef(null);
  const featureCardsRef = useRef([]);
  const bgGlow1Ref = useRef(null);
  const bgGlow2Ref = useRef(null);
  const bgGridRef = useRef(null);

  const howRef = useRef(null);
  const testimonialRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);

  // 3D showcase refs. wrapperRef holds the ScrollTrigger; cardRef is
  // the element that gets the 3D transform; badgeRefs is populated by
  // CodeShowcase3D so each floating badge can animate independently.
  const showcaseWrapperRef = useRef(null);
  const showcaseCardRef = useRef(null);
  const showcaseBadgeRefs = useRef([]);

  // NEW: GSAP-driven scroll progress bar at the top of the page.
  // Purely additive — a fixed element + one ScrollTrigger, doesn't
  // touch any existing animation or scroll behavior.
  const progressRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // --- SCROLL PROGRESS BAR ---
        if (progressRef.current) {
          gsap.set(progressRef.current, { scaleX: 0 });
          ScrollTrigger.create({
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
            onUpdate: (self) => {
              gsap.set(progressRef.current, { scaleX: self.progress });
            },
          });
        }

        // --- HERO ENTRANCE ANIMATION (Simple 2D Fade/Slide) ---
        const tl = gsap.timeline({
          defaults: { ease: "power3.out", duration: 0.8 },
        });

        tl.fromTo(brandRef.current, 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 0.6 })
          .fromTo(badgeRef.current, 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
          .fromTo(headingRef.current, 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
          .fromTo(typedRef.current, 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
          .fromTo(descriptionRef.current, 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
          .fromTo(ctasRef.current, 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, "-=0.3")
          .fromTo(trustRef.current, 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.4 }, "-=0.2")
          .fromTo(statsRef.current, 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, "-=0.2");

        // --- FEATURE CARDS SCROLLTRIGGER (Simple 2D) ---
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

        ScrollTrigger.create({
          trigger: featureCardsRef.current,
          start: "top 85%",
          onEnter: () => {
            gsap.fromTo(
              featureCardsRef.current,
              { opacity: 0, y: 40 },
              {
                opacity: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.15,
                ease: "power2.out",
                clearProps: "opacity, transform",
              },
            );
          },
          once: true,
        });

        // --- SECTIONS SCROLLTRIGGER (Simple 2D) ---
        const sections = [
          { ref: howRef, start: "top 85%" },
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
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.8,
                  ease: "power2.out",
                  clearProps: "opacity, transform",
                },
              );
            },
            once: true,
          });
        });

        // --- BACKGROUND PARALLAX (Gentle Depth Effect) ---
        const bgGlow1 = bgGlow1Ref.current;
        const bgGlow2 = bgGlow2Ref.current;
        const bgGrid = bgGridRef.current;
        
        if (bgGlow1) {
          ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              gsap.to(bgGlow1, { y: self.progress * 200, duration: 0.1, overwrite: true });
            },
          });
        }
        if (bgGlow2) {
          ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              gsap.to(bgGlow2, { y: -self.progress * 150, duration: 0.1, overwrite: true });
            },
          });
        }
        if (bgGrid) {
          ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              gsap.to(bgGrid, { y: self.progress * 50, duration: 0.1, overwrite: true });
            },
          });
        }

        // --- 3D SHOWCASE: main window tilts in from an angled,
        // receded position to flat-and-close as it enters view, then
        // idles with a slow ambient tilt once revealed (unchanged
        // from before). ---
        if (showcaseCardRef.current && showcaseWrapperRef.current) {
          const startState = { rotateY: -32, rotateX: 14, y: 70, scale: 0.9, opacity: 0 };
          gsap.set(showcaseCardRef.current, startState);

          ScrollTrigger.create({
            trigger: showcaseWrapperRef.current,
            start: "top 88%",
            end: "top 40%",
            scrub: 1,
            onUpdate: (self) => {
              const p = self.progress;
              gsap.to(showcaseCardRef.current, {
                rotateY: startState.rotateY + (0 - startState.rotateY) * p,
                rotateX: startState.rotateX + (0 - startState.rotateX) * p,
                y: startState.y + (0 - startState.y) * p,
                scale: startState.scale + (1 - startState.scale) * p,
                opacity: p,
                duration: 0.1,
                overwrite: true,
              });
            },
            onLeaveBack: () => {
              gsap.set(showcaseCardRef.current, startState);
            },
          });

          gsap.to(showcaseCardRef.current, {
            rotateY: "+=5",
            rotateX: "+=2.5",
            duration: 4.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1.2,
          });
        }

        // --- 3D SHOWCASE BADGES: each floating badge fades/scales in
        // with its own stagger once the panel is in view, then drifts
        // with an independent idle float loop (offset timing per
        // badge so they don't move in unison). Additive — scoped
        // entirely to showcaseBadgeRefs. ---
        if (showcaseBadgeRefs.current.length) {
          gsap.set(showcaseBadgeRefs.current, { opacity: 0, scale: 0.85, z: -40 });

          ScrollTrigger.create({
            trigger: showcaseWrapperRef.current,
            start: "top 80%",
            onEnter: () => {
              gsap.to(showcaseBadgeRefs.current, {
                opacity: 1,
                scale: 1,
                z: 0,
                duration: 0.7,
                stagger: 0.15,
                ease: "back.out(1.6)",
                delay: 0.3,
              });
            },
            once: true,
          });

          showcaseBadgeRefs.current.forEach((el, i) => {
            if (!el) return;
            gsap.to(el, {
              y: "+=8",
              duration: 3 + i * 0.6,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: 1.5 + i * 0.4,
            });
          });
        }

        return () => {
          ScrollTrigger.getAll().forEach((st) => st.kill());
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [
            brandRef.current, badgeRef.current, headingRef.current, typedRef.current,
            descriptionRef.current, ctasRef.current, trustRef.current, statsRef.current,
            featureLabelRef.current, featureCardsRef.current, howRef.current,
            testimonialRef.current, pricingRef.current, faqRef.current,
            showcaseCardRef.current, ...(showcaseBadgeRefs.current || []),
          ],
          { opacity: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1, z: 0, clearProps: "all" },
        );
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
        container: "pt-32 pb-16",
        heading: "text-4xl sm:text-5xl md:text-[3.8rem]",
        subheading: "text-lg sm:text-xl",
        description: "text-sm sm:text-base",
        brandMargin: "mb-6",
        badgeMargin: "mb-5",
        ctaMargin: "mb-7",
        statsMargin: "mb-10",
        featureGap: "gap-x-8 gap-y-10",
      };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-4 text-[var(--text-primary)] sm:px-6"
    >
      {/* Scroll progress bar — GSAP ScrollTrigger driven, fixed to
          top of viewport, scales along the X axis with scroll. */}
      <div
        ref={progressRef}
        className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-[var(--accent)]"
        style={{ transform: "scaleX(0)" }}
        aria-hidden="true"
      />

      <style dangerouslySetInnerHTML={{__html: `
        .stat-card {
          box-shadow: 0 0 20px -5px var(--accent-soft-strong), inset 0 0 10px var(--accent-soft);
        }
        .stat-card:hover {
          box-shadow: 0 0 30px -5px var(--accent), inset 0 0 15px var(--accent-soft-strong);
          border-color: var(--accent);
        }
        .stat-number {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 8px var(--accent-soft-strong));
        }
        .hero-title-glow {
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 50%, var(--text-primary) 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 20px var(--accent-soft-strong));
          animation: gradient-shift 5s ease infinite;
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}} />

      <div
        ref={bgGlow1Ref}
        className="pointer-events-none absolute left-1/2 top-[25%] h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-soft)] opacity-70 blur-3xl"
      />
      <div
        ref={bgGlow2Ref}
        className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl"
      />
      <div
        ref={bgGridRef}
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <NeuralNetworkBackground />

      <div
        className={`relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center ${compactClasses.container}`}
      >
        <div className="w-full max-w-5xl text-center">
          <div
            ref={brandRef}
            className={`flex items-center justify-center gap-3 ${compactClasses.brandMargin}`}
          >
            <CodeVerityLogo />
            <div className="text-left">
              <p className="text-[12px] font-bold tracking-[0.22em] text-[var(--text-primary)]">
                CodeVerity
              </p>
              <p className="mt-0.5 text-[9px] text-[var(--text-secondary)]">
                AI-powered repository intelligence
              </p>
            </div>
          </div>

          <div
            ref={badgeRef}
            className={`inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)]/60 px-3.5 py-1.5 text-[10px] font-medium tracking-wide text-[var(--text-secondary)] backdrop-blur-xl ${compactClasses.badgeMargin}`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            AI-powered GitHub code analysis
          </div>

          <h1
            ref={headingRef}
            className={`mb-3 font-extrabold leading-[1.05] tracking-tight ${compactClasses.heading}`}
          >
            <span className="hero-title-glow">CodeVerity</span>
          </h1>

          <p
            ref={typedRef}
            className={`mb-5 h-8 font-medium ${compactClasses.subheading}`}
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

          <p
            ref={descriptionRef}
            className={`mx-auto mb-8 max-w-2xl leading-relaxed text-[var(--text-secondary)] ${compactClasses.description}`}
          >
            Drop any public GitHub URL and get a complete AI-powered repository
            audit — architecture analysis, security findings, bug detection,
            performance insights, and generated tests.
          </p>

          <div
            ref={ctasRef}
            className={`flex flex-wrap justify-center gap-3 ${compactClasses.ctaMargin}`}
          >
            {token ? (
              <Link
                to="/dashboard"
                className="group relative overflow-hidden rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.98]"
                style={{ boxShadow: "0 0 30px var(--accent-soft-strong)" }}
              >
                <ScanLine />
                <span className="relative z-10">Open Dashboard →</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group relative overflow-hidden rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.98]"
                  style={{ boxShadow: "0 8px 24px -6px var(--accent-soft-strong)" }}
                >
                  <ScanLine />
                  <span className="relative z-10">Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/75 px-7 py-3 text-sm font-semibold text-[var(--text-primary)] backdrop-blur-sm transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] active:scale-[0.98]"
                >
                  Get Started Free →
                </Link>
              </>
            )}
          </div>

          <div
            ref={trustRef}
            className="mb-8 flex items-center justify-center gap-2 text-[9px] text-[var(--text-muted)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            No credit card required
            <span>•</span>
            Works with public GitHub repositories
          </div>

          <div
            ref={statsRef}
            className={`mx-auto flex w-fit flex-wrap justify-center gap-4 ${compactClasses.statsMargin}`}
          >
            <StatPill value={statsLoading ? "..." : `${stats.totalScans}+`} label="Repos Scanned" delayMs={500} />
            <StatPill value={statsLoading ? "..." : `${stats.avgQuality}%`} label="Issue Accuracy" delayMs={600} />
            <StatPill value={statsLoading ? "..." : stats.avgTime} label="Avg Audit Time" delayMs={700} />
          </div>

          <div
            ref={featureLabelRef}
            className="mb-6 text-left"
          >
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              What CodeVerity checks
            </p>
          </div>

          <div className={`grid grid-cols-1 ${compactClasses.featureGap} sm:grid-cols-3`}>
            <div ref={(el) => (featureCardsRef.current[0] = el)}>
              <Feature icon={<BugIcon />} title="AI Bug Detection" desc="Pinpoints logic errors, edge cases, and anti-patterns across your entire codebase." index={0} />
            </div>
            <div ref={(el) => (featureCardsRef.current[1] = el)}>
              <Feature icon={<ShieldIcon />} title="Security Analysis" desc="Scans for OWASP vulnerabilities, exposed secrets, and injection risks instantly." index={1} />
            </div>
            <div ref={(el) => (featureCardsRef.current[2] = el)}>
              <Feature icon={<FlaskIcon />} title="Smart Test Generation" desc="Creates useful test cases from your repository to help verify fixes and prevent regressions." index={2} />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          3D SHOWCASE — layered floating code editor with result badges
      ================================================================ */}
      <section className="relative z-10 border-t border-[var(--border-light)] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            See it in action
          </p>
          <h2 className="mb-10 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            A real audit, not a demo screenshot
          </h2>

          <div
            ref={showcaseWrapperRef}
            className="mx-auto w-full max-w-md"
            style={{ perspective: "1400px" }}
          >
            <div ref={showcaseCardRef} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
              <CodeShowcase3D badgeRefs={showcaseBadgeRefs} />
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div ref={howRef}>
          <HowItWorks />
        </div>
        <div ref={testimonialRef}>
          <Testimonials />
        </div>
        <div ref={pricingRef}>
          <Pricing />
        </div>
        <div ref={faqRef}>
          <FAQ />
        </div>
        <Footer isLoggedIn={!!token} />
      </div>
    </div>
  );
}