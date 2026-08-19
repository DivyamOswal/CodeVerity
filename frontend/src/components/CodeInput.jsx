import { useState } from "react";
import { analyzeCode } from "../api/analyze";

// -----------------------------------------------------------------
// Reusable mini components (same style as Home)
// -----------------------------------------------------------------

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-lg shadow-green-500/20">
        <div className="absolute inset-[1px] rounded-[11px] bg-[#0d1117]" />

        {/* Shield + checkmark icon */}
        <svg
          width="18"
          height="18"
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
        <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-[#161b22] border border-[#30363d]">
          <span className="text-[6px] font-bold text-green-400">&lt;/&gt;</span>
        </div>

        {/* Status dot */}
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
      </div>
    </div>
  );
}

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg,transparent,rgba(63,185,80,0.65),transparent)",
          animation: "scanline 2.8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// Feature card – uses the same color mapping as Home
const colorMap = {
  green: {
    border: "rgba(63,185,80,0.30)",
    glow: "rgba(63,185,80,0.10)",
    icon: "#3fb950",
    bg: "rgba(63,185,80,0.10)",
  },
  emerald: {
    border: "rgba(16,185,129,0.30)",
    glow: "rgba(16,185,129,0.10)",
    icon: "#10b981",
    bg: "rgba(16,185,129,0.10)",
  },
  teal: {
    border: "rgba(45,212,191,0.30)",
    glow: "rgba(45,212,191,0.08)",
    icon: "#2dd4bf",
    bg: "rgba(45,212,191,0.08)",
  },
};

function Feature({ icon, title, desc, color }) {
  const [hovered, setHovered] = useState(false);
  const c = colorMap[color];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative cursor-default overflow-hidden rounded-xl p-5 text-left transition-all duration-300 ease-out"
      style={{
        background: "rgba(22,27,34,0.72)",
        border: `1px solid ${hovered ? c.border : "rgba(48,54,61,0.9)"}`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 20px 40px ${c.glow}` : "none",
      }}
    >
      {/* Glow */}
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity duration-500"
        style={{ background: c.bg, opacity: hovered ? 0.65 : 0 }}
      />

      {/* Icon */}
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300"
        style={{
          background: c.bg,
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        <span className="text-lg" style={{ color: c.icon }}>
          {icon}
        </span>
      </div>

      <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-[#f0f6fc]">
        {title}
      </h3>
      <p className="text-[11px] leading-relaxed text-[#8b949e]">{desc}</p>
    </div>
  );
}

// -----------------------------------------------------------------
// Main CodeInput component
// -----------------------------------------------------------------

export default function CodeInput({ setResult, model }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeCode(code, model);
      setResult(res.data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white px-4 py-8 sm:px-6 lg:px-10 relative overflow-hidden">
      {/* Signature: same scanline field used across the auth pages, kept consistent app-wide */}
      <style>{`
        @keyframes cv-blink {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        .cv-caret { animation: cv-blink 1.1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cv-caret { animation: none; }
        }
      `}</style>

      {/* ambient background: sparse dot grid, single accent color, very low opacity */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="mx-auto max-w-6xl relative">

        {/* ================= HEADER ================= */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-indigo-400"
                >
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                  <path d="M7 7l5-4 5 4" />
                  <path d="M7 17l5 4 5-4" />
                </svg>
              </span>

              <div>
                <p className="font-mono text-sm tracking-[0.2em] text-neutral-400 uppercase">
                  CodeVerify
                </p>
                <p className="text-xs text-neutral-600">
                  Intelligent code review
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Review your code, verified.
            </h1>

            <p className="mt-2 max-w-2xl font-mono text-xs text-neutral-600 sm:text-sm">
              <span className="text-indigo-400">$</span> analyzing for bugs, security issues,
              performance and quality
              <span className="cv-caret text-indigo-400">_</span>
            </p>
          </div>

          {/* Model Badge */}
          <div className="flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-[#111113] px-4 py-3">
            <div className="relative">
              <span className="block h-2.5 w-2.5 rounded-full bg-indigo-400" />
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-30" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                AI Model
              </p>
              <p className="text-sm font-medium text-neutral-200">
                {model || "Default Model"}
              </p>
            </div>
          </div>
        </div>

        {/* ================= EDITOR CARD ================= */}
        <div className="relative">
          {/* corner brackets — same scan-frame signature as the auth cards */}
          <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-indigo-500/50 rounded-tl-2xl z-10" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-indigo-500/50 rounded-tr-2xl z-10" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-indigo-500/50 rounded-bl-2xl z-10" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-indigo-500/50 rounded-br-2xl z-10" />

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-2xl shadow-black/30">

            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0a0b] px-4 py-3 sm:px-5">

              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>

                <div className="hidden h-5 w-px bg-white/10 sm:block" />

                <div className="flex items-center gap-2 font-mono text-sm text-neutral-500">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14.5 17.5 21 12l-6.5-5.5" />
                    <path d="M9.5 6.5 3 12l6.5 5.5" />
                  </svg>

                  <span>code-review</span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-neutral-600">
                <span className="hidden sm:inline">Paste your source</span>
                <span className="rounded-md border border-white/10 bg-[#111113] px-2 py-1 text-neutral-500">
                  Editor
                </span>
              </div>
            </div>

            {/* Code Area */}
            <div className="relative">

              {/* Line Numbers */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 hidden w-14 border-r border-white/10 bg-[#0a0a0b] pt-5 text-right font-mono text-xs leading-6 text-neutral-700 sm:block">
                {Array.from({ length: 12 }, (_, index) => (
                  <div key={index} className="pr-4">
                    {index + 1}
                  </div>
                ))}
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`// Paste your code here...

function example() {
  // CodeVerify will analyze your code
  // for bugs, security, performance & quality.
}`}
                spellCheck={false}
                className="min-h-[420px] w-full resize-none bg-[#0a0a0b] p-5 font-mono text-sm leading-6 text-neutral-200 outline-none placeholder:text-neutral-700 sm:pl-[76px] focus:bg-black/60 transition-colors"
              />
            </div>

            {/* ================= EDITOR FOOTER ================= */}
            <div className="flex flex-col gap-4 border-t border-white/10 bg-[#0a0a0b] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

              {/* Editor Stats */}
              <div className="flex items-center gap-5 font-mono text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  {code.length} characters
                </div>

                <div className="hidden sm:block">
                  {code ? code.split("\n").length : 0} lines
                </div>

                <div className="hidden md:block">
                  AI-powered analysis
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={runAnalysis}
                disabled={loading || !code.trim()}
                className={`
                  group relative flex items-center justify-center gap-2
                  rounded-xl px-6 py-3
                  text-sm font-semibold text-white
                  transition-colors duration-200
                  ${
                    loading || !code.trim()
                      ? "cursor-not-allowed bg-white/[0.04] text-neutral-600 border border-white/10"
                      : "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600"
                  }
                `}
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="opacity-30"
                      />

                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>

                    <span className="font-mono text-xs">verifying…</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>

                    Analyze Code

                    <span className="ml-1 text-white/50 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------
            FEATURE CARDS – same style as Home
        -------------------------------------------------------------- */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-xl border border-white/10 bg-[#111113] p-4 transition-colors hover:border-indigo-500/40">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <h3 className="text-sm font-semibold text-neutral-200">
              Security Analysis
            </h3>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Detect potential vulnerabilities and unsafe patterns.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111113] p-4 transition-colors hover:border-indigo-500/40">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
              </svg>
            </div>

            <h3 className="text-sm font-semibold text-neutral-200">
              Performance
            </h3>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Find inefficient logic and performance bottlenecks.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111113] p-4 transition-colors hover:border-indigo-500/40">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3v18" />
                <path d="M3 12h18" />
                <path d="m7 7 5-4 5 4" />
                <path d="m7 17 5 4 5-4" />
              </svg>
            </div>

            <h3 className="text-sm font-semibold text-neutral-200">
              Code Quality
            </h3>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Get actionable suggestions to make your code cleaner.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 font-mono text-[11px] text-neutral-700 tracking-wide">
          <span>codeverify</span>
          <span>·</span>
          <span>repo analysis, verified</span>
        </div>
      </div>

      {/* Animation keyframes (same as Home) */}
      <style>{`
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
