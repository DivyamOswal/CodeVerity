import { Link } from "react-router-dom";

// -----------------------------------------------------------------
// Local mini components same pattern as CodeInput/GithubAnalyzer
// (each page keeps its own copy rather than sharing one file, matching
// how this codebase is already structured).
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

function ValueIcon({ name }) {
  const icons = {
    code: (
      <>
        <path d="m8 6-6 6 6 6" />
        <path d="m16 6 6 6-6 6" />
      </>
    ),
    spark: (
      <>
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="m4.93 4.93 2.83 2.83" />
        <path d="m16.24 16.24 2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="m4.93 19.07 2.83-2.83" />
        <path d="m16.24 7.76 2.83-2.83" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

const values = [
  {
    icon: "code",
    title: "Built for developers",
    desc: "Every feature starts from a real code-review workflow, not a generic AI demo. If it doesn't save you time on an actual repo, it doesn't ship.",
  },
  {
    icon: "spark",
    title: "AI you can verify",
    desc: "Findings come with the reasoning behind them file, line, and rationale so you can check the AI's work instead of taking it on faith.",
  },
  {
    icon: "shield",
    title: "Privacy by default",
    desc: "We analyze public repositories and don't retain your source code beyond generating your report. Your code stays yours.",
  },
];

const stats = [
  { value: "100+", label: "Repos Scanned" },
  { value: "98%", label: "Issue Accuracy" },
  { value: "<60s", label: "Avg Audit Time" },
];

export default function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Ambient background flat color + blur, dot grid, no gradients */}
      <div className="pointer-events-none absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        {/* HERO */}
        <div className="text-center" style={{ animation: "fadeDown 0.6s ease both" }}>
          <div className="mb-5 flex items-center justify-center gap-3">
            <CodeVerityLogo />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            about us
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Built by developers who were tired of{" "}
            <span className="text-[var(--accent)]">reading diffs alone.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            CodeVerity started as an internal tool for auditing repositories before a release bugs,
            security gaps, and architectural drift, surfaced automatically instead of found in production.
            We opened it up because every team has the same problem.
          </p>
        </div>

        {/* STATS */}
        <div
          className="mt-14 grid grid-cols-3 gap-3 sm:gap-4"
          style={{ animation: "fadeUp 0.6s 0.1s ease both" }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-5 text-center"
            >
              <p className="font-mono text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* MISSION */}
        <div
          className="relative mt-16 overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-8 sm:p-10"
          style={{ animation: "fadeUp 0.6s 0.15s ease both" }}
        >
          <span className="absolute -top-px -left-px h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/50" />
          <span className="absolute -top-px -right-px h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/50" />
          <span className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-2xl border-b-2 border-l-2 border-[var(--accent)]/50" />
          <span className="absolute -bottom-px -right-px h-4 w-4 rounded-br-2xl border-b-2 border-r-2 border-[var(--accent)]/50" />

          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">our mission</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Make code review something AI actually helps with not something it just summarizes.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px]">
            Most AI code tools stop at a paragraph of vague praise. CodeVerity is built to go further: point
            to the exact file and line, explain the risk in plain terms, and where it can generate the
            test that would have caught it. We'd rather ship fewer features that developers actually trust
            than a long list of things that sound impressive in a demo.
          </p>
        </div>

        {/* VALUES */}
        <div className="mt-16" style={{ animation: "fadeUp 0.6s 0.2s ease both" }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border-light)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              what we care about
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border-light)]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent)]/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <ValueIcon name={v.icon} />
                </div>
                <h3 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">{v.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-10 text-center"
          style={{ animation: "fadeUp 0.6s 0.25s ease both" }}
        >
          <h2 className="text-2xl font-bold tracking-tight">Ready to see it on your own repo?</h2>
          <p className="max-w-md text-sm text-[var(--text-secondary)]">
            Drop in a public GitHub URL and get a full audit in under a minute no card required.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-contrast,#ffffff)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-95"
            >
              Get Started Free
            </Link>
            <Link
              to="/pricing"
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-hover)]"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center font-mono text-xs text-[var(--text-muted)]">
          CodeVerity · AI Repository Intelligence
        </p>
      </div>
    </div>
  );
}