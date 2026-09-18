// src/components/GithubAnalyzer.jsx
import { useState } from "react";
import {
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Github,
  Zap,
  Lightbulb,
} from "lucide-react";
import { analyzeGithub, generateTests } from "../api/github";
import Result from "./Result";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "../hooks/useToast";

// -----------------------------------------------------------------
// Mini components
// -----------------------------------------------------------------

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
        <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
        <ShieldCheck
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className="relative text-[var(--accent)]"
        />
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-secondary)]">
          <span className="font-mono text-[6px] font-bold text-[var(--accent)]">
            &lt;/&gt;
          </span>
        </div>
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}

// Flat-color sweep reuses the global .animate-scanline utility.
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
  const [analysis, setAnalysis] = useState(null);
  const [reportId, setReportId] = useState(null);
  const { success, error } = useToast();
  const { compact } = usePreferences();

  const analyze = async () => {
    if (!repo.startsWith("https://github.com/")) {
      error("Enter a valid GitHub repo URL");
      return;
    }

    try {
      setLoading(true);
      setAnalysis(null);
      setReportId(null);

      const res = await analyzeGithub({ repoUrl: repo });
      const data = res.data?.analysis;
      const newReportId = res.data?.reportId || null;

      if (!data) {
        error("Analysis returned no data");
        return;
      }

      if (setData) setData(data);
      setAnalysis(data);
      setReportId(newReportId);
      success("Repository analysis completed successfully!");
    } catch (err) {
      const msg = err.response?.data?.error || "Analysis failed";
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setReportId(null);
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
    const shortRepo = repo.replace("https://github.com/", "");

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="animate-fadeDown sticky top-0 z-50 flex items-center gap-4 border-b border-[var(--border-light)] bg-[var(--bg-primary)]/80 px-6 py-3 backdrop-blur">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
          >
            <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
            New Analysis
          </button>
          <span
            className="max-w-xs truncate font-mono text-xs text-[var(--text-muted)]"
            title={repo}
          >
            {shortRepo}
          </span>
          <span className="ml-auto flex items-center gap-2 font-mono text-xs text-[var(--accent)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            Analyzed
          </span>
        </div>

        <div className="animate-fadeUp">
          <Result
            data={analysis}
            reportId={reportId}
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

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="animate-fadeUp relative">
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
            <div
              className={`animate-fadeDown flex items-center gap-3 border-b border-[var(--border-light)] bg-[var(--bg-primary)] ${compactClasses.cardHeader}`}
              style={{ animationDelay: "50ms" }}
            >
              <CodeVerityLogo />
              <div>
                <p className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
                  CODEVERITY
                </p>
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  GitHub Repository Intelligence
                </p>
              </div>
            </div>

            <div className={compactClasses.cardBody}>
              <h2
                className={`font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}
              >
                GitHub Repository Analyzer
              </h2>
              <p
                className={`mt-1 inline-flex items-center gap-1.5 text-[var(--text-secondary)] ${compactClasses.subHeading}`}
              >
                Analyze any public repo with AI insights
                <Zap
                  size={12}
                  strokeWidth={2.4}
                  aria-hidden="true"
                  className="text-[var(--accent)]"
                />
              </p>

              <div className="relative mt-5">
                <input
                  aria-label="GitHub repository URL"
                  className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] font-mono text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 ${compactClasses.input}`}
                  placeholder="https://github.com/username/repository"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyze()}
                  enterKeyHint="go"
                />
                <Github
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">
                  Supports public repositories only
                </span>

                <button
                  type="button"
                  onClick={analyze}
                  disabled={loading}
                  className={`group relative overflow-hidden rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-95 sm:min-w-[176px] ${compactClasses.button} ${
                    loading
                      ? "cursor-not-allowed bg-[var(--bg-hover)] text-[var(--text-muted)] shadow-none"
                      : "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_30px_var(--accent-soft-strong)] hover:scale-[1.02] hover:bg-[var(--accent-hover)]"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        aria-hidden="true"
                      />
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      <ScanLine />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Generate Report
                        <ArrowRight
                          size={14}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="opacity-70 transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div
                className={`border-t border-[var(--border-light)] pt-4 font-mono text-xs text-[var(--text-muted)] ${compactClasses.footer}`}
              >
                <span className="inline-flex items-start gap-1.5">
                  <Lightbulb
                    size={12}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[var(--accent)]"
                  />
                  <span>
                    Tip: Try popular repos like{" "}
                    <span className="text-[var(--accent)]">
                      https://github.com/facebook/react
                    </span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`animate-fadeUp flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] ${compactClasses.footer}`}
          style={{ animationDelay: "150ms" }}
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