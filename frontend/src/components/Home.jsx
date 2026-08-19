import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

/* =========================================================
   PARTICLE FIELD – green theme
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
      vx: (Math.random() - 0.5) * 0.35, // slightly faster for more movement
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
        ctx.fillStyle = `rgba(63,185,80,${p.o})`; // green
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
            ctx.strokeStyle = `rgba(63,185,80,${0.08 * (1 - dist / 110)})`;
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
   TYPED WORD – green gradient
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
    <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
      {text}
      <span className="text-green-400 animate-pulse">|</span>
    </span>
  );
}

/* =========================================================
   CODEVERITY LOGO – shield design (matches other components)
========================================================= */

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-lg shadow-green-500/20 animate-float">
        <div className="absolute inset-[1px] rounded-[11px] bg-[#0d1117]" />

        {/* Shield + checkmark */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative text-green-400"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>

        {/* Small code brackets */}
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-md bg-[#161b22] border border-[#30363d]">
          <span className="text-[6px] font-bold text-green-400">&lt;/&gt;</span>
        </div>

        {/* Pulsing status dot */}
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-green-400 animate-ping" />
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE CARD – green theme, with entrance animation
========================================================= */

function Feature({ icon, title, desc, delay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative cursor-default overflow-hidden rounded-xl p-5 text-left transition-all duration-300 ease-out"
      style={{
        background: "rgba(22,27,34,0.72)",
        border: `1px solid ${hovered ? "rgba(63,185,80,0.40)" : "rgba(48,54,61,0.9)"}`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 20px 40px rgba(63,185,80,0.10)" : "none",
        animation: `fadeUp 0.6s ${delay} ease both`,
      }}
    >
      {/* Glow */}
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity duration-500"
        style={{
          background: "rgba(63,185,80,0.10)",
          opacity: hovered ? 0.65 : 0,
        }}
      />

      {/* Icon */}
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400 transition-transform duration-300"
        style={{
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        {icon}
      </div>

      <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-[#f0f6fc]">
        {title}
      </h3>
      <p className="text-[11px] leading-relaxed text-[#8b949e]">{desc}</p>
    </div>
  );
}

/* =========================================================
   FEATURE ICONS (green themed)
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
   STAT PILL – green themed with hover scale
========================================================= */

function StatPill({ value, label }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex min-w-[110px] flex-col items-center rounded-xl border border-[#30363d] bg-[#161b22] px-5 py-3 transition-all duration-300"
      style={{
        transform: hovered ? "scale(1.05)" : "scale(1)",
        borderColor: hovered ? "rgba(63,185,80,0.4)" : "#30363d",
      }}
    >
      <span className="text-xl font-bold tabular-nums text-[#f0f6fc]">{value}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-[#8b949e]">{label}</span>
    </div>
  );
}

/* =========================================================
   SCAN LINE – green sweep
========================================================= */

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg,transparent,rgba(63,185,80,0.65),transparent)",
          boxShadow: "0 0 12px 2px rgba(63,185,80,0.3)",
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
    <div className="relative min-h-screen overflow-hidden bg-[#0d1117] px-4 text-[#f0f6fc] sm:px-6">
      {/* =====================================================
          BACKGROUND GLOWS (green accents)
      ===================================================== */}
      <div
        className="pointer-events-none absolute left-1/2 top-[25%] h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "rgba(35,134,54,0.10)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full"
        style={{
          background: "rgba(16,185,129,0.06)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full"
        style={{
          background: "rgba(63,185,80,0.04)",
          filter: "blur(110px)",
        }}
      />

      {/* subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(rgba(63,185,80,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <ParticleField />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <div
        className={`relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center py-16 transition-all duration-700 ease-out ${
          show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="w-full max-w-5xl text-center">
          {/* =================================================
              BRAND
          ================================================= */}
          <div
            className="mb-7 flex items-center justify-center gap-3"
            style={{ animation: "fadeDown 0.6s ease both" }}
          >
            <CodeVerityLogo />
            <div className="text-left">
              <p className="text-[12px] font-bold tracking-[0.22em] text-[#f0f6fc] uppercase">
                CodeVerity
              </p>
              <p className="mt-0.5 text-[9px] text-[#8b949e]">
                AI-powered repository intelligence
              </p>
            </div>
          </div>

          {/* =================================================
              BADGE
          ================================================= */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#30363d] bg-[#161b22]/80 px-3.5 py-1.5 text-[10px] font-medium text-[#8b949e] backdrop-blur-xl animate-pulse-glow"
            style={{ animation: "fadeDown 0.6s 0.05s ease both" }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3fb950]" />
            AI-powered GitHub code analysis
          </div>

          {/* =================================================
              HEADING – with animated gradient
          ================================================= */}
          <h1
            className="mb-3 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-[4.4rem] animate-gradient-text"
            style={{
              animation: "fadeUp 0.6s 0.1s ease both, gradientMove 8s ease-in-out infinite alternate",
            }}
          >
            <span className="text-[#f0f6fc]">Code</span>
            <span
              style={{
                background: "linear-gradient(135deg,#3fb950 0%,#10b981 48%,#2dd4bf 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize: "200% 200%",
              }}
            >
              Verity
            </span>
          </h1>

          {/* =================================================
              TYPED SUBTITLE
          ================================================= */}
          <p
            className="mb-5 h-8 text-xl font-medium sm:text-2xl"
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

          {/* =================================================
              DESCRIPTION
          ================================================= */}
          <p
            className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-[#8b949e] sm:text-[15px]"
            style={{ animation: "fadeUp 0.6s 0.3s ease both" }}
          >
            Drop any public GitHub URL and get a complete AI-powered repository audit with architecture
            analysis, security findings, bug detection, performance insights, and generated tests.
          </p>

          {/* =================================================
              CTA BUTTONS
          ================================================= */}
          <div
            className="mb-9 flex flex-wrap justify-center gap-3"
            style={{ animation: "fadeUp 0.6s 0.4s ease both" }}
          >
            {token ? (
              <Link
                to="/dashboard"
                className="group relative overflow-hidden rounded-lg px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#238636,#2ea043)",
                  boxShadow: "0 0 30px rgba(35,134,54,0.25)",
                }}
              >
                <ScanLine />
                <span className="relative z-10">Open Dashboard →</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group relative overflow-hidden rounded-lg px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
                  style={{
                    background: "linear-gradient(135deg,#238636,#2ea043)",
                    boxShadow: "0 0 30px rgba(35,134,54,0.25)",
                  }}
                >
                  <ScanLine />
                  <span className="relative z-10">Sign In</span>
                </Link>

                <Link
                  to="/register"
                  className="rounded-lg border border-[#30363d] bg-[#161b22]/75 px-7 py-3 text-sm font-semibold text-[#f0f6fc]/85 backdrop-blur-sm transition-all duration-200 hover:scale-[1.03] active:scale-95 hover:border-green-500/40 hover:bg-[#21262d]"
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
            className="mb-8 flex items-center justify-center gap-2 text-[9px] text-[#484f58]"
            style={{ animation: "fadeUp 0.6s 0.45s ease both" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
            No credit card required
            <span>•</span>
            Works with public GitHub repositories
          </div>

          {/* =================================================
              STATS
          ================================================= */}
          <div
            className="mb-12 flex flex-wrap justify-center gap-2.5"
            style={{ animation: "fadeUp 0.6s 0.5s ease both" }}
          >
            <StatPill value="100+" label="Repos Scanned" />
            <StatPill value="98%" label="Issue Accuracy" />
            <StatPill value="<60s" label="Avg Audit Time" />
          </div>

          {/* =================================================
              FEATURE SECTION LABEL
          ================================================= */}
          <div
            className="mb-4 flex items-center gap-3"
            style={{ animation: "fadeUp 0.6s 0.52s ease both" }}
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#30363d]" />
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#484f58]">
              What CodeVerity checks
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#30363d]" />
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
            className="mt-8 text-[9px] text-[#30363d]"
            style={{ animation: "fadeUp 0.6s 0.85s ease both" }}
          >
            CodeVerity · AI Repository Intelligence
          </p>
        </div>
      </div>

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}
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
          0%, 100% { box-shadow: 0 0 8px rgba(63,185,80,0.1); }
          50% { box-shadow: 0 0 20px rgba(63,185,80,0.3); }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .animate-gradient-text {
          animation: fadeUp 0.6s 0.1s ease both, gradientMove 8s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
}