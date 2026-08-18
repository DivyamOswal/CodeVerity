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

        ctx.fillStyle = `rgba(88,166,255,${p.o})`;
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

            ctx.strokeStyle = `rgba(88,166,255,${
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
    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
      {text}
      <span className="text-blue-400 animate-pulse">
        |
      </span>
    </span>
  );
}

/* =========================================================
   CODEVERITY LOGO
========================================================= */

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">

      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/10">

        <div className="absolute inset-[1px] rounded-[11px] bg-[#0d1117]" />

        <div className="relative flex items-center gap-[2px] text-[10px] font-black tracking-tight text-white">

          <span className="text-blue-400">
            &lt;
          </span>

          <span>
            CV
          </span>

          <span className="text-purple-400">
            /&gt;
          </span>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

const colorMap = {
  blue: {
    border: "rgba(88,166,255,0.30)",
    glow: "rgba(88,166,255,0.10)",
    icon: "#58a6ff",
    bg: "rgba(88,166,255,0.10)",
  },

  purple: {
    border: "rgba(139,92,246,0.30)",
    glow: "rgba(139,92,246,0.10)",
    icon: "#a78bfa",
    bg: "rgba(139,92,246,0.10)",
  },

  cyan: {
    border: "rgba(34,211,238,0.30)",
    glow: "rgba(34,211,238,0.08)",
    icon: "#22d3ee",
    bg: "rgba(34,211,238,0.08)",
  },
};

function Feature({
  icon,
  title,
  desc,
  delay,
  color,
}) {
  const [hovered, setHovered] = useState(false);

  const c = colorMap[color];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative cursor-default overflow-hidden rounded-xl p-5 text-left transition-all duration-300 ease-out"
      style={{
        background: "rgba(22,27,34,0.72)",
        border: `1px solid ${
          hovered
            ? c.border
            : "rgba(48,54,61,0.9)"
        }`,
        transform: hovered
          ? "translateY(-4px)"
          : "translateY(0)",
        boxShadow: hovered
          ? `0 20px 40px ${c.glow}`
          : "none",
        animation: `fadeUp 0.6s ${delay} ease both`,
      }}
    >

      {/* Glow */}

      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity duration-500"
        style={{
          background: c.bg,
          opacity: hovered ? 0.65 : 0,
        }}
      />

      {/* Icon */}

      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300"
        style={{
          background: c.bg,
          transform: hovered
            ? "scale(1.08)"
            : "scale(1)",
        }}
      >
        <span
          className="text-lg"
          style={{ color: c.icon }}
        >
          {icon}
        </span>
      </div>

      <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-[#f0f6fc]">
        {title}
      </h3>

      <p className="text-[11px] leading-relaxed text-[#6e7681]">
        {desc}
      </p>

    </div>
  );
}

/* =========================================================
   STAT PILL
========================================================= */

function StatPill({ value, label }) {
  return (
    <div
      className="flex min-w-[110px] flex-col items-center rounded-xl px-5 py-3"
      style={{
        background: "rgba(22,27,34,0.72)",
        border: "1px solid rgba(48,54,61,0.9)",
      }}
    >

      <span className="text-xl font-bold tabular-nums text-[#f0f6fc]">
        {value}
      </span>

      <span className="mt-0.5 text-[9px] text-[#6e7681]">
        {label}
      </span>

    </div>
  );
}

/* =========================================================
   SCAN LINE
========================================================= */

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">

      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg,transparent,rgba(88,166,255,0.65),transparent)",
          animation:
            "scanline 3s ease-in-out infinite",
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
      className="relative min-h-screen overflow-hidden bg-[#0d1117] px-4 text-[#f0f6fc] sm:px-6"
    >

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="pointer-events-none absolute left-1/2 top-[25%] h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(37,99,235,0.10) 0%, transparent 65%)",
        }}
      />

      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,58,237,0.07) 0%, transparent 70%)",
        }}
      />

      <div
        className="pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(88,166,255,0.04) 0%, transparent 70%)",
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

            <CodeVerityLogo />

            <div className="text-left">

              <p className="text-[12px] font-bold tracking-[0.22em] text-[#f0f6fc]">
                CODEVERITY
              </p>

              <p className="mt-0.5 text-[9px] text-[#6e7681]">
                AI-powered repository intelligence
              </p>

            </div>

          </div>

          {/* =================================================
              BADGE
          ================================================= */}

          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#30363d] bg-[#161b22]/80 px-3.5 py-1.5 text-[10px] font-medium text-[#8b949e] backdrop-blur-xl"
            style={{
              animation:
                "fadeDown 0.6s 0.05s ease both",
            }}
          >

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3fb950]" />

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

            <span className="text-[#f0f6fc]">
              Code
            </span>

            <span
              style={{
                background:
                  "linear-gradient(135deg,#58a6ff 0%,#818cf8 48%,#a78bfa 100%)",
                WebkitBackgroundClip:
                  "text",
                WebkitTextFillColor:
                  "transparent",
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
            className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-[#6e7681] sm:text-[15px]"
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
                className="relative group overflow-hidden rounded-lg px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg,#2563eb,#6366f1)",
                  boxShadow:
                    "0 0 30px rgba(37,99,235,0.20)",
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
                  className="relative group overflow-hidden rounded-lg px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg,#2563eb,#6366f1)",
                    boxShadow:
                      "0 0 30px rgba(37,99,235,0.20)",
                  }}
                >

                  <ScanLine />

                  <span className="relative z-10">
                    Sign In
                  </span>

                </Link>

                <Link
                  to="/register"
                  className="rounded-lg px-7 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-95"
                  style={{
                    background:
                      "rgba(22,27,34,0.75)",
                    border:
                      "1px solid rgba(48,54,61,0.95)",
                    backdropFilter:
                      "blur(8px)",
                    color:
                      "rgba(240,246,252,0.85)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "#21262d";
                    e.currentTarget.style.borderColor =
                      "#484f58";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(22,27,34,0.75)";
                    e.currentTarget.style.borderColor =
                      "rgba(48,54,61,0.95)";
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
            className="mb-8 flex items-center justify-center gap-2 text-[9px] text-[#484f58]"
            style={{
              animation:
                "fadeUp 0.6s 0.45s ease both",
              animationFillMode: "both",
            }}
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
            style={{
              animation:
                "fadeUp 0.6s 0.5s ease both",
              animationFillMode: "both",
            }}
          >

            <StatPill
              value="100+"
              label="Repos Scanned"
            />

            <StatPill
              value="98%"
              label="Issue Accuracy"
            />

            <StatPill
              value="<60s"
              label="Avg Audit Time"
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
              icon="🐛"
              title="AI Bug Detection"
              desc="Pinpoints logic errors, edge cases, and anti-patterns across your entire codebase."
              color="blue"
              delay="0.55s"
            />

            <Feature
              icon="🔐"
              title="Security Analysis"
              desc="Scans for OWASP vulnerabilities, exposed secrets, and injection risks instantly."
              color="purple"
              delay="0.65s"
            />

            <Feature
              icon="🧪"
              title="Smart Test Generation"
              desc="Creates useful test cases from your repository to help verify fixes and prevent regressions."
              color="cyan"
              delay="0.75s"
            />

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <p
            className="mt-8 text-[9px] text-[#30363d]"
            style={{
              animation:
                "fadeUp 0.6s 0.85s ease both",
              animationFillMode: "both",
            }}
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

      `}</style>

    </div>
  );
}