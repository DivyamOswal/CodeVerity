import { useState } from "react";
import { analyzeCode } from "../api/analyze";

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
    <div className="min-h-screen bg-[#0d1117] text-white px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* ================= HEADER ================= */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white"
                >
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                  <path d="M7 7l5-4 5 4" />
                  <path d="M7 17l5 4 5-4" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-medium tracking-wide text-blue-400">
                  CODEVERITY
                </p>
                <p className="text-xs text-gray-500">
                  Intelligent code review
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Review your code
              <span className="ml-2 bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                smarter.
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
              Analyze your code with AI and identify bugs, security issues,
              performance problems, and improvement opportunities.
            </p>
          </div>

          {/* Model Badge */}
          <div className="flex w-fit items-center gap-3 rounded-xl border border-[#30363d] bg-[#161b22] px-4 py-3">
            <div className="relative">
              <span className="block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-30" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                AI Model
              </p>
              <p className="text-sm font-medium text-gray-200">
                {model || "Default Model"}
              </p>
            </div>
          </div>
        </div>

        {/* ================= EDITOR CARD ================= */}
        <div className="overflow-hidden rounded-2xl border border-[#30363d] bg-[#161b22] shadow-2xl shadow-black/30">

          {/* Editor Header */}
          <div className="flex items-center justify-between border-b border-[#30363d] bg-[#0d1117] px-4 py-3 sm:px-5">

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>

              <div className="hidden h-5 w-px bg-[#30363d] sm:block" />

              <div className="flex items-center gap-2 text-sm text-gray-400">
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

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="hidden sm:inline">Paste your source</span>
              <span className="rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1">
                Editor
              </span>
            </div>
          </div>

          {/* Code Area */}
          <div className="relative">

            {/* Line Numbers */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 hidden w-14 border-r border-[#21262d] bg-[#0d1117] pt-5 text-right font-mono text-xs leading-6 text-gray-600 sm:block">
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
  // CodeVerity will analyze your code
  // for bugs, security, performance & quality.
}`}
              spellCheck={false}
              className="min-h-[420px] w-full resize-none bg-[#0d1117] p-5 font-mono text-sm leading-6 text-gray-200 outline-none placeholder:text-gray-700 sm:pl-[76px]"
            />
          </div>

          {/* ================= EDITOR FOOTER ================= */}
          <div className="flex flex-col gap-4 border-t border-[#30363d] bg-[#0d1117] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

            {/* Editor Stats */}
            <div className="flex items-center gap-5 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
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
                transition-all duration-200
                ${
                  loading || !code.trim()
                    ? "cursor-not-allowed bg-[#30363d] text-gray-500"
                    : "bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:from-blue-500 hover:to-violet-500 hover:shadow-blue-500/30"
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

                  Reviewing...
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

        {/* ================= FEATURE CARDS ================= */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-blue-500/40">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
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

            <h3 className="text-sm font-semibold text-gray-200">
              Security Analysis
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Detect potential vulnerabilities and unsafe patterns.
            </p>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-violet-500/40">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
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

            <h3 className="text-sm font-semibold text-gray-200">
              Performance
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Find inefficient logic and performance bottlenecks.
            </p>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-emerald-500/40">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
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

            <h3 className="text-sm font-semibold text-gray-200">
              Code Quality
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Get actionable suggestions to make your code cleaner.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
          <span>Powered by</span>
          <span className="font-semibold text-gray-500">CodeVerity AI</span>
          <span>•</span>
          <span>Built for developers</span>
        </div>

      </div>
    </div>
  );
}

