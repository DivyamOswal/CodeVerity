import { useState } from "react";
import { analyzeGithub, generateTests } from "../api/github";
import Result from "./Result";
import { usePreferences } from "../context/PreferencesContext";

// -----------------------------------------------------------------
// Mini components – same as Home / CodeInput
// -----------------------------------------------------------------

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
        <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
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
          <span className="font-mono text-[6px] font-bold text-[var(--accent)]">&lt;/&gt;</span>
        </div>
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
      </div>
    </div>
  );
}

// Flat-color sweep — reuses the global .animate-scanline utility.
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

// -----------------------------------------------------------------
// Main component
// -----------------------------------------------------------------

export default function GithubAnalyzer({ setData }) {
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const { compact } = usePreferences();

  const analyze = async () => {
    if (!repo.startsWith("https://github.com/")) {
      return setError("Enter a valid GitHub repo URL");
    }

    try {
      setError("");
      setLoading(true);
      setAnalysis(null);

      const res = await analyzeGithub({ repoUrl: repo });
      const data = res.data.analysis;

      if (setData) setData(data);
      setAnalysis(data);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setError("");
    setRepo("");
    if (setData) setData(null);
  };

  const compactClasses = compact
    ? {
        container: "py-4 px-2 sm:px-4",
        cardHeader: "px-3 py-3 sm:px-4",
        cardBody: "p-4",
        heading: "text-xl",
        subHeading: "text-xs",
        input: "p-3 pr-10 text-sm",
        button: "px-4 py-2.5 text-xs",
        footer: "mt-4",
      }
    : {
        container: "py-8 px-4 sm:px-6 lg:px-10",
        cardHeader: "px-4 py-4 sm:px-6",
        cardBody: "p-6",
        heading: "text-2xl",
        subHeading: "text-sm",
        input: "p-4 pr-12",
        button: "px-6 py-3 text-sm",
        footer: "mt-8",
      };

  // ---- Results View ----
  if (analysis) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="animate-fadeDown sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur border-b border-[var(--border-light)] px-6 py-3 flex items-center gap-4">
          <button
            onClick={handleReset}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            New Analysis
          </button>
          <span className="font-mono text-xs text-[var(--text-muted)] truncate max-w-xs">{repo}</span>
          <span className="ml-auto flex items-center gap-2 font-mono text-xs text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Analyzed
          </span>
        </div>

        <div className="animate-fadeUp">
          <Result
            data={analysis}
            generateTestsFn={generateTests}
            onDownload={() => {
              const blob = new Blob([JSON.stringify(analysis, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              Object.assign(document.createElement("a"), {
                href: url,
                download: "audit-report.json",
              }).click();
              URL.revokeObjectURL(url);
            }}
          />
        </div>
      </div>
    );
  }

  // ---- Input View ----
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

      <div className="mx-auto max-w-3xl relative z-10">
        <div className="animate-fadeUp relative">
          {/* Corner brackets — with a subtle CSS-only breathing pulse,
              same treatment as CodeInput's editor card. */}
          <span className="cv-corner absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[var(--accent)]/50 rounded-tl-2xl z-10" />
          <span className="cv-corner absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[var(--accent)]/50 rounded-tr-2xl z-10" style={{ animationDelay: "0.4s" }} />
          <span className="cv-corner absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[var(--accent)]/50 rounded-bl-2xl z-10" style={{ animationDelay: "0.8s" }} />
          <span className="cv-corner absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[var(--accent)]/50 rounded-br-2xl z-10" style={{ animationDelay: "1.2s" }} />

          <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-xl)]">
            <div
              className={`animate-fadeDown border-b border-[var(--border-light)] bg-[var(--bg-primary)] flex items-center gap-3 ${compactClasses.cardHeader}`}
              style={{ animationDelay: "50ms" }}
            >
              <CodeVerityLogo />
              <div>
                <p className="text-sm font-bold tracking-wide text-[var(--text-primary)]">CODEVERITY</p>
                <p className="font-mono text-xs text-[var(--text-secondary)]">GitHub Repository Intelligence</p>
              </div>
            </div>

            <div className={compactClasses.cardBody}>
              <h2 className={`font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}>
                GitHub Repository Analyzer
              </h2>
              <p className={`text-[var(--text-secondary)] mt-1 ${compactClasses.subHeading}`}>
                Analyze any public repo with AI insights ⚡
              </p>

              <div className="relative mt-5">
                <input
                  aria-label="GitHub repository URL"
                  className={`w-full rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] font-mono border border-[var(--border-light)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 outline-none placeholder:text-[var(--text-muted)] transition-all ${compactClasses.input}`}
                  placeholder="https://github.com/username/repository"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyze()}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔗</span>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-3 text-[var(--color-danger)] text-sm bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/25 p-3 rounded-lg"
                >
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center mt-5">
                <span className="text-xs text-[var(--text-muted)]">
                  Supports public repositories only
                </span>

                <button
                  onClick={analyze}
                  disabled={loading}
                  className={`group relative overflow-hidden rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 ${compactClasses.button} ${
                    loading
                      ? "cursor-not-allowed bg-[var(--bg-hover)] text-[var(--text-muted)] shadow-none"
                      : "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] shadow-[0_0_30px_var(--accent-soft-strong)]"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--accent-contrast)] border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    <>
                      <ScanLine />
                      <span className="relative z-10 flex items-center gap-2">
                        Generate Report
                        <span className="text-[var(--accent-contrast)]/50 transition-transform group-hover:translate-x-0.5">→</span>
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className={`font-mono text-xs text-[var(--text-muted)] border-t border-[var(--border-light)] pt-4 ${compactClasses.footer}`}>
                💡 Tip: Try popular repos like{" "}
                <span className="text-[var(--accent)]">https://github.com/facebook/react</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`animate-fadeUp flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] ${compactClasses.footer}`}
          style={{ animationDelay: "150ms" }}
        >
          <span>Powered by</span>
          <span className="font-semibold text-[var(--text-secondary)]">CodeVerity AI</span>
          <span>•</span>
          <span>Built for developers</span>
        </div>
      </div>

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