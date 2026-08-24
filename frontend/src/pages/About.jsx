import { Link } from "react-router-dom";

// -----------------------------------------------------------------
// Built on the same system as Home/Pricing/CodeInput: CSS vars for
// theme, font-mono for eyebrow labels, corner-bracket card framing,
// flat accent color throughout (no gradients).
// -----------------------------------------------------------------

function Icon({ name, className = "" }) {
  const icons = {
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    ship: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
  };
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function ValueCard({ icon, title, desc, delay }) {
  return (
    <div
      className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 text-left"
      style={{ animation: `fadeUp 0.6s ${delay} ease both` }}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon name={icon} />
      </div>
      <h3 className="mb-1.5 text-sm font-semibold tracking-wide text-[var(--text-primary)]">{title}</h3>
      <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{desc}</p>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="flex min-w-[110px] flex-col items-center rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-5 py-3">
      <span className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{value}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

export default function AboutUs() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Ambient background — flat color + blur + dot grid, no gradients */}
      <div className="pointer-events-none absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--accent-soft)] opacity-30 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        {/* HERO */}
        <div className="text-center" style={{ animation: "fadeDown 0.6s ease both" }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            about us
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            We built the code review<br className="hidden sm:block" />
            we always wanted <span className="text-[var(--accent)]">on our own team.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            CodeVerity started as a simple question: why does every repo review still start from
            scratch? We built an AI reviewer that reads a codebase the way a senior engineer would —
            architecture first, then bugs, security, and what to fix next.
          </p>
        </div>

        {/* STATS */}
        <div className="mt-10 flex flex-wrap justify-center gap-3" style={{ animation: "fadeUp 0.6s 0.1s ease both" }}>
          <Stat value="100+" label="Repos Analyzed" />
          <Stat value="4" label="Core Metrics" />
          <Stat value="<60s" label="Avg Audit Time" />
        </div>

        {/* MISSION */}
        <div
          className="mt-14 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 sm:p-8"
          style={{ animation: "fadeUp 0.6s 0.15s ease both" }}
        >
          <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
            our mission
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Good code review shouldn't depend on whether a senior engineer has 20 minutes free. We're
            building CodeVerity so any team — solo developer or full engineering org — can get a
            thorough, consistent audit of their codebase on demand: what's fragile, what's a security
            risk, and what to prioritize next.
          </p>
        </div>

        {/* VALUES */}
        <div className="mt-8">
          <h2 className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            what we care about
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ValueCard
              icon="target"
              title="Accuracy first"
              desc="A review that misses the real issue isn't useful. We'd rather flag fewer things and be right about them."
              delay="0.2s"
            />
            <ValueCard
              icon="shield"
              title="Security-minded"
              desc="Every audit checks for the vulnerability classes that actually get exploited, not just style nitpicks."
              delay="0.28s"
            />
            <ValueCard
              icon="ship"
              title="Built to ship"
              desc="Findings come with a suggested fix, not just a diagnosis — so you can act on the report, not just read it."
              delay="0.36s"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center" style={{ animation: "fadeUp 0.6s 0.4s ease both" }}>
          <p className="text-sm text-[var(--text-secondary)]">Have questions about how CodeVerity works?</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--accent-contrast,#ffffff)] transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-95"
            >
              Contact us
            </Link>
            <Link
              to="/pricing"
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-hover)]"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}