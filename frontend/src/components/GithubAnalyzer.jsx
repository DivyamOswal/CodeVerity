import { useState } from "react";
import { analyzeGithub, generateTests } from "../api/github";
import Result from "./Result";

export default function GithubAnalyzer({ setData }) {
  const [repo,      setRepo]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [analysis,  setAnalysis]  = useState(null); // ← owns the result locally

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

      // Keep parent in sync if setData was passed (for History, Dashboard, etc.)
      if (setData) setData(data);

      // Store locally so we can pass generateTestsFn to Result
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

  // Results view
  if (analysis) {
    return (
      <div className="min-h-screen bg-[#0a0a0b]">
        {/* Back bar */}
        <div className="sticky top-0 z-50 bg-[#0a0a0b]/90 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center gap-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-indigo-400 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            New Analysis
          </button>
          <span className="font-mono text-xs text-neutral-600 truncate max-w-xs">{repo}</span>
        </div>

        {/*
          analysis._sourceCode  → set by githubController.js, read by Result internally
          generateTestsFn       → calls POST /api/github/generate-tests
        */}
        <Result
          data={analysis}
          generateTestsFn={generateTests}
          onDownload={() => {
            const blob = new Blob([JSON.stringify(analysis, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            Object.assign(document.createElement("a"), {
              href: url, download: "audit-report.json",
            }).click();
            URL.revokeObjectURL(url);
          }}
        />
      </div>
    );
  }

  // Input view
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Signature: same scanline field used across the auth pages, kept consistent app-wide */}
      <style>{`
        @keyframes cv-scan-sweep {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(320px); opacity: 0; }
        }
        @keyframes cv-blink {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        .cv-sweep { animation: cv-scan-sweep 2.4s ease-in-out 1; }
        .cv-caret { animation: cv-blink 1.1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cv-sweep { animation: none; opacity: 0; }
          .cv-caret { animation: none; }
        }
      `}</style>

      {/* ambient background: sparse dot grid, single accent color, very low opacity */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="w-full max-w-3xl relative">

        {/* Wordmark */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <span className="w-2 h-2 rounded-sm bg-indigo-400" />
            </span>
            <span className="font-mono text-sm tracking-[0.2em] text-neutral-400 uppercase">
              CodeVerify
            </span>
          </div>
        </div>

        {/* Card with scan-corner framing */}
        <div className="relative">
          <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-indigo-500/50 rounded-tl-2xl" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-indigo-500/50 rounded-tr-2xl" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-indigo-500/50 rounded-bl-2xl" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-indigo-500/50 rounded-br-2xl" />

          <div className="relative overflow-hidden bg-[#111113] border border-white/10 rounded-2xl shadow-2xl shadow-black/30 p-6">
            {/* one-time verification sweep line */}
            <div className="cv-sweep pointer-events-none absolute left-0 right-0 h-px bg-indigo-400/70 shadow-[0_0_12px_2px_rgba(99,102,241,0.6)]" />

            {/* Header */}
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                GitHub Repository Analyzer
              </h2>
              <p className="font-mono text-xs text-neutral-600 mt-2">
                <span className="text-indigo-400">$</span> analyze any public repo with AI insights
                <span className="cv-caret text-indigo-400">_</span>
              </p>
            </div>

            {/* Input */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                Repository URL
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-black/40 border border-white/10
                    text-white text-sm placeholder-neutral-600 font-mono
                    focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="https://github.com/username/repository"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyze()}
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600"
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
                  <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.5-1.5" />
                </svg>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 font-mono text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                error: {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center mt-5">
              <span className="font-mono text-[11px] text-neutral-600">
                Supports public repositories only
              </span>

              <button
                onClick={analyze}
                disabled={loading}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors
                  ${loading
                    ? "bg-white/[0.04] text-neutral-600 border border-white/10 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600"
                  }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    verifying…
                  </span>
                ) : (
                  "Generate Report"
                )}
              </button>
            </div>

            {/* Tip */}
            <div className="mt-6 font-mono text-[11px] text-neutral-600 border-t border-white/10 pt-3">
              tip: try popular repos like{" "}
              <span className="text-indigo-400">
                https://github.com/facebook/react
              </span>
            </div>
          </div>
        </div>

        <p className="text-center font-mono text-[11px] text-neutral-700 mt-6 tracking-wide">
          codeverify · repo analysis, verified
        </p>
      </div>
    </div>
  );
}
