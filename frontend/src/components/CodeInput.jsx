// src/components/CodeInput.jsx
import { useState } from "react";
import {
  ShieldCheck,
  Code2,
  ArrowRight,
  Loader2,
  Zap,
  Sparkles,
} from "lucide-react";
import { analyzeCode } from "../api/analyze";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "../hooks/useToast";

// -----------------------------------------------------------------
// Reusable mini components
// -----------------------------------------------------------------

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
        <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
        <ShieldCheck
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className="relative text-[var(--accent)]"
        />
        <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-card)]">
          <span className="font-mono text-[6px] font-bold text-[var(--accent)]">
            &lt;/&gt;
          </span>
        </div>
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}

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

// Feature card accents  one accent color at three opacity levels.
const INTENSITY_CLASSES = {
  strong: {
    border: "group-hover:border-[var(--accent-soft-strong)]",
    shadow: "group-hover:shadow-[0_20px_40px_var(--accent-soft)]",
    iconBg: "bg-[var(--accent-soft-strong)]",
  },
  medium: {
    border: "group-hover:border-[var(--accent-soft)]",
    shadow: "group-hover:shadow-[0_20px_40px_var(--accent-soft)]",
    iconBg: "bg-[var(--accent-soft)]",
  },
  soft: {
    border: "group-hover:border-[var(--border-medium)]",
    shadow: "group-hover:shadow-[0_20px_40px_var(--accent-soft)]",
    iconBg: "bg-[var(--accent-soft)]",
  },
};

function Feature({ Icon, title, desc, intensity }) {
  const c = INTENSITY_CLASSES[intensity] ?? INTENSITY_CLASSES.medium;

  return (
    <div
      className={`group relative cursor-default overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 text-left transition-all duration-300 ease-out group-hover:-translate-y-1 ${c.border} ${c.shadow}`}
    >
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--accent-soft)] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-65"
      />
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--accent)] transition-transform duration-300 group-hover:scale-[1.08] ${c.iconBg}`}
      >
        <Icon size={18} strokeWidth={2} aria-hidden="true" />
      </div>
      <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
        {desc}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------
// Main CodeInput component
// -----------------------------------------------------------------

export default function CodeInput({ setResult, model }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const { compact } = usePreferences();

  const runAnalysis = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeCode(code, model);
      setResult(res.data.analysis);
      success("Analysis completed successfully!");
    } catch (err) {
      console.error(err);
      error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const compactClasses = compact
    ? {
        container: "py-4 px-2 sm:px-4",
        header: "mb-4",
        heading: "text-2xl sm:text-3xl",
        footer: "py-3 px-4",
        featuresGrid: "gap-2",
        footerText: "mt-4",
      }
    : {
        container: "py-8 px-4 sm:px-6 lg:px-10",
        header: "mb-8",
        heading: "text-3xl sm:text-4xl",
        footer: "px-4 py-4 sm:px-5",
        featuresGrid: "gap-3",
        footerText: "mt-8",
      };

  const hasCode = Boolean(code.trim());
  const lineCount = code ? code.split("\n").length : 0;

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.container}`}
    >
      {/* AMBIENT BACKGROUND */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-soft)] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-0 h-[300px] w-[300px] rounded-full bg-[var(--accent-soft)] opacity-30 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* HEADER */}
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
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  Intelligent code review
                </p>
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

        {/* EDITOR CARD */}
        <div
          className="animate-fadeUp relative"
          style={{ animationDelay: "100ms" }}
        >
          {/* Corner brackets */}
          <span className="cv-corner absolute -left-px -top-px z-10 h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/50" />
          <span
            className="cv-corner absolute -right-px -top-px z-10 h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/50"
            style={{ animationDelay: "0.4s" }}
          />
          <span
            className="cv-corner absolute -bottom-px -left-px z-10 h-4 w-4 rounded-bl-2xl border-b-2 border-l-2 border-[var(--accent)]/50"
            style={{ animationDelay: "0.8s" }}
          />
          <span
            className="cv-corner absolute -bottom-px -right-px z-10 h-4 w-4 rounded-br-2xl border-b-2 border-r-2 border-[var(--accent)]/50"
            style={{ animationDelay: "1.2s" }}
          />

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
                  <Code2 size={15} strokeWidth={2} aria-hidden="true" />
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
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 top-0 hidden w-14 border-r border-[var(--border-light)] bg-[var(--bg-primary)] pt-5 text-right font-mono text-xs leading-6 text-[var(--text-muted)] sm:block"
              >
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
                className="min-h-[420px] w-full resize-none bg-[var(--bg-primary)] p-5 font-mono text-sm leading-6 text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--border-medium)] focus:ring-1 focus:ring-[var(--accent)]/40 sm:pl-[76px]"
              />
            </div>

            {/* EDITOR FOOTER */}
            <div
              className={`flex flex-col gap-4 border-t border-[var(--border-light)] bg-[var(--bg-primary)] sm:flex-row sm:items-center sm:justify-between ${compactClasses.footer}`}
            >
              <div className="flex items-center gap-5 font-mono text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  {code.length} characters
                </div>
                <div className="hidden sm:block">{lineCount} lines</div>
                <div className="hidden md:block">AI-powered analysis</div>
              </div>

              <button
                type="button"
                onClick={runAnalysis}
                disabled={loading || !hasCode}
                className={`group relative overflow-hidden rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-95 sm:min-w-[176px] ${
                  loading || !hasCode
                    ? "cursor-not-allowed bg-[var(--bg-hover)] text-[var(--text-muted)] shadow-none"
                    : "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_30px_var(--accent-soft-strong)] hover:scale-[1.02] hover:bg-[var(--accent-hover)]"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2
                      size={16}
                      strokeWidth={2.4}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    Reviewing...
                  </span>
                ) : !hasCode ? (
                  <span className="flex items-center justify-center gap-2">
                    Analyze Code
                  </span>
                ) : (
                  <>
                    <ScanLine />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Analyze Code
                      <ArrowRight
                        size={15}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="opacity-70 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div
          className={`animate-fadeUp mt-5 grid grid-cols-1 sm:grid-cols-3 ${compactClasses.featuresGrid}`}
          style={{ animationDelay: "200ms" }}
        >
          <Feature
            Icon={ShieldCheck}
            title="Security Analysis"
            desc="Detect potential vulnerabilities and unsafe patterns."
            intensity="strong"
          />
          <Feature
            Icon={Zap}
            title="Performance"
            desc="Find inefficient logic and performance bottlenecks."
            intensity="medium"
          />
          <Feature
            Icon={Sparkles}
            title="Code Quality"
            desc="Get actionable suggestions to make your code cleaner."
            intensity="soft"
          />
        </div>

        {/* FOOTER */}
        <div
          className={`animate-fadeUp flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] ${compactClasses.footerText}`}
          style={{ animationDelay: "300ms" }}
        >
          <span>Powered by</span>
          <span className="font-semibold text-[var(--text-secondary)]">
            CodeVerity AI
          </span>
          <span>•</span>
          <span>Built for developers</span>
        </div>
      </div>
    </div>
  );
}