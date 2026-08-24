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

// -----------------------------------------------------------------
// Grade colors — deliberately distinct hues per letter (A..F is
// semantic status, same reasoning as History.jsx's gradeStyle, not
// brand decoration). Kept as its own small map here since this file
// doesn't share a module with History.jsx.
// -----------------------------------------------------------------
function gradeStyle(letter) {
  const map = {
    A: { text: "text-emerald-400", box: "border-emerald-500/30 bg-emerald-500/10" },
    B: { text: "text-blue-400", box: "border-blue-500/30 bg-blue-500/10" },
    C: { text: "text-yellow-400", box: "border-yellow-500/30 bg-yellow-500/10" },
    D: { text: "text-orange-400", box: "border-orange-500/30 bg-orange-500/10" },
    F: { text: "text-red-400", box: "border-red-500/30 bg-red-500/10" },
  };
  return map[letter] ?? { text: "text-[var(--text-muted)]", box: "border-[var(--border-light)] bg-[var(--bg-card)]" };
}

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

  const gradeColors = gradeStyle((grade ?? "N/A")[0]);

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
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden ${containerPadding}`}>
      {/* Indigo dot grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Radial glows */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl space-y-5 relative z-10">
        {/* Corner brackets */}
        <div className="relative">
          <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[var(--accent)]/50 rounded-tl-2xl z-10" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[var(--accent)]/50 rounded-tr-2xl z-10" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[var(--accent)]/50 rounded-bl-2xl z-10" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[var(--accent)]/50 rounded-br-2xl z-10" />
        </div>

        {/* HEADER */}
        <div className={`flex flex-col gap-4 border-b border-[var(--border-dark)] ${headerMargin} md:flex-row md:items-center md:justify-between`}>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className={`flex items-center justify-center rounded-lg bg-[var(--accent)] text-sm shadow-lg shadow-[var(--accent-soft-strong)] ${compact ? "h-6 w-6" : "h-8 w-8"}`}>
                <span className="text-[var(--accent-contrast,#ffffff)]">⌘</span>
              </div>
              <span className={`font-semibold uppercase tracking-[0.2em] text-[var(--accent)] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                CodeVerity
              </span>
            </div>
            <h1 className={`font-bold tracking-tight text-[var(--text-primary)] ${headingSize}`}>
              AI Code Analysis Report
            </h1>
            <p className={`mt-1 text-xs text-[var(--text-muted)] ${compact ? "text-[10px]" : ""}`}>
              Detailed analysis of your GitHub repository.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Grade box — colored per letter (A=green .. F=red), same
                semantic mapping as History.jsx, instead of always
                green regardless of the actual grade. */}
            <div className={`rounded-xl border ${gradeColors.box} ${gradeBoxPadding}`}>
              <p className={`font-medium uppercase tracking-wider text-[var(--text-muted)] ${compact ? "text-[8px]" : "text-[9px]"}`}>
                Final Grade
              </p>
              <div className={`mt-0.5 font-bold ${gradeColors.text} ${gradeTextSize}`}>{grade}</div>
            </div>
            {onDownload && (
              <button
                onClick={onDownload}
                className={`group relative overflow-hidden rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] font-semibold text-[var(--text-secondary)] transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] ${compact ? "px-3 py-2 text-[10px]" : "px-4 py-2.5 text-xs"}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>↓</span>
                  {compact ? "PDF" : "Download Report"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* SCORE CARDS — one accent color throughout (not three
            separate hues) so the four cards read as a set, same
            principle already applied to CodeInput's feature cards. */}
        <div className={`grid grid-cols-2 ${scoreCardGap} md:grid-cols-4`}>
          <ScoreCard label="Code Quality" value={scores.codeQuality} icon="◈" compact={compact} />
          <ScoreCard label="Security" value={scores.security} icon="◇" compact={compact} />
          <ScoreCard label="Performance" value={scores.performance} icon="↗" compact={compact} />
          <ScoreCard label="Maintainability" value={scores.maintainability} icon="◎" compact={compact} />
        </div>

        {/* TAB BAR */}
        <div className="flex items-center border-b border-[var(--border-dark)]">
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
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <span
                  className={activeTab === tab.id ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}
                >
                  {tab.id === "audit" ? "◉" : "◇"}
                </span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[var(--accent)]" />
                )}
              </button>
            ))}
          </div>
          {!testData && !testLoading && activeTab === "audit" && (
            <button
              onClick={() => handleTabClick("tests")}
              className={`ml-auto mb-1 flex items-center gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent-soft-strong)] ${buttonPadding}`}
            >
              <span>+</span>
              {compact ? "Tests" : "Generate Tests"}
            </button>
          )}
        </div>

        {/* AUDIT TAB */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <GlassCard title="Executive Summary" icon="◈" compact={compact}>
              <p className={`leading-6 text-[var(--text-secondary)] ${compact ? "text-xs" : "text-sm"}`}>{summary}</p>
            </GlassCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard title="Quality Score Analysis" icon="◎" compact={compact}>
                <div style={{ width: "100%", height: compact ? 220 : 280, minHeight: compact ? 220 : 280 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                    <RadarChart data={chartData}>
                      <PolarGrid stroke="var(--border-light)" />
                      <PolarAngleAxis
                        dataKey="metric"
                        stroke="var(--text-muted)"
                        tick={{ fill: "var(--text-secondary)", fontSize: compact ? 9 : 11 }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 100]}
                        stroke="var(--border-light)"
                        tick={{ fill: "var(--text-muted)", fontSize: compact ? 7 : 9 }}
                      />
                      {/* recharts renders these as raw SVG attributes, which
                          don't reliably resolve CSS custom properties across
                          browsers — using the literal accent hex instead of
                          var(--accent) here. */}
                      <Radar
                        dataKey="value"
                        stroke="#6366f1"
                        fill="#6366f1"
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
                      <div className={`flex items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] ${compact ? "h-8 w-8" : "h-10 w-10"}`}>
                        ✓
                      </div>
                      <div>
                        <p className={`uppercase tracking-wider text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                          Overall Assessment
                        </p>
                        <p className={`font-semibold text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}>
                          Repository Analysis Complete
                        </p>
                      </div>
                    </div>
                    <p className={`leading-6 text-[var(--text-secondary)] ${compact ? "text-xs" : "text-sm"}`}>{finalVerdict}</p>
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
                      className={`rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] transition hover:border-[var(--border-light)] ${compact ? "p-2" : "p-3"}`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`flex items-center justify-center rounded bg-[var(--accent-soft)] text-[10px] text-[var(--accent)] ${compact ? "h-4 w-4 text-[8px]" : "h-5 w-5"}`}>
                          {i + 1}
                        </span>
                        <p className={`font-semibold text-[var(--accent)] ${compact ? "text-[10px]" : "text-xs"}`}>{a.component}</p>
                      </div>
                      <p className={`pl-7 leading-5 text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-xs"}`}>
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
                        <div className={`flex shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 ${compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs"}`}>
                          !
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-[var(--text-primary)] ${compact ? "text-[10px]" : "text-xs"}`}>
                            {b.title}{" "}
                            <span className="text-red-400">({b.impact})</span>
                          </p>
                          <p className={`mt-1 leading-5 text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-xs"}`}>
                            {b.description}
                          </p>
                          <p className={`mt-2 text-[var(--accent)] ${compact ? "text-[10px]" : "text-xs"}`}>
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
                        <div className={`flex shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ${compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs"}`}>
                          !
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-[var(--text-primary)] ${compact ? "text-[10px]" : "text-xs"}`}>{s.issue}</p>
                          {s.risk && (
                            <p className={`mt-1 text-red-400 ${compact ? "text-[10px]" : "text-xs"}`}>Risk: {s.risk}</p>
                          )}
                          <p className={`mt-2 text-[var(--accent)] ${compact ? "text-[10px]" : "text-xs"}`}>
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
                      className={`flex gap-3 rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] ${compact ? "p-2" : "p-3"}`}
                    >
                      <div className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] ${compact ? "h-5 w-5 text-[8px]" : "h-6 w-6 text-[10px]"}`}>
                        {i + 1}
                      </div>
                      <p className={`leading-5 text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-xs"}`}>
                        <b className="text-[var(--text-primary)]">{f.phase || f.feature}:</b>{" "}
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
                      className={`rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] font-mono text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)] ${compact ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-1 text-[10px]"}`}
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

        {/* TESTS TAB */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            {testLoading && (
              <GlassCard title="Generating Tests..." icon="◌" compact={compact}>
                <div className={`flex flex-col items-center gap-4 ${compact ? "py-8" : "py-12"}`}>
                  <div className="relative">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
                  </div>
                  <div className="text-center">
                    <p className={`font-medium text-[var(--text-secondary)] ${compact ? "text-xs" : "text-sm"}`}>Analysing repository</p>
                    <p className={`mt-1 text-[var(--text-muted)] ${compact ? "text-[10px]" : "text-xs"}`}>Writing test cases based on your code...</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {testError && !testLoading && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                    !
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Test Generation Failed</p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[var(--text-secondary)]">
                      {testError}
                    </p>
                    <button
                      onClick={runGenerateTests}
                      className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
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
                  <Badge color="accent" compact={compact}>Framework: {testData.framework ?? "jest"}</Badge>
                  <Badge color="accent" compact={compact}>
                    Est. Coverage: {testData.coverageSummary?.estimatedCoverage ?? 0}%
                  </Badge>
                  <span className={`ml-auto text-[var(--text-muted)] ${compact ? "text-[8px]" : "text-[10px]"}`}>
                    {testData.setupInstructions}
                  </span>
                </div>

                {testData.coverageSummary && (
                  <GlassCard title="Coverage Summary" icon="◉" compact={compact}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-xs"}`}>Estimated Coverage</span>
                        <span className={`font-bold text-[var(--accent)] ${compact ? "text-xs" : "text-sm"}`}>
                          {testData.coverageSummary.estimatedCoverage}%
                        </span>
                      </div>
                      {/* Flat accent fill, no gradient */}
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--border-dark)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                          style={{ width: `${testData.coverageSummary.estimatedCoverage}%` }}
                        />
                      </div>
                      <p className={`leading-5 text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-xs"}`}>
                        {testData.coverageSummary.recommendation}
                      </p>
                      {testData.coverageSummary.uncoveredAreas?.length > 0 && (
                        <div className={`flex flex-wrap gap-2 pt-1 ${compact ? "gap-1.5" : ""}`}>
                          {testData.coverageSummary.uncoveredAreas.map((a, i) => (
                            <span
                              key={i}
                              className={`rounded-md border border-amber-500/20 bg-amber-500/5 text-amber-400 ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
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
                          className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)]"
                        >
                          <div className={`flex items-center justify-between border-b border-[var(--border-dark)] bg-[var(--bg-card)] ${testFilePadding}`}>
                            <span className={`max-w-[60%] truncate font-mono text-[var(--accent)] ${testFileFont}`}>
                              {file.fileName}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className={`hidden max-w-[300px] truncate text-[var(--text-muted)] md:block ${compact ? "text-[8px]" : "text-[10px]"}`}>
                                {file.description}
                              </span>
                              <button
                                onClick={() => copy(file.testCode, `file-${i}`)}
                                className={`rounded-md border border-[var(--border-light)] bg-[var(--bg-hover)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
                              >
                                {copiedId === `file-${i}` ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <pre className={`overflow-x-auto bg-[var(--bg-primary)] text-[var(--text-secondary)] ${codeBlockPadding} ${codeBlockFont}`}>
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
                            <span className={`font-mono font-semibold text-[var(--accent)] ${compact ? "text-[10px]" : "text-xs"}`}>
                              {fn.functionName}()
                            </span>
                            <span className={`text-[var(--text-muted)] ${compact ? "text-[8px]" : "text-[10px]"}`}>{fn.filePath}</span>
                          </div>
                          <p className={`mb-3 text-[var(--text-muted)] ${compact ? "text-[10px]" : "text-[11px]"}`}>{fn.description}</p>
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
                          <p className={`mb-1 font-mono text-amber-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
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
                          className={`rounded-xl border border-[var(--border-dark)] bg-[var(--bg-primary)] ${compact ? "p-3" : "p-4"}`}
                        >
                          <p className={`font-semibold text-[var(--text-primary)] ${compact ? "text-[10px]" : "text-xs"}`}>{t.label}</p>
                          <p className={`mb-3 mt-1 text-[var(--text-muted)] ${compact ? "text-[10px]" : "text-[11px]"}`}>{t.description}</p>
                          <div className="relative">
                            <pre className={`overflow-x-auto rounded-lg border border-[var(--border-dark)] bg-[#0a0a0f] pr-16 text-[var(--accent)] ${codeBlockPadding} ${codeBlockFont}`}>
                              <code>{t.codeSnippet}</code>
                            </pre>
                            <button
                              onClick={() => copy(t.codeSnippet, `int-${i}`)}
                              className={`absolute right-2 top-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
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
                              <p className={`font-mono font-semibold text-amber-400 ${compact ? "text-[10px]" : "text-xs"}`}>
                                {m.target}
                              </p>
                              <p className={`mt-1 text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-[11px]"}`}>{m.reason}</p>
                              <pre className={`mt-2 overflow-x-auto text-amber-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                                <code>{m.snippet}</code>
                              </pre>
                            </div>
                            <button
                              onClick={() => copy(m.snippet, `mock-${i}`)}
                              className={`shrink-0 rounded-md border border-[var(--border-light)] bg-[var(--bg-hover)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
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
                    className={`flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "px-2 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]"}`}
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
   GLASS CARD – accepts compact
========================================================= */
function GlassCard({ title, children, icon, compact }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
      <div className={`flex items-center gap-2 border-b border-[var(--border-dark)] ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
        <span className={`flex items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)] ${compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-[11px]"}`}>
          {icon}
        </span>
        <h2 className={`font-semibold text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-xs"}`}>{title}</h2>
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
    error: "border-red-500/20 bg-red-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
  };
  return (
    <div
      className={`rounded-lg border ${compact ? "p-2" : "p-3"} ${
        styles[type] || "border-[var(--border-light)] bg-[var(--bg-card)]"
      }`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   SCORE CARD – single accent color (not three separate hues),
   accepts compact. Matches the "one color, several intensities"
   principle already used for CodeInput's feature cards.
========================================================= */
function ScoreCard({ label, value, icon, compact }) {
  const val = typeof value === "number" ? Math.min(Math.max(value, 0), 100) : 0;

  return (
    <div className={`rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] transition-all hover:border-[var(--border-medium)] ${compact ? "p-2.5" : "p-3.5"}`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs ${compact ? "h-6 w-6 text-[10px]" : "h-7 w-7"}`}>
          {icon}
        </div>
        <span className={`uppercase tracking-wider text-[var(--text-muted)] ${compact ? "text-[8px]" : "text-[9px]"}`}>
          Score
        </span>
      </div>
      <div className={`flex items-end justify-between ${compact ? "mt-2" : "mt-3"}`}>
        <div>
          <p className={`text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-[10px]"}`}>{label}</p>
          <p className={`mt-0.5 font-bold text-[var(--accent)] ${compact ? "text-lg" : "text-xl"}`}>{val || "N/A"}</p>
        </div>
        <span className={`mb-1 text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-[10px]"}`}>/100</span>
      </div>
      <div className={`overflow-hidden rounded-full bg-[var(--border-dark)] ${compact ? "mt-1.5 h-0.5" : "mt-2 h-1"}`}>
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   BADGE – accepts compact. "accent" is the normal case; "yellow"
   stays as a distinct semantic warning color.
========================================================= */
function Badge({ children, color = "accent", compact }) {
  const colors = {
    accent: "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]",
    yellow: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  };
  return (
    <span
      className={`rounded-md border font-medium ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[10px]"} ${
        colors[color] || colors.accent
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
  // Fixed: this map's "indigo" key was previously pointing at a
  // hardcoded green hex despite its name — now it's the actual accent.
  const accentColors = {
    indigo: "text-[var(--accent)]",
    yellow: "text-amber-400",
  };
  return (
    <div className={`rounded-lg border border-[var(--border-dark)] bg-[var(--bg-primary)] ${compact ? "p-2" : "p-3"}`}>
      <div className={`flex items-center gap-2 ${compact ? "mb-1.5" : "mb-2"}`}>
        <TypeBadge type={c.type} compact={compact} />
        <span className={`text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-[11px]"}`}>{c.label}</span>
      </div>
      <div className={`flex flex-col gap-1 text-[var(--text-muted)] sm:flex-row sm:gap-5 ${compact ? "text-[9px]" : "text-[10px]"}`}>
        <span>
          Input: <span className="text-[var(--text-secondary)]">{c.input}</span>
        </span>
        <span>
          Expected: <span className="text-[var(--text-secondary)]">{c.expected}</span>
        </span>
      </div>
      {c.codeSnippet && (
        <div className="relative">
          <pre
            className={`overflow-x-auto rounded-lg border border-[var(--border-dark)] bg-[#0a0a0f] pr-12 ${
              accentColors[accent] || "text-[var(--accent)]"
            } ${compact ? "p-2 text-[9px]" : "p-3 text-[10px]"}`}
          >
            <code>{c.codeSnippet}</code>
          </pre>
          <button
            onClick={() => onCopy(c.codeSnippet, id)}
            className={`absolute right-2 top-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] ${compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"}`}
          >
            {copiedId === id ? "✓" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TYPE BADGE – kept as distinct hues per type (unit/edge/
   integration is a semantic category, same reasoning as the grade
   colors), accepts compact
========================================================= */
function TypeBadge({ type, compact }) {
  const map = {
    unit: {
      label: "unit",
      cls: "border-purple-500/20 bg-purple-500/10 text-purple-400",
    },
    edge: {
      label: "edge",
      cls: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    },
    integration: {
      label: "integration",
      cls: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
    },
  };
  const { label, cls } = map[type] ?? {
    label: type,
    cls: "border-[var(--border-light)] bg-[var(--bg-hover)] text-[var(--text-secondary)]",
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
    <div className={`flex items-center gap-2 rounded-lg border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] ${compact ? "px-2 py-2" : "px-3 py-4"}`}>
      <span className={`text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-xs"}`}>○</span>
      <p className={`text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-xs"}`}>{text}</p>
    </div>
  );
}