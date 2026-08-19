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
    {
      metric: "Code Quality",
      value: scores.codeQuality || 0,
    },
    {
      metric: "Security",
      value: scores.security || 0,
    },
    {
      metric: "Performance",
      value: scores.performance || 0,
    },
    {
      metric: "Maintainability",
      value: scores.maintainability || 0,
    },
  ];

  /* =========================================================
     TEST GENERATION
  ========================================================= */

  const runGenerateTests = async () => {
    if (!sourceCode?.trim()) {
      setTestError(
        "No source code available. Please re-run the analysis."
      );
      return;
    }

    setTestLoading(true);
    setTestError(null);

    try {
      const result = await doGenerateTests(sourceCode);
      setTestData(result);
    } catch (err) {
      setTestError(
        err.message ?? "Test generation failed."
      );
    } finally {
      setTestLoading(false);
    }
  };

  const handleTabClick = (id) => {
    setActiveTab(id);

    if (
      id === "tests" &&
      !testData &&
      !testLoading
    ) {
      runGenerateTests();
    }
  };

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 py-6 text-[#f0f6fc] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-4 border-b border-[#21262d] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-sm shadow-lg shadow-green-500/10">
                <span className="text-white">⌘</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3fb950]">
                CodeVerity
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#f0f6fc] md:text-3xl">
              AI Code Analysis Report
            </h1>
            <p className="mt-1 text-xs text-[#6e7681]">
              Detailed analysis of your GitHub repository.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Grade */}
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] px-4 py-2.5">
              <p className="text-[9px] font-medium uppercase tracking-wider text-[#6e7681]">
                Final Grade
              </p>
              <div className="mt-0.5 text-2xl font-bold text-[#3fb950]">
                {grade}
              </div>
            </div>

            {/* Download */}
            {onDownload && (
              <button
                onClick={onDownload}
                className="group relative overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2.5 text-xs font-semibold text-[#c9d1d9] transition-all hover:border-green-500/40 hover:bg-[#21262d] hover:text-[#3fb950]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>↓</span>
                  Download Report
                </span>
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            SCORE CARDS – now using green/emerald/teal palette
        ===================================================== */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ScoreCard
            label="Code Quality"
            value={scores.codeQuality}
            icon="◈"
            color="green"
          />
          <ScoreCard
            label="Security"
            value={scores.security}
            icon="◇"
            color="emerald"
          />
          <ScoreCard
            label="Performance"
            value={scores.performance}
            icon="↗"
            color="teal"
          />
          <ScoreCard
            label="Maintainability"
            value={scores.maintainability}
            icon="◎"
            color="blue" // we can keep blue for contrast, but we'll use a dark green variant or keep as is; I'll use emerald.
            // Actually we want all green-ish, so we'll map to a darker green.
          />
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
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "text-[#f0f6fc]"
                    : "text-[#6e7681] hover:text-[#c9d1d9]"
                }`}
              >
                <span
                  className={
                    activeTab === tab.id
                      ? "text-[#3fb950]"
                      : "text-[#484f58]"
                  }
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

          {!testData &&
            !testLoading &&
            activeTab === "audit" && (
              <button
                onClick={() => handleTabClick("tests")}
                className="ml-auto mb-1 flex items-center gap-2 rounded-lg border border-[#238636]/40 bg-[#238636]/10 px-3 py-1.5 text-[11px] font-semibold text-[#3fb950] transition-all hover:bg-[#238636]/20"
              >
                <span>+</span>
                Generate Tests
              </button>
            )}
        </div>

        {/* =====================================================
            AUDIT TAB
        ===================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            {/* Executive Summary */}
            <GlassCard title="Executive Summary" icon="◈">
              <p className="text-sm leading-6 text-[#8b949e]">
                {summary}
              </p>
            </GlassCard>

            {/* Chart + Verdict */}
            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard title="Quality Score Analysis" icon="◎">
                <div style={{ width: "100%", height: 280, minHeight: 280 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                    <RadarChart data={chartData}>
                      <PolarGrid stroke="#30363d" />
                      <PolarAngleAxis
                        dataKey="metric"
                        stroke="#6e7681"
                        tick={{ fill: "#8b949e", fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 100]}
                        stroke="#30363d"
                        tick={{ fill: "#484f58", fontSize: 9 }}
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

              <GlassCard title="Final Verdict" icon="✓">
                <div className="flex h-full min-h-[280px] items-center">
                  <div className="w-full">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#238636]/30 bg-[#238636]/10 text-[#3fb950]">
                        ✓
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#6e7681]">
                          Overall Assessment
                        </p>
                        <p className="text-sm font-semibold text-[#f0f6fc]">
                          Repository Analysis Complete
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-[#8b949e]">
                      {finalVerdict}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Architecture */}
            <GlassCard title="Architecture Review" icon="⌘">
              {architecture.length ? (
                <div className="space-y-2">
                  {architecture.map((a, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[#21262d] bg-[#0d1117] p-3 transition hover:border-[#30363d]"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#238636]/10 text-[10px] text-[#3fb950]">
                          {i + 1}
                        </span>
                        <p className="text-xs font-semibold text-[#3fb950]">
                          {a.component}
                        </p>
                      </div>
                      <p className="pl-7 text-xs leading-5 text-[#8b949e]">
                        {a.recommendation || a.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No architecture insights provided." />
              )}
            </GlassCard>

            {/* Bugs */}
            <GlassCard title="Identified Bugs" icon="!">
              {bugs.length ? (
                <div className="space-y-2">
                  {bugs.map((b, i) => (
                    <AlertCard key={i} type="error">
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f85149]/10 text-xs text-[#f85149]">
                          !
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#f0f6fc]">
                            {b.title}{" "}
                            <span className="text-[#f85149]">
                              ({b.impact})
                            </span>
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8b949e]">
                            {b.description}
                          </p>
                          <p className="mt-2 text-xs text-[#3fb950]">
                            <span className="font-semibold">Fix:</span>{" "}
                            {b.suggestedFix || b.fix}
                          </p>
                        </div>
                      </div>
                    </AlertCard>
                  ))}
                </div>
              ) : (
                <EmptyState text="No major bugs detected." />
              )}
            </GlassCard>

            {/* Security */}
            <GlassCard title="Security Assessment" icon="◇">
              {securityIssues.length ? (
                <div className="space-y-2">
                  {securityIssues.map((s, i) => (
                    <AlertCard key={i} type="warning">
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d29922]/10 text-xs text-[#d29922]">
                          !
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#f0f6fc]">
                            {s.issue}
                          </p>
                          {s.risk && (
                            <p className="mt-1 text-xs text-[#f85149]">
                              Risk: {s.risk}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-[#3fb950]">
                            Recommendation: {s.recommendation}
                          </p>
                        </div>
                      </div>
                    </AlertCard>
                  ))}
                </div>
              ) : (
                <EmptyState text="No critical security issues reported." />
              )}
            </GlassCard>

            {/* Future Roadmap */}
            <GlassCard title="Future Roadmap" icon="→">
              {futureRoadmap.length ? (
                <div className="space-y-2">
                  {futureRoadmap.map((f, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-lg border border-[#21262d] bg-[#0d1117] p-3"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#238636]/10 text-[10px] text-[#3fb950]">
                        {i + 1}
                      </div>
                      <p className="text-xs leading-5 text-[#8b949e]">
                        <b className="text-[#c9d1d9]">
                          {f.phase || f.feature}:
                        </b>{" "}
                        {f.details || f.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No roadmap generated." />
              )}
            </GlassCard>

            {/* Tools */}
            <GlassCard title="Tools & Packages" icon="◇">
              {toolsAndPackages.length ? (
                <div className="flex flex-wrap gap-2">
                  {toolsAndPackages.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1 text-[10px] font-mono text-[#8b949e] transition hover:border-[#3fb950]/40 hover:text-[#3fb950]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState text="No tools info available." />
              )}
            </GlassCard>
          </div>
        )}

        {/* =====================================================
            TESTS TAB
        ===================================================== */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            {/* Loading */}
            {testLoading && (
              <GlassCard title="Generating Tests..." icon="◌">
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="relative">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#30363d] border-t-[#3fb950]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#c9d1d9]">
                      Analysing repository
                    </p>
                    <p className="mt-1 text-xs text-[#6e7681]">
                      Writing test cases based on your code...
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Error */}
            {testError && !testLoading && (
              <div className="rounded-xl border border-[#f85149]/30 bg-[#f85149]/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f85149]/10 text-[#f85149]">
                    !
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f0f6fc]">
                      Test Generation Failed
                    </p>
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

            {/* Test Data */}
            {testData && !testLoading && (
              <>
                {/* Test Meta */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="green">
                    Framework: {testData.framework ?? "jest"}
                  </Badge>
                  <Badge color="emerald">
                    Est. Coverage: {testData.coverageSummary?.estimatedCoverage ?? 0}%
                  </Badge>
                  <span className="ml-auto text-[10px] text-[#6e7681]">
                    {testData.setupInstructions}
                  </span>
                </div>

                {/* Coverage */}
                {testData.coverageSummary && (
                  <GlassCard title="Coverage Summary" icon="◉">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8b949e]">
                          Estimated Coverage
                        </span>
                        <span className="text-sm font-bold text-[#3fb950]">
                          {testData.coverageSummary.estimatedCoverage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#21262d]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#238636] to-[#3fb950] transition-all duration-700"
                          style={{
                            width: `${testData.coverageSummary.estimatedCoverage}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs leading-5 text-[#8b949e]">
                        {testData.coverageSummary.recommendation}
                      </p>
                      {testData.coverageSummary.uncoveredAreas?.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {testData.coverageSummary.uncoveredAreas.map((a, i) => (
                            <span
                              key={i}
                              className="rounded-md border border-[#d29922]/20 bg-[#d29922]/5 px-2 py-1 text-[10px] text-[#d29922]"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}

                {/* Generated Test Files */}
                {testData.testFiles?.length > 0 && (
                  <GlassCard title="Generated Test Files" icon="◇">
                    <div className="space-y-3">
                      {testData.testFiles.map((file, i) => (
                        <div
                          key={i}
                          className="overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117]"
                        >
                          <div className="flex items-center justify-between border-b border-[#21262d] bg-[#161b22] px-3 py-2">
                            <span className="max-w-[60%] truncate text-[11px] font-mono text-[#3fb950]">
                              {file.fileName}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="hidden max-w-[300px] truncate text-[10px] text-[#6e7681] md:block">
                                {file.description}
                              </span>
                              <button
                                onClick={() =>
                                  copy(file.testCode, `file-${i}`)
                                }
                                className="rounded-md border border-[#30363d] bg-[#21262d] px-2 py-1 text-[10px] text-[#8b949e] transition hover:text-[#f0f6fc]"
                              >
                                {copiedId === `file-${i}` ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <pre className="max-h-72 overflow-x-auto bg-[#0d1117] p-4 text-[11px] leading-5 text-[#8b949e]">
                            <code>{file.testCode}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Unit Tests */}
                {testData.unitTests?.length > 0 && (
                  <GlassCard title="Unit Tests" icon="◇">
                    <div className="space-y-5">
                      {testData.unitTests.map((fn, i) => (
                        <div key={i}>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#3fb950]">
                              {fn.functionName}()
                            </span>
                            <span className="text-[10px] text-[#6e7681]">
                              {fn.filePath}
                            </span>
                          </div>
                          <p className="mb-3 text-[11px] text-[#6e7681]">
                            {fn.description}
                          </p>
                          <div className="space-y-2">
                            {fn.cases?.map((c, j) => (
                              <TestCaseRow
                                key={j}
                                testCase={c}
                                id={`unit-${i}-${j}`}
                                copiedId={copiedId}
                                onCopy={copy}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Edge Cases */}
                {testData.edgeCases?.length > 0 && (
                  <GlassCard title="Edge Cases" icon="!">
                    <div className="space-y-3">
                      {testData.edgeCases.map((c, i) => (
                        <div key={i}>
                          <p className="mb-1 font-mono text-[10px] text-[#d29922]">
                            {c.functionName}()
                          </p>
                          <TestCaseRow
                            testCase={c}
                            id={`edge-${i}`}
                            copiedId={copiedId}
                            onCopy={copy}
                            accent="yellow"
                          />
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Integration Tests */}
                {testData.integrationTests?.length > 0 && (
                  <GlassCard title="Integration Tests" icon="↗">
                    <div className="space-y-3">
                      {testData.integrationTests.map((t, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-[#21262d] bg-[#0d1117] p-4"
                        >
                          <p className="text-xs font-semibold text-[#f0f6fc]">
                            {t.label}
                          </p>
                          <p className="mb-3 mt-1 text-[11px] text-[#6e7681]">
                            {t.description}
                          </p>
                          <div className="relative">
                            <pre className="overflow-x-auto rounded-lg border border-[#21262d] bg-[#010409] p-3 pr-16 text-[11px] leading-5 text-[#7ee787]">
                              <code>{t.codeSnippet}</code>
                            </pre>
                            <button
                              onClick={() =>
                                copy(t.codeSnippet, `int-${i}`)
                              }
                              className="absolute right-2 top-2 rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1 text-[10px] text-[#8b949e] transition hover:text-[#f0f6fc]"
                            >
                              {copiedId === `int-${i}` ? "✓" : "Copy"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Mocks */}
                {testData.mocks?.length > 0 && (
                  <GlassCard title="Mocks & Stubs" icon="◇">
                    <div className="space-y-2">
                      {testData.mocks.map((m, i) => (
                        <AlertCard key={i} type="warning">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-xs font-semibold text-[#d29922]">
                                {m.target}
                              </p>
                              <p className="mt-1 text-[11px] text-[#8b949e]">
                                {m.reason}
                              </p>
                              <pre className="mt-2 overflow-x-auto text-[10px] leading-5 text-[#d29922]">
                                <code>{m.snippet}</code>
                              </pre>
                            </div>
                            <button
                              onClick={() =>
                                copy(m.snippet, `mock-${i}`)
                              }
                              className="shrink-0 rounded-md border border-[#30363d] bg-[#21262d] px-2 py-1 text-[10px] text-[#8b949e] transition hover:text-[#f0f6fc]"
                            >
                              {copiedId === `mock-${i}` ? "✓" : "Copy"}
                            </button>
                          </div>
                        </AlertCard>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Regenerate */}
                <div className="flex justify-end">
                  <button
                    onClick={runGenerateTests}
                    disabled={testLoading}
                    className="flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-[11px] font-medium text-[#8b949e] transition hover:border-[#3fb950]/40 hover:bg-[#21262d] hover:text-[#3fb950] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>↻</span>
                    Re-generate Tests
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
   GLASS CARD – updated with green accent
========================================================= */
function GlassCard({ title, children, icon }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-2 border-b border-[#21262d] px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#238636]/10 text-[11px] text-[#3fb950]">
          {icon}
        </span>
        <h2 className="text-xs font-semibold text-[#c9d1d9]">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* =========================================================
   ALERT CARD (unchanged)
========================================================= */
function AlertCard({ children, type }) {
  const styles = {
    error: "border-[#f85149]/20 bg-[#f85149]/5",
    warning: "border-[#d29922]/20 bg-[#d29922]/5",
  };
  return (
    <div
      className={`rounded-lg border p-3 ${
        styles[type] || "border-[#30363d] bg-[#161b22]"
      }`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   SCORE CARD – updated with green/emerald/teal
========================================================= */
function ScoreCard({ label, value, icon, color = "green" }) {
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
    blue: {
      // fallback to a darker green variant
      icon: "bg-[#238636]/10 text-[#3fb950]",
      bar: "bg-[#3fb950]",
      number: "text-[#3fb950]",
    },
  };

  const colors = colorMap[color] || colorMap.green;

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-3.5 transition-all hover:border-[#484f58]">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${colors.icon}`}
        >
          {icon}
        </div>
        <span className="text-[9px] uppercase tracking-wider text-[#484f58]">
          Score
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] text-[#6e7681]">{label}</p>
          <p className={`mt-0.5 text-xl font-bold ${colors.number}`}>
            {val || "N/A"}
          </p>
        </div>
        <span className="mb-1 text-[10px] text-[#484f58]">/100</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#21262d]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   BADGE – updated with green variants
========================================================= */
function Badge({ children, color = "green" }) {
  const colors = {
    green: "border-[#238636]/20 bg-[#238636]/10 text-[#3fb950]",
    emerald: "border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]",
    teal: "border-[#2dd4bf]/20 bg-[#2dd4bf]/10 text-[#2dd4bf]",
    blue: "border-[#238636]/20 bg-[#238636]/10 text-[#3fb950]", // fallback
    purple: "border-[#238636]/20 bg-[#238636]/10 text-[#3fb950]",
    cyan: "border-[#238636]/20 bg-[#238636]/10 text-[#3fb950]",
    yellow: "border-[#d29922]/20 bg-[#d29922]/10 text-[#d29922]",
  };
  return (
    <span
      className={`rounded-md border px-2.5 py-1 text-[10px] font-medium ${
        colors[color] || colors.green
      }`}
    >
      {children}
    </span>
  );
}

/* =========================================================
   TEST CASE ROW – unchanged but with green accent
========================================================= */
function TestCaseRow({ testCase: c, id, copiedId, onCopy, accent = "indigo" }) {
  const accentColors = {
    indigo: "text-[#3fb950]", // changed from purple to green
    yellow: "text-[#d29922]",
  };
  return (
    <div className="rounded-lg border border-[#21262d] bg-[#0d1117] p-3">
      <div className="mb-2 flex items-center gap-2">
        <TypeBadge type={c.type} />
        <span className="text-[11px] text-[#8b949e]">{c.label}</span>
      </div>
      <div className="mb-2 flex flex-col gap-1 text-[10px] text-[#6e7681] sm:flex-row sm:gap-5">
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
            className={`overflow-x-auto rounded-lg border border-[#21262d] bg-[#010409] p-3 pr-12 text-[10px] leading-5 ${
              accentColors[accent] || "text-[#3fb950]"
            }`}
          >
            <code>{c.codeSnippet}</code>
          </pre>
          <button
            onClick={() => onCopy(c.codeSnippet, id)}
            className="absolute right-2 top-2 rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1 text-[10px] text-[#8b949e] transition hover:text-[#f0f6fc]"
          >
            {copiedId === id ? "✓" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TYPE BADGE – unchanged
========================================================= */
function TypeBadge({ type }) {
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
      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

/* =========================================================
   EMPTY STATE – unchanged
========================================================= */
function EmptyState({ text }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#30363d] bg-[#0d1117] px-3 py-4">
      <span className="text-xs text-[#484f58]">○</span>
      <p className="text-xs text-[#6e7681]">{text}</p>
    </div>
  );
}