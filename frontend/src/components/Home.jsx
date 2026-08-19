import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

/* =========================================================
   PARTICLE FIELD
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
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
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

        // Single accent color (indigo) — matches the app's flat-color system
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

            ctx.moveTo(
              particles[i].x,
              particles[i].y
            );

            ctx.lineTo(
              particles[j].x,
              particles[j].y
            );

            ctx.strokeStyle = `rgba(99,102,241,${
              0.08 * (1 - dist / 110)
            })`;

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

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}

/* =========================================================
   TYPED WORD
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
      setText(
        del
          ? text.slice(0, -1)
          : word.slice(0, text.length + 1)
      );
    }, speed);

    return () => clearTimeout(t);
  }, [text, del, index, words]);

  return (
    <span className="text-indigo-400">
      {text}
      <span className="text-indigo-400 animate-pulse">
        |
      </span>
    </span>
  );
}

/* =========================================================
   CODEVERIFY LOGO
========================================================= */

function CodeVerifyLogo() {
  return (
    <div className="flex items-center justify-center">

      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30">

        <div className="relative flex items-center gap-[2px] text-[10px] font-black tracking-tight text-white">

          <span className="text-indigo-400">
            &lt;
          </span>

          <span>
            CV
          </span>

          <span className="text-indigo-400">
            /&gt;
          </span>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   FEATURE CARD
   Single accent color (indigo) across all cards — no per-card
   hue variation, in line with the app's single-color theming.
========================================================= */

function Feature({
  icon,
  title,
  desc,
  delay,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative cursor-default overflow-hidden rounded-xl p-5 text-left transition-all duration-300 ease-out"
      style={{
        background: "#111113",
        border: `1px solid ${
          hovered
            ? "rgba(99,102,241,0.4)"
            : "rgba(255,255,255,0.1)"
        }`,
        transform: hovered
          ? "translateY(-4px)"
          : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 40px rgba(0,0,0,0.35)"
          : "none",
        animation: `fadeUp 0.6s ${delay} ease both`,
      }}
    >

      {/* Icon */}

      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 transition-transform duration-300"
        style={{
          transform: hovered
            ? "scale(1.08)"
            : "scale(1)",
        }}
      >
        {icon}
      </div>

      <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-white">
        {title}
      </h3>

      <p className="text-[11px] leading-relaxed text-neutral-500">
        {desc}
      </p>

    </div>
  );
}

/* =========================================================
   FEATURE ICONS (line icons, single indigo accent — no emoji)
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
   STAT PILL
========================================================= */

function StatPill({ value, label }) {
  return (
    <div className="flex min-w-[110px] flex-col items-center rounded-xl border border-white/10 bg-[#111113] px-5 py-3">

      <span className="text-xl font-bold tabular-nums text-white">
        {value}
      </span>

      <span className="mt-0.5 font-mono text-[9px] text-neutral-600">
        {label}
      </span>

    </div>
  );
}

/* =========================================================
   SCAN LINE
   Same solid-color sweep + glow used across the auth pages,
   instead of a linear-gradient streak.
========================================================= */

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">

      <div
        className="absolute left-0 right-0 h-px bg-indigo-300/80"
        style={{
          boxShadow: "0 0 12px 2px rgba(199,210,254,0.7)",
          animation: "scanline 3s ease-in-out infinite",
        }}
      />

    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

export default function Home() {
  const token = localStorage.getItem("token");

  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);

    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0a0a0b] px-4 text-white sm:px-6"
    >

      {/* =====================================================
          BACKGROUND
          Soft ambient glow via blurred flat circles (no CSS
          gradients) — single indigo accent, low opacity.
      ===================================================== */}

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

      {/* subtle dot grid, matching the rest of the app */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <ParticleField />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div
        className={`relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center py-16 transition-all duration-700 ease-out ${
          show
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        }`}
      >

        <div className="w-full max-w-5xl text-center">

          {/* =================================================
              BRAND
          ================================================= */}

          <div
            className="mb-7 flex items-center justify-center gap-3"
            style={{
              animation:
                "fadeDown 0.6s ease both",
            }}
          >

            <CodeVerifyLogo />

            <div className="text-left">

              <p className="font-mono text-[12px] font-bold tracking-[0.22em] text-white uppercase">
                CodeVerify
              </p>

              <p className="mt-0.5 text-[9px] text-neutral-600">
                AI-powered repository intelligence
              </p>

            </div>

          </div>

          {/* =================================================
              BADGE
          ================================================= */}

          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111113]/80 px-3.5 py-1.5 text-[10px] font-medium text-neutral-400 backdrop-blur-xl"
            style={{
              animation:
                "fadeDown 0.6s 0.05s ease both",
            }}
          >

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

            AI-powered GitHub code analysis

          </div>

          {/* =================================================
              HEADING
          ================================================= */}

          <h1
            className="mb-3 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-[4.4rem]"
            style={{
              animation:
                "fadeUp 0.6s 0.1s ease both",
              animationFillMode: "both",
            }}
          >

            <span className="text-white">
              Code
            </span>

            <span className="text-indigo-400">
              Verify
            </span>

          </h1>

          {/* =================================================
              TYPED SUBTITLE
          ================================================= */}

          <p
            className="mb-5 h-8 text-xl font-medium sm:text-2xl"
            style={{
              animation:
                "fadeUp 0.6s 0.2s ease both",
              animationFillMode: "both",
            }}
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

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <p
            className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-[15px]"
            style={{
              animation:
                "fadeUp 0.6s 0.3s ease both",
              animationFillMode: "both",
            }}
          >
            Drop any public GitHub URL and get a complete
            AI-powered repository audit with architecture
            analysis, security findings, bug detection,
            performance insights, and generated tests.
          </p>

          {/* =================================================
              CTA
          ================================================= */}

          <div
            className="mb-9 flex flex-wrap justify-center gap-3"
            style={{
              animation:
                "fadeUp 0.6s 0.4s ease both",
              animationFillMode: "both",
            }}
          >

            {token ? (
              <Link
                to="/dashboard"
                className="relative group overflow-hidden rounded-lg bg-indigo-500 px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-400 hover:scale-[1.03] active:scale-95"
                style={{
                  boxShadow: "0 0 24px rgba(99,102,241,0.25)",
                }}
              >

                <ScanLine />

                <span className="relative z-10">
                  Open Dashboard →
                </span>

              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="relative group overflow-hidden rounded-lg bg-indigo-500 px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-400 hover:scale-[1.03] active:scale-95"
                  style={{
                    boxShadow: "0 0 24px rgba(99,102,241,0.25)",
                  }}
                >

                  <ScanLine />

                  <span className="relative z-10">
                    Sign In
                  </span>

                </Link>

                <Link
                  to="/register"
                  className="rounded-lg border border-white/10 bg-[#111113]/75 px-7 py-3 text-sm font-semibold text-white/85 backdrop-blur-sm transition-all duration-200 hover:scale-[1.03] active:scale-95"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#18181b";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(17,17,19,0.75)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                >
                  Get Started Free →
                </Link>
              </>
            )}

          </div>

          {/* =================================================
              TRUST LINE
          ================================================= */}

          <div
            className="mb-8 flex items-center justify-center gap-2 font-mono text-[9px] text-neutral-600"
            style={{
              animation:
                "fadeUp 0.6s 0.45s ease both",
              animationFillMode: "both",
            }}
          >

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            No credit card required

            <span>•</span>

            Works with public GitHub repositories

          </div>

          {/* =================================================
              STATS
          ================================================= */}

          <div
            className="mb-12 flex flex-wrap justify-center gap-2.5"
            style={{
              animation:
                "fadeUp 0.6s 0.5s ease both",
              animationFillMode: "both",
            }}
          >

            <StatPill
              value="100+"
              label="REPOS SCANNED"
            />

            <StatPill
              value="98%"
              label="ISSUE ACCURACY"
            />

            <StatPill
              value="<60s"
              label="AVG AUDIT TIME"
            />

          </div>

          {/* =================================================
              FEATURE SECTION LABEL
          ================================================= */}

          <div
            className="mb-4 flex items-center gap-3"
            style={{
              animation:
                "fadeUp 0.6s 0.52s ease both",
              animationFillMode: "both",
            }}
          >

            <div className="h-px flex-1 bg-white/10" />

            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-600">
              What CodeVerify checks
            </span>

            <div className="h-px flex-1 bg-white/10" />

          </div>

          {/* =================================================
              FEATURE CARDS
          ================================================= */}

          <div className="grid gap-3 md:grid-cols-3">

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

          {/* =================================================
              FOOTER
          ================================================= */}

          <p
            className="mt-8 font-mono text-[9px] text-neutral-700 tracking-wide"
            style={{
              animation:
                "fadeUp 0.6s 0.85s ease both",
              animationFillMode: "both",
            }}
          >
            codeverify · ai repository intelligence
          </p>

        </div>

      </div>

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}

      <style>{`

        @keyframes fadeUp {
          from {
            transform: translateY(18px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeDown {
          from {
            transform: translateY(-12px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scanline {
          0% {
            top: -2px;
            opacity: 0;
          }

          8% {
            opacity: 1;
          }

          92% {
            opacity: 1;
          }

          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .group [style*="scanline"] {
            animation: none !important;
            opacity: 0 !important;
          }
        }

      `}</style>

    </div>
  );
}
