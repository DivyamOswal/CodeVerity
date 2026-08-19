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
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-lg shadow-green-500/20">
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
          className="relative text-green-400"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-md bg-[#161b22] border border-[#30363d]">
          <span className="text-[6px] font-bold text-green-400">&lt;/&gt;</span>
        </div>
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

// -----------------------------------------------------------------
// Main component
// -----------------------------------------------------------------

export default function GithubAnalyzer({ setData }) {
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  
  // Get compact preference
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

  // Compact overrides for the input view
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
      <div>
        {/* Sticky bar – green themed */}
        <div className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur border-b border-[#30363d] px-6 py-3 flex items-center gap-4">
          <button
            onClick={handleReset}
            className="text-sm text-[#8b949e] hover:text-text-[var(--text-primary)] transition flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            New Analysis
          </button>
          <span className="text-xs text-[#484f58] truncate max-w-xs">{repo}</span>
          <span className="ml-auto flex items-center gap-2 text-xs text-[#3fb950]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            Analyzed
          </span>
        </div>

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
    );
  }

  // ---- Input View ----
  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] text-text-[var(--text-primary)] relative overflow-hidden ${compactClasses.container}`}
    >
      {/* Background glows and dot grid – matches Home and CodeInput */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(35,134,54,0.10) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-[300px] w-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(63,185,80,0.04) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(rgba(63,185,80,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="mx-auto max-w-3xl relative z-10">
        {/* Card – with corner brackets like CodeInput */}
        <div className="relative">
          <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-green-500/50 rounded-tl-2xl z-10" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-green-500/50 rounded-tr-2xl z-10" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-green-500/50 rounded-bl-2xl z-10" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-green-500/50 rounded-br-2xl z-10" />

          <div className="overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22] shadow-2xl shadow-black/30">
            {/* Header with logo */}
            <div className={`border-b border-[#30363d] bg-[var(--bg-primary)] flex items-center gap-3 ${compactClasses.cardHeader}`}>
              <CodeVerityLogo />
              <div>
                <p className="text-sm font-bold tracking-wide text-text-[var(--text-primary)]">CODEVERITY</p>
                <p className="text-xs text-[#8b949e]">GitHub Repository Intelligence</p>
              </div>
            </div>

            <div className={compactClasses.cardBody}>
              <h2 className={`font-bold tracking-tight ${compactClasses.heading}`}>
                GitHub Repository Analyzer
              </h2>
              <p className={`text-[#8b949e] mt-1 ${compactClasses.subHeading}`}>
                Analyze any public repo with AI insights ⚡
              </p>

              {/* Input field – green focus ring */}
              <div className="relative mt-5">
                <input
                  className={`w-full rounded-xl bg-[var(--bg-primary)] text-text-[var(--text-primary)] border border-[#30363d] focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none placeholder:text-[#484f58] transition-all ${compactClasses.input}`}
                  placeholder="https://github.com/username/repository"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyze()}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#484f58]">🔗</span>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center mt-5">
                <span className="text-xs text-[#484f58]">
                  Supports public repositories only
                </span>

                <button
                  onClick={analyze}
                  disabled={loading}
                  className={`group relative overflow-hidden rounded-lg font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:bg-[#30363d] disabled:text-[#484f58] disabled:shadow-none hover:scale-[1.02] active:scale-95 ${compactClasses.button}`}
                  style={
                    loading
                      ? {}
                      : {
                          background: "linear-gradient(135deg,#238636,#2ea043)",
                          boxShadow: "0 0 30px rgba(35,134,54,0.25)",
                        }
                  }
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    <>
                      <ScanLine />
                      <span className="relative z-10 flex items-center gap-2">
                        Generate Report
                        <span className="text-white/50 transition-transform group-hover:translate-x-0.5">→</span>
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Tip */}
              <div className={`text-xs text-[#30363d] border-t border-[#30363d] pt-4 ${compactClasses.footer}`}>
                💡 Tip: Try popular repos like{" "}
                <span className="text-green-400">https://github.com/facebook/react</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-center gap-2 text-xs text-[#30363d] ${compactClasses.footer}`}>
          <span>Powered by</span>
          <span className="font-semibold text-[#484f58]">CodeVerity AI</span>
          <span>•</span>
          <span>Built for developers</span>
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0% { top: -2px; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}