import { useState } from "react";
import { analyzeCode } from "../api/analyze";
import { usePreferences } from "../context/PreferencesContext";

// -----------------------------------------------------------------
// Reusable mini components (same style as Home & other pages)
// -----------------------------------------------------------------

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
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
        <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-[var(--bg-card)] border border-[var(--border-light)]">
          <span className="font-mono text-[6px] font-bold text-[var(--accent)]">&lt;/&gt;</span>
        </div>
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
      </div>
    </div>
  );
}

// Single moving highlight bar across the button flat-color sweep,
// reuses the global .animate-scanline utility from index.css instead
// of redefining the same keyframe locally.
function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      <div
        className="animate-scanline absolute left-0 right-0 h-px bg-[var(--accent-contrast)]"
        style={{ opacity: 0.35 }}
      />
    </div>
  );
}

// Feature card accents one accent color at three opacity levels,
// so the three cards read as a set rather than three separate hues.
const colorMap = {
  strong: {
    border: "var(--accent-soft-strong)",
    glow: "var(--accent-soft)",
    bg: "var(--accent-soft-strong)",
  },
  medium: {
    border: "var(--accent-soft)",
    glow: "var(--accent-soft)",
    bg: "var(--accent-soft)",
  },
  soft: {
    border: "var(--border-light)",
    glow: "var(--accent-soft)",
    bg: "var(--accent-soft)",
  },
};

function Feature({ icon, title, desc, intensity }) {
  const [hovered, setHovered] = useState(false);
  const c = colorMap[intensity];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative cursor-default overflow-hidden rounded-xl p-5 text-left transition-all duration-300 ease-out bg-[var(--bg-card)]"
      style={{
        border: `1px solid ${hovered ? c.border : "var(--border-light)"}`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 20px 40px ${c.glow}` : "none",
      }}
    >
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity duration-500"
        style={{ background: c.bg, opacity: hovered ? 0.65 : 0 }}
      />
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300"
        style={{
          background: c.bg,
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        <span className="text-lg text-[var(--accent)]">{icon}</span>
      </div>
      <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">{desc}</p>
    </div>
  );
}

// -----------------------------------------------------------------
// Main CodeInput component – now supports compact mode from Settings
// -----------------------------------------------------------------

export default function CodeInput({ setResult, model }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get preferences for compact mode
  const { compact } = usePreferences();

  const runAnalysis = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await analyzeCode(code, model);
      setResult(res.data.analysis);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Compact overrides
  const compactClasses = compact
    ? {
        container: "py-4 px-2 sm:px-4",
        header: "mb-4",
        heading: "text-2xl sm:text-3xl",
        editorCard: "p-4",
        footer: "py-3 px-4",
        featuresGrid: "gap-2",
        featureCard: "p-3",
        footerText: "mt-4",
      }
    : {
        container: "py-8 px-4 sm:px-6 lg:px-10",
        header: "mb-8",
        heading: "text-3xl sm:text-4xl",
        editorCard: "p-0",
        footer: "px-4 py-4 sm:px-5",
        featuresGrid: "gap-3",
        featureCard: "p-4",
        footerText: "mt-8",
      };

  const hasCode = Boolean(code.trim());

  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden ${compactClasses.container}`}
    >
      {/* ================= AMBIENT BACKGROUND ================= */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-soft)] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-0 h-[300px] w-[300px] rounded-full bg-[var(--accent-soft)] opacity-30 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="mx-auto max-w-6xl relative z-10">
        {/* ================= HEADER ================= */}
        <div
          className={`animate-fadeDown flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${compactClasses.header}`}
        >
          <div>
            <div className="mb-3 flex items-center gap-3">
              <CodeVerityLogo />
              <div>
                <p className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
                  CODEVERITY
                </p>
                <p className="font-mono text-xs text-[var(--text-muted)]">Intelligent code review</p>
              </div>
            </div>

            <h1 className={`font-bold tracking-tight ${compactClasses.heading}`}>
              Review your code{" "}
              <span className="text-[var(--accent)]">smarter.</span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
              Analyze your code with AI and identify bugs, security issues,
              performance problems, and improvement opportunities.
            </p>
          </div>

          {/* Model badge */}
          <div className="flex w-fit items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-3">
            <div className="relative">
              <span className="block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)] opacity-30" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                AI Model
              </p>
              <p className="font-mono text-sm font-medium text-[var(--text-primary)]">
                {model || "Default Model"}
              </p>
            </div>
          </div>
        </div>

        {/* ================= ERROR BANNER ================= */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="animate-fadeUp mb-4 font-mono text-xs text-[var(--color-danger)] bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/25 rounded-xl px-4 py-3"
          >
            error: {error}
          </div>
        )}

        {/* ================= EDITOR CARD ================= */}
        <div className="animate-fadeUp relative" style={{ animationDelay: "100ms" }}>
          {/* Corner brackets now with a subtle CSS-only breathing pulse */}
          <span className="cv-corner absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[var(--accent)]/50 rounded-tl-2xl z-10" />
          <span className="cv-corner absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[var(--accent)]/50 rounded-tr-2xl z-10" style={{ animationDelay: "0.4s" }} />
          <span className="cv-corner absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[var(--accent)]/50 rounded-bl-2xl z-10" style={{ animationDelay: "0.8s" }} />
          <span className="cv-corner absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[var(--accent)]/50 rounded-br-2xl z-10" style={{ animationDelay: "1.2s" }} />

          <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-xl)]">
            {/* Editor top bar */}
            <div className="flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>

                <div className="hidden h-5 w-px bg-[var(--border-light)] sm:block" />

                <div className="flex items-center gap-2 font-mono text-sm text-[var(--text-muted)]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 17.5 21 12l-6.5-5.5" />
                    <path d="M9.5 6.5 3 12l6.5 5.5" />
                  </svg>
                  <span>code-review</span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
                <span className="hidden sm:inline">Paste your source</span>
                <span className="rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] px-2 py-1">
                  Editor
                </span>
              </div>
            </div>

            {/* Code area */}
            <div className="relative">
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 hidden w-14 border-r border-[var(--border-light)] bg-[var(--bg-primary)] pt-5 text-right font-mono text-xs leading-6 text-[var(--text-muted)] sm:block">
                {Array.from({ length: 12 }, (_, index) => (
                  <div key={index} className="pr-4">
                    {index + 1}
                  </div>
                ))}
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`// Paste your code here...\n\nfunction example() {\n  // CodeVerity will analyze your code\n  // for bugs, security, performance & quality.\n}`}
                spellCheck={false}
                aria-label="Code to analyze"
                className="min-h-[420px] w-full resize-none bg-[var(--bg-primary)] p-5 font-mono text-sm leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--border-medium)] sm:pl-[76px] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all"
              />
            </div>

            {/* ================= EDITOR FOOTER ================= */}
            <div
              className={`flex flex-col gap-4 border-t border-[var(--border-light)] bg-[var(--bg-primary)] sm:flex-row sm:items-center sm:justify-between ${compactClasses.footer}`}
            >
              <div className="flex items-center gap-5 font-mono text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  {code.length} characters
                </div>
                <div className="hidden sm:block">
                  {code ? code.split("\n").length : 0} lines
                </div>
                <div className="hidden md:block">AI-powered analysis</div>
              </div>

              <button
                onClick={runAnalysis}
                disabled={loading || !hasCode}
                className={`group relative overflow-hidden rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  loading || !hasCode
                    ? "cursor-not-allowed bg-[var(--bg-hover)] text-[var(--text-muted)] shadow-none"
                    : "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-[0_0_30px_var(--accent-soft-strong)]"
                }`}
              >
                {loading || !hasCode ? (
                  <>
                    {loading && (
                      <svg className="mr-2 inline h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-30" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                    {loading ? "Reviewing..." : "Analyze Code"}
                  </>
                ) : (
                  <>
                    <ScanLine />
                    <span className="relative z-10 flex items-center gap-2">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                      Analyze Code
                      <span className="ml-1 text-[var(--accent-contrast)]/50 transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================= FEATURE CARDS ================= */}
        <div
          className={`animate-fadeUp mt-5 grid grid-cols-1 sm:grid-cols-3 ${compactClasses.featuresGrid}`}
          style={{ animationDelay: "200ms" }}
        >
          <Feature
            icon="🔐"
            title="Security Analysis"
            desc="Detect potential vulnerabilities and unsafe patterns."
            intensity="strong"
          />
          <Feature
            icon="⚡"
            title="Performance"
            desc="Find inefficient logic and performance bottlenecks."
            intensity="medium"
          />
          <Feature
            icon="🧹"
            title="Code Quality"
            desc="Get actionable suggestions to make your code cleaner."
            intensity="soft"
          />
        </div>

        {/* ================= FOOTER ================= */}
        <div
          className={`animate-fadeUp flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] ${compactClasses.footerText}`}
          style={{ animationDelay: "300ms" }}
        >
          <span>Powered by</span>
          <span className="font-semibold text-[var(--text-secondary)]">CodeVerity AI</span>
          <span>•</span>
          <span>Built for developers</span>
        </div>
      </div>

      {/* Corner-bracket breathing small, self-contained, pure CSS.
          Covered automatically by index.css's global
          prefers-reduced-motion rule. */}
      <style>{`
        @keyframes cv-corner-breathe {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .cv-corner {
          animation: cv-corner-breathe 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}