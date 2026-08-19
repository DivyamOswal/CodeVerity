import { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import { generateTests as defaultGenerateTests } from "../api/github";
import { usePreferences } from "../context/PreferencesContext";

export default function Result({
  data,
  sourceCode: sourceCodeProp = "",
  onDownload,
  generateTestsFn,
}) {
  const [activeTab, setActiveTab] = useState("audit");
  const [testData, setTestData] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Get preferences
  const { compact, showScores } = usePreferences();

  if (!data) return null;

  const sourceCode = sourceCodeProp || data?._sourceCode || "";

  const doGenerateTests = generateTestsFn ?? defaultGenerateTests;

  const {
    summary = "No summary generated.",
    architecture = [],
    bugs = [],
    securityIssues = [],
    futureRoadmap = [],
    toolsAndPackages = [],
    scores = {},
    grade = "N/A",
    finalVerdict = "No verdict provided.",
  } = data;

  const chartData = [
    { metric: "Code Quality", value: scores.codeQuality || 0 },
    { metric: "Security", value: scores.security || 0 },
    { metric: "Performance", value: scores.performance || 0 },
    { metric: "Maintainability", value: scores.maintainability || 0 },
  ];

  /* =========================================================
     TEST GENERATION
  ========================================================= */

  const runGenerateTests = async () => {
    if (!sourceCode?.trim()) {
      setTestError("No source code available. Please re-run the analysis.");
      return;
    }
    setTestLoading(true);
    setTestError(null);
    try {
      const result = await doGenerateTests(sourceCode);
      setTestData(result);
    } catch (err) {
      setTestError(err.message ?? "Test generation failed.");
    } finally {
      setTestLoading(false);
    }
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (id === "tests" && !testData && !testLoading) {
      runGenerateTests();
    }
  };

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Compact overrides
  const containerPadding = compact ? "px-4 py-4 sm:px-5 lg:px-6" : "px-4 py-6 sm:px-6 lg:px-8";
  const headerMargin = compact ? "pb-3" : "pb-5";
  const headingSize = compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl";
  const gradeBoxPadding = compact ? "px-3 py-2" : "px-4 py-2.5";
  const gradeTextSize = compact ? "text-xl" : "text-2xl";
  const scoreCardGap = compact ? "gap-2" : "gap-3";
  const scoreCardPadding = compact ? "p-2.5" : "p-3.5";
  const glassCardPadding = compact ? "p-3" : "p-4";
  const glassCardHeaderPadding = compact ? "px-3 py-2" : "px-4 py-3";
  const tabPadding = compact ? "px-3 py-2 text-[10px]" : "px-4 py-2.5 text-xs";
  const buttonPadding = compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]";
  const testFilePadding = compact ? "px-2 py-1.5" : "px-3 py-2";
  const testFileFont = compact ? "text-[10px]" : "text-[11px]";
  const codeBlockPadding = compact ? "p-3" : "p-4";
  const codeBlockFont = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-text-[var(--text-primary)] relative overflow-hidden ${containerPadding}`}>
      {/* Green dot grid background – same as Home/CodeInput */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(rgba(63,185,80,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Radial glows */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(35,134,54,0.08) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl space-y-5 relative z-10">
        {/* Corner brackets on the main container */}
        <div className="relative">
          <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-green-500/50 rounded-tl-2xl z-10" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-green-500/50 rounded-tr-2xl z-10" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-green-500/50 rounded-bl-2xl z-10" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-green-500/50 rounded-br-2xl z-10" />
        </div>

        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className={`flex flex-col gap-4 border-b border-[#21262d] ${headerMargin} md:flex-row md:items-center md:justify-between`}>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-sm shadow-lg shadow-green-500/10 ${compact ? "h-6 w-6" : "h-8 w-8"}`}>
                <span className="text-white">⌘</span>
              </div>
              <span className={`font-semibold uppercase tracking-[0.2em] text-[#3fb950] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                CodeVerity
              </span>
            </div>
            <h1 className={`font-bold tracking-tight text-text-[var(--text-primary)] ${headingSize}`}>
              AI Code Analysis Report
            </h1>
            <p className={`mt-1 text-xs text-[#6e7681] ${compact ? "text-[10px]" : ""}`}>
              Detailed analysis of your GitHub repository.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`rounded-xl border border-[#30363d] bg-[#161b22] ${gradeBoxPadding}`}>
              <p className={`font-medium uppercase tracking-wider text-[#6e7681] ${compact ? "text-[8px]" : "text-[9px]"}`}>
                Final Grade
              </p>
              <div className={`mt-0.5 font-bold text-[#3fb950] ${gradeTextSize}`}>{grade}</div>
            </div>
            {onDownload && (
              <button
                onClick={onDownload}
                className={`group relative overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22] font-semibold text-[#c9d1d9] transition-all hover:border-green-500/40 hover:bg-[#21262d] hover:text-[#3fb950] ${compact ? "px-3 py-2 text-[10px]" : "px-4 py-2.5 text-xs"}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>↓</span>
                  {compact ? "PDF" : "Download Report"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            SCORE CARDS – all green/emerald/teal
        ===================================================== */}
        <div className={`grid grid-cols-2 ${scoreCardGap} md:grid-cols-4`}>
          <ScoreCard label="Code Quality" value={scores.codeQuality} icon="◈" color="green" compact={compact} />
          <ScoreCard label="Security" value={scores.security} icon="◇" color="emerald" compact={compact} />
          <ScoreCard label="Performance" value={scores.performance} icon="↗" color="teal" compact={compact} />
          <ScoreCard label="Maintainability" value={scores.maintainability} icon="◎" color="green" compact={compact} />
        </div>

        {/* =====================================================
            TAB BAR
        ===================================================== */}
        <div className="flex items-center border-b border-[#21262d]">
          <div className="flex items-center gap-1">
            {[
              { id: "audit", label: "Audit Report" },
              { id: "tests", label: "Test Cases" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex items-center gap-2 font-medium transition-all ${tabPadding} ${
                  activeTab === tab.id
                    ? "text-text-[var(--text-primary)]"
                    : "text-[#6e7681] hover:text-[#c9d1d9]"
                }`}
              >
                <span
                  className={activeTab === tab.id ? "text-[#3fb950]" : "text-[#484f58]"}
                >
                  {tab.id === "audit" ? "◉" : "◇"}
                </span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#3fb950]" />
                )}
              </button>
            ))}
          </div>
          {!testData && !testLoading && activeTab === "audit" && (
            <button
              onClick={() => handleTabClick("tests")}
              className={`ml-auto mb-1 flex items-center gap-2 rounded-lg border border-[#238636]/40 bg-[#238636]/10 font-semibold text-[#3fb950] transition-all hover:bg-[#238636]/20 ${buttonPadding}`}
            >
              <span>+</span>
              {compact ? "Tests" : "Generate Tests"}
            </button>
          )}
        </div>

        {/* =====================================================
            AUDIT TAB
        ===================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <GlassCard title="Executive Summary" icon="◈" compact={compact}>
              <p className={`leading-6 text-[#8b949e] ${compact ? "text-xs" : "text-sm"}`}>{summary}</p>
            </GlassCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard title="Quality Score Analysis" icon="◎" compact={compact}>
                <div style={{ width: "100%", height: compact ? 220 : 280, minHeight: compact ? 220 : 280 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                    <RadarChart data={chartData}>
                      <PolarGrid stroke="#30363d" />
                      <PolarAngleAxis
                        dataKey="metric"
                        stroke="#6e7681"
                        tick={{ fill: "#8b949e", fontSize: compact ? 9 : 11 }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 100]}
                        stroke="#30363d"
                        tick={{ fill: "#484f58", fontSize: compact ? 7 : 9 }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="#3fb950"
                        fill="#3fb950"
                        fillOpacity={0.18}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard title="Final Verdict" icon="✓" compact={compact}>
                <div className={`flex h-full items-center ${compact ? "min-h-[200px]" : "min-h-[280px]"}`}>
                  <div className="w-full">
                    <div className={`flex items-center gap-3 ${compact ? "mb-3" : "mb-5"}`}>
                      <div className={`flex items-center justify-center rounded-xl border border-[#238636]/30 bg-[#238636]/10 text-[#3fb950] ${compact ? "h-8 w-8" : "h-10 w-10"}`}>
                        ✓
                      </div>
                      <div>
                        <p className={`uppercase tracking-wider text-[#6e7681] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                          Overall Assessment
                        </p>
                        <p className={`font-semibold text-text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}>
                          Repository Analysis Complete
                        </p>
                      </div>
                    </div>
                    <p className={`leading-6 text-[#8b949e] ${compact ? "text-xs" : "text-sm"}`}>{finalVerdict}</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard title="Architecture Review" icon="⌘" compact={compact}>
              {architecture.length ? (
                <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                  {architecture.map((a, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border border-[#21262d] bg-[var(--bg-primary)] transition hover:border-[#30363d] ${compact ? "p-2" : "p-3"}`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`flex items-center justify-center rounded bg-[#238636]/10 text-[10px] text-[#3fb950] ${compact ? "h-4 w-4 text-[8px]" : "h-5 w-5"}`}>
                          {i + 1}
                        </span>
                        <p className={`font-semibold text-[#3fb950] ${compact ? "text-[10px]" : "text-xs"}`}>{a.component}</p>
                      </div>
                      <p className={`pl-7 leading-5 text-[#8b949e] ${compact ? "text-[10px]" : "text-xs"}`}>
                        {a.recommendation || a.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No architecture insights provided." compact={compact} />
              )}
            </GlassCard>

            <GlassCard title="Identified Bugs" icon="!" compact={compact}>
              {bugs.length ? (
                <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                  {bugs.map((b, i) => (
                    <AlertCard key={i} type="error" compact={compact}>
                      <div className="flex items-start gap-3">
                        <div className={`flex shrink-0 items-center justify-center rounded-lg bg-[#f85149]/10 text-[#f85149] ${compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs"}`}>
                          !
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-text-[var(--text-primary)] ${compact ? "text-[10px]" : "text-xs"}`}>
                            {b.title}{" "}
                            <span className="text-[#f85149]">({b.impact})</span>
                          </p>
                          <p className={`mt-1 leading-5 text-[#8b949e] ${compact ? "text-[10px]" : "text-xs"}`}>
                            {b.description}
                          </p>
                          <p className={`mt-2 text-[#3fb950] ${compact ? "text-[10px]" : "text-xs"}`}>
                            <span className="font-semibold">Fix:</span>{" "}
                            {b.suggestedFix || b.fix}
                          </p>
                        </div>
                      </div>
                    </AlertCard>
                  ))}
                </div>
              ) : (
                <EmptyState text="No major bugs detected." compact={compact} />
              )}
            </GlassCard>

            <GlassCard title="Security Assessment" icon="◇" compact={compact}>
              {securityIssues.length ? (
                <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                  {securityIssues.map((s, i) => (
                    <AlertCard key={i} type="warning" compact={compact}>
                      <div className="flex items-start gap-3">
                        <div className={`flex shrink-0 items-center justify-center rounded-lg bg-[#d29922]/10 text-[#d29922] ${compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs"}`}>
                          !
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-text-[var(--text-primary)] ${compact ? "text-[10px]" : "text-xs"}`}>{s.issue}</p>
                          {s.risk && (
                            <p className={`mt-1 text-[#f85149] ${compact ? "text-[10px]" : "text-xs"}`}>Risk: {s.risk}</p>
                          )}
                          <p className={`mt-2 text-[#3fb950] ${compact ? "text-[10px]" : "text-xs"}`}>
                            Recommendation: {s.recommendation}
                          </p>
                        </div>
                      </div>
                    </AlertCard>
                  ))}
                </div>
              ) : (
                <EmptyState text="No critical security issues reported." compact={compact} />
              )}
            </GlassCard>

            <GlassCard title="Future Roadmap" icon="→" compact={compact}>
              {futureRoadmap.length ? (
                <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                  {futureRoadmap.map((f, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 rounded-lg border border-[#21262d] bg-[var(--bg-primary)] ${compact ? "p-2" : "p-3"}`}
                    >
                      <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#238636]/10 text-[#3fb950] ${compact ? "h-5 w-5 text-[8px]" : "h-6 w-6 text-[10px]"}`}>
                        {i + 1}
                      </div>
                      <p className={`leading-5 text-[#8b949e] ${compact ? "text-[10px]" : "text-xs"}`}>
                        <b className="text-[#c9d1d9]">{f.phase || f.feature}:</b>{" "}
                        {f.details || f.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No roadmap generated." compact={compact} />
              )}
            </GlassCard>

            <GlassCard title="Tools & Packages" icon="◇" compact={compact}>
              {toolsAndPackages.length ? (
                <div className={`flex flex-wrap gap-2 ${compact ? "gap-1.5" : ""}`}>
                  {toolsAndPackages.map((t, i) => (
                    <span
                      key={i}
                      className={`rounded-md border border-[#30363d] bg-[#161b22] font-mono text-[#8b949e] transition hover:border-[#3fb950]/40 hover:text-[#3fb950] ${compact ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-1 text-[10px]"}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState text="No tools info available." compact={compact} />
              )}
            </GlassCard>
          </div>
        )}

        {/* =====================================================
            TESTS TAB
        ===================================================== */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            {testLoading && (
              <GlassCard title="Generating Tests..." icon="◌" compact={compact}>
                <div className={`flex flex-col items-center gap-4 ${compact ? "py-8" : "py-12"}`}>
                  <div className="relative">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#30363d] border-t-[#3fb950]" />
                  </div>
                  <div className="text-center">
                    <p className={`font-medium text-[#c9d1d9] ${compact ? "text-xs" : "text-sm"}`}>Analysing repository</p>
                    <p className={`mt-1 text-[#6e7681] ${compact ? "text-[10px]" : "text-xs"}`}>Writing test cases based on your code...</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {testError && !testLoading && (
              <div className="rounded-xl border border-[#f85149]/30 bg-[#f85149]/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f85149]/10 text-[#f85149]">
                    !
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-[var(--text-primary)]">Test Generation Failed</p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#8b949e]">
                      {testError}
                    </p>
                    <button
                      onClick={runGenerateTests}
                      className="mt-3 rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 px-3 py-1.5 text-xs font-medium text-[#f85149] transition hover:bg-[#f85149]/20"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {testData && !testLoading && (
              <>
                <div className={`flex flex-wrap items-center gap-2 ${compact ? "gap-1.5" : ""}`}>
                  <Badge color="green" compact={compact}>Framework: {testData.framework ?? "jest"}</Badge>
                  <Badge color="emerald" compact={compact}>
                    Est. Coverage: {testData.coverageSummary?.estimatedCoverage ?? 0}%
                  </Badge>
                  <span className={`ml-auto text-[#6e7681] ${compact ? "text-[8px]" : "text-[10px]"}`}>
                    {testData.setupInstructions}
                  </span>
                </div>

                {testData.coverageSummary && (
                  <GlassCard title="Coverage Summary" icon="◉" compact={compact}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-[#8b949e] ${compact ? "text-[10px]" : "text-xs"}`}>Estimated Coverage</span>
                        <span className={`font-bold text-[#3fb950] ${compact ? "text-xs" : "text-sm"}`}>
                          {testData.coverageSummary.estimatedCoverage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#21262d]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#238636] to-[#3fb950] transition-all duration-700"
                          style={{ width: `${testData.coverageSummary.estimatedCoverage}%` }}
                        />
                      </div>
                      <p className={`leading-5 text-[#8b949e] ${compact ? "text-[10px]" : "text-xs"}`}>
                        {testData.coverageSummary.recommendation}
                      </p>
                      {testData.coverageSummary.uncoveredAreas?.length > 0 && (
                        <div className={`flex flex-wrap gap-2 pt-1 ${compact ? "gap-1.5" : ""}`}>
                          {testData.coverageSummary.uncoveredAreas.map((a, i) => (
                            <span
                              key={i}
                              className={`rounded-md border border-[#d29922]/20 bg-[#d29922]/5 text-[#d29922] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}

                {testData.testFiles?.length > 0 && (
                  <GlassCard title="Generated Test Files" icon="◇" compact={compact}>
                    <div className={`space-y-3 ${compact ? "space-y-2" : ""}`}>
                      {testData.testFiles.map((file, i) => (
                        <div
                          key={i}
                          className="overflow-hidden rounded-xl border border-[#30363d] bg-[var(--bg-primary)]"
                        >
                          <div className={`flex items-center justify-between border-b border-[#21262d] bg-[#161b22] ${testFilePadding}`}>
                            <span className={`max-w-[60%] truncate font-mono text-[#3fb950] ${testFileFont}`}>
                              {file.fileName}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className={`hidden max-w-[300px] truncate text-[#6e7681] md:block ${compact ? "text-[8px]" : "text-[10px]"}`}>
                                {file.description}
                              </span>
                              <button
                                onClick={() => copy(file.testCode, `file-${i}`)}
                                className={`rounded-md border border-[#30363d] bg-[#21262d] text-[#8b949e] transition hover:text-text-[var(--text-primary)] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
                              >
                                {copiedId === `file-${i}` ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <pre className={`overflow-x-auto bg-[var(--bg-primary)] text-[#8b949e] ${codeBlockPadding} ${codeBlockFont}`}>
                            <code>{file.testCode}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {testData.unitTests?.length > 0 && (
                  <GlassCard title="Unit Tests" icon="◇" compact={compact}>
                    <div className={`space-y-5 ${compact ? "space-y-3" : ""}`}>
                      {testData.unitTests.map((fn, i) => (
                        <div key={i}>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className={`font-mono font-semibold text-[#3fb950] ${compact ? "text-[10px]" : "text-xs"}`}>
                              {fn.functionName}()
                            </span>
                            <span className={`text-[#6e7681] ${compact ? "text-[8px]" : "text-[10px]"}`}>{fn.filePath}</span>
                          </div>
                          <p className={`mb-3 text-[#6e7681] ${compact ? "text-[10px]" : "text-[11px]"}`}>{fn.description}</p>
                          <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                            {fn.cases?.map((c, j) => (
                              <TestCaseRow
                                key={j}
                                testCase={c}
                                id={`unit-${i}-${j}`}
                                copiedId={copiedId}
                                onCopy={copy}
                                compact={compact}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {testData.edgeCases?.length > 0 && (
                  <GlassCard title="Edge Cases" icon="!" compact={compact}>
                    <div className={`space-y-3 ${compact ? "space-y-2" : ""}`}>
                      {testData.edgeCases.map((c, i) => (
                        <div key={i}>
                          <p className={`mb-1 font-mono text-[#d29922] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                            {c.functionName}()
                          </p>
                          <TestCaseRow
                            testCase={c}
                            id={`edge-${i}`}
                            copiedId={copiedId}
                            onCopy={copy}
                            accent="yellow"
                            compact={compact}
                          />
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {testData.integrationTests?.length > 0 && (
                  <GlassCard title="Integration Tests" icon="↗" compact={compact}>
                    <div className={`space-y-3 ${compact ? "space-y-2" : ""}`}>
                      {testData.integrationTests.map((t, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border border-[#21262d] bg-[var(--bg-primary)] ${compact ? "p-3" : "p-4"}`}
                        >
                          <p className={`font-semibold text-text-[var(--text-primary)] ${compact ? "text-[10px]" : "text-xs"}`}>{t.label}</p>
                          <p className={`mb-3 mt-1 text-[#6e7681] ${compact ? "text-[10px]" : "text-[11px]"}`}>{t.description}</p>
                          <div className="relative">
                            <pre className={`overflow-x-auto rounded-lg border border-[#21262d] bg-[#010409] pr-16 text-[#7ee787] ${codeBlockPadding} ${codeBlockFont}`}>
                              <code>{t.codeSnippet}</code>
                            </pre>
                            <button
                              onClick={() => copy(t.codeSnippet, `int-${i}`)}
                              className={`absolute right-2 top-2 rounded-md border border-[#30363d] bg-[#161b22] text-[#8b949e] transition hover:text-text-[var(--text-primary)] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
                            >
                              {copiedId === `int-${i}` ? "✓" : "Copy"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {testData.mocks?.length > 0 && (
                  <GlassCard title="Mocks & Stubs" icon="◇" compact={compact}>
                    <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
                      {testData.mocks.map((m, i) => (
                        <AlertCard key={i} type="warning" compact={compact}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className={`font-mono font-semibold text-[#d29922] ${compact ? "text-[10px]" : "text-xs"}`}>
                                {m.target}
                              </p>
                              <p className={`mt-1 text-[#8b949e] ${compact ? "text-[10px]" : "text-[11px]"}`}>{m.reason}</p>
                              <pre className={`mt-2 overflow-x-auto text-[#d29922] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                                <code>{m.snippet}</code>
                              </pre>
                            </div>
                            <button
                              onClick={() => copy(m.snippet, `mock-${i}`)}
                              className={`shrink-0 rounded-md border border-[#30363d] bg-[#21262d] text-[#8b949e] transition hover:text-text-[var(--text-primary)] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
                            >
                              {copiedId === `mock-${i}` ? "✓" : "Copy"}
                            </button>
                          </div>
                        </AlertCard>
                      ))}
                    </div>
                  </GlassCard>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={runGenerateTests}
                    disabled={testLoading}
                    className={`flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#161b22] font-medium text-[#8b949e] transition hover:border-[#3fb950]/40 hover:bg-[#21262d] hover:text-[#3fb950] disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "px-2 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]"}`}
                  >
                    <span>↻</span>
                    {compact ? "Re-gen" : "Re-generate Tests"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   GLASS CARD – green accent, now accepts compact
========================================================= */
function GlassCard({ title, children, icon, compact }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
      <div className={`flex items-center gap-2 border-b border-[#21262d] ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
        <span className={`flex items-center justify-center rounded-md bg-[#238636]/10 text-[#3fb950] ${compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-[11px]"}`}>
          {icon}
        </span>
        <h2 className={`font-semibold text-[#c9d1d9] ${compact ? "text-[10px]" : "text-xs"}`}>{title}</h2>
      </div>
      <div className={compact ? "p-3" : "p-4"}>{children}</div>
    </div>
  );
}

/* =========================================================
   ALERT CARD – accepts compact
========================================================= */
function AlertCard({ children, type, compact }) {
  const styles = {
    error: "border-[#f85149]/20 bg-[#f85149]/5",
    warning: "border-[#d29922]/20 bg-[#d29922]/5",
  };
  return (
    <div
      className={`rounded-lg border ${compact ? "p-2" : "p-3"} ${
        styles[type] || "border-[#30363d] bg-[#161b22]"
      }`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   SCORE CARD – green/emerald/teal, accepts compact
========================================================= */
function ScoreCard({ label, value, icon, color = "green", compact }) {
  const val = typeof value === "number" ? Math.min(Math.max(value, 0), 100) : 0;

  const colorMap = {
    green: {
      icon: "bg-[#238636]/10 text-[#3fb950]",
      bar: "bg-[#3fb950]",
      number: "text-[#3fb950]",
    },
    emerald: {
      icon: "bg-[#10b981]/10 text-[#10b981]",
      bar: "bg-[#10b981]",
      number: "text-[#10b981]",
    },
    teal: {
      icon: "bg-[#2dd4bf]/10 text-[#2dd4bf]",
      bar: "bg-[#2dd4bf]",
      number: "text-[#2dd4bf]",
    },
  };

  const colors = colorMap[color] || colorMap.green;

  return (
    <div className={`rounded-xl border border-[#30363d] bg-[#161b22] transition-all hover:border-[#484f58] ${compact ? "p-2.5" : "p-3.5"}`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center justify-center rounded-lg text-xs ${colors.icon} ${compact ? "h-6 w-6 text-[10px]" : "h-7 w-7"}`}>
          {icon}
        </div>
        <span className={`uppercase tracking-wider text-[#484f58] ${compact ? "text-[8px]" : "text-[9px]"}`}>
          Score
        </span>
      </div>
      <div className={`flex items-end justify-between ${compact ? "mt-2" : "mt-3"}`}>
        <div>
          <p className={`text-[#6e7681] ${compact ? "text-[9px]" : "text-[10px]"}`}>{label}</p>
          <p className={`mt-0.5 font-bold ${colors.number} ${compact ? "text-lg" : "text-xl"}`}>{val || "N/A"}</p>
        </div>
        <span className={`mb-1 text-[#484f58] ${compact ? "text-[9px]" : "text-[10px]"}`}>/100</span>
      </div>
      <div className={`overflow-hidden rounded-full bg-[#21262d] ${compact ? "mt-1.5 h-0.5" : "mt-2 h-1"}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   BADGE – accepts compact
========================================================= */
function Badge({ children, color = "green", compact }) {
  const colors = {
    green: "border-[#238636]/20 bg-[#238636]/10 text-[#3fb950]",
    emerald: "border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]",
    teal: "border-[#2dd4bf]/20 bg-[#2dd4bf]/10 text-[#2dd4bf]",
    yellow: "border-[#d29922]/20 bg-[#d29922]/10 text-[#d29922]",
  };
  return (
    <span
      className={`rounded-md border font-medium ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[10px]"} ${
        colors[color] || colors.green
      }`}
    >
      {children}
    </span>
  );
}

/* =========================================================
   TEST CASE ROW – accepts compact
========================================================= */
function TestCaseRow({ testCase: c, id, copiedId, onCopy, accent = "indigo", compact }) {
  const accentColors = {
    indigo: "text-[#3fb950]",
    yellow: "text-[#d29922]",
  };
  return (
    <div className={`rounded-lg border border-[#21262d] bg-[var(--bg-primary)] ${compact ? "p-2" : "p-3"}`}>
      <div className={`flex items-center gap-2 ${compact ? "mb-1.5" : "mb-2"}`}>
        <TypeBadge type={c.type} compact={compact} />
        <span className={`text-[#8b949e] ${compact ? "text-[10px]" : "text-[11px]"}`}>{c.label}</span>
      </div>
      <div className={`flex flex-col gap-1 text-[#6e7681] sm:flex-row sm:gap-5 ${compact ? "text-[9px]" : "text-[10px]"}`}>
        <span>
          Input: <span className="text-[#8b949e]">{c.input}</span>
        </span>
        <span>
          Expected: <span className="text-[#8b949e]">{c.expected}</span>
        </span>
      </div>
      {c.codeSnippet && (
        <div className="relative">
          <pre
            className={`overflow-x-auto rounded-lg border border-[#21262d] bg-[#010409] pr-12 ${
              accentColors[accent] || "text-[#3fb950]"
            } ${compact ? "p-2 text-[9px]" : "p-3 text-[10px]"}`}
          >
            <code>{c.codeSnippet}</code>
          </pre>
          <button
            onClick={() => onCopy(c.codeSnippet, id)}
            className={`absolute right-2 top-2 rounded-md border border-[#30363d] bg-[#161b22] text-[#8b949e] transition hover:text-text-[var(--text-primary)] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
          >
            {copiedId === id ? "✓" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TYPE BADGE – accepts compact
========================================================= */
function TypeBadge({ type, compact }) {
  const map = {
    unit: {
      label: "unit",
      cls: "border-[#8957e5]/20 bg-[#8957e5]/10 text-[#a371f7]",
    },
    edge: {
      label: "edge",
      cls: "border-[#d29922]/20 bg-[#d29922]/10 text-[#d29922]",
    },
    integration: {
      label: "integration",
      cls: "border-[#0891b2]/20 bg-[#0891b2]/10 text-[#22d3ee]",
    },
  };
  const { label, cls } = map[type] ?? {
    label: type,
    cls: "border-[#30363d] bg-[#21262d] text-[#8b949e]",
  };
  return (
    <span
      className={`rounded border font-mono uppercase tracking-wide ${compact ? "px-1 py-0.5 text-[7px]" : "px-1.5 py-0.5 text-[9px]"} ${cls}`}
    >
      {label}
    </span>
  );
}

/* =========================================================
   EMPTY STATE – accepts compact
========================================================= */
function EmptyState({ text, compact }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border border-dashed border-[#30363d] bg-[var(--bg-primary)] ${compact ? "px-2 py-2" : "px-3 py-4"}`}>
      <span className={`text-[#484f58] ${compact ? "text-[9px]" : "text-xs"}`}>○</span>
      <p className={`text-[#6e7681] ${compact ? "text-[9px]" : "text-xs"}`}>{text}</p>
    </div>
  );
}