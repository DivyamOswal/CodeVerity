// src/pages/About.jsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Code2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Reveal from "../components/Reveal";
import { gsap, useGSAP } from "../lib/gsap";

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

// Value icons  three Lucide icons mapped by name.
const VALUE_ICONS = {
  code: Code2,
  spark: Sparkles,
  shield: ShieldCheck,
};

function ValueIcon({ name }) {
  const Icon = VALUE_ICONS[name] ?? Code2;
  return (
    <Icon size={18} strokeWidth={2} aria-hidden="true" />
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
    desc: "Findings come with the reasoning behind them  file, line, and rationale  so you can check the AI's work instead of taking it on faith.",
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

// Counts the numeric part of a stat up from 0 the moment it scrolls
// into view, keeping any prefix/suffix ("<", "%", "+") fixed.
function StatItem({ value, label }) {
  const numRef = useRef(null);
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const el = numRef.current;
      const match = value.match(/\d+/);
      if (!el || !match) return;

      const target = parseInt(match[0], 10);
      const prefix = value.slice(0, match.index);
      const suffix = value.slice(match.index + match[0].length);

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { val: 0 };
        gsap.to(counter, {
          val: target,
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(counter.val)}${suffix}`;
          },
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        el.textContent = value;
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 px-4 py-5 text-center transition-colors duration-200 hover:bg-[var(--bg-hover)]/40"
    >
      <p
        ref={numRef}
        className="font-mono text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
    </div>
  );
}

export default function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        {/* HERO */}
        <Reveal className="text-center" from="up" delay={0} duration={0.6}>
          <div className="mb-5 flex items-center justify-center gap-3">
            <CodeVerityLogo />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            about us
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Built by developers who were tired of{" "}
            <span className="text-[var(--accent)]">reading diffs alone.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            CodeVerity started as an internal tool for auditing repositories
            before a release  bugs, security gaps, and architectural drift,
            surfaced automatically instead of found in production. We opened it
            up because every team has the same problem.
          </p>
        </Reveal>

        {/* STATS */}
        <Reveal
          className="mt-14 flex divide-x divide-[var(--border-light)] overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]"
          delay={0.1}
          duration={0.6}
        >
          {stats.map((s) => (
            <StatItem key={s.label} value={s.value} label={s.label} />
          ))}
        </Reveal>

        {/* MISSION */}
        <Reveal
          className="relative mt-16 overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-8 shadow-[0_20px_45px_-25px_var(--accent-soft-strong)] sm:p-10"
          delay={0.15}
          duration={0.6}
        >
          <span className="absolute -left-px -top-px h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/50" />
          <span className="absolute -right-px -top-px h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/50" />
          <span className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-2xl border-b-2 border-l-2 border-[var(--accent)]/50" />
          <span className="absolute -bottom-px -right-px h-4 w-4 rounded-br-2xl border-b-2 border-r-2 border-[var(--accent)]/50" />

          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">
            our mission
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-[1.15] tracking-tight sm:text-3xl">
            Make code review something AI actually helps with  not something
            it just summarizes.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px]">
            Most AI code tools stop at a paragraph of vague praise. CodeVerity
            is built to go further: point to the exact file and line, explain
            the risk in plain terms, and where it can  generate the test that
            would have caught it. We'd rather ship fewer features that
            developers actually trust than a long list of things that sound
            impressive in a demo.
          </p>
        </Reveal>

        {/* VALUES */}
        <Reveal className="mt-16" delay={0.2} duration={0.6}>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border-light)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              what we care about
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border-light)]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="group relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/40"
              >
                <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-200 group-hover:scale-x-100" />
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                    <ValueIcon name={v.icon} />
                  </div>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold tracking-wide text-[var(--text-primary)]">
                  {v.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* CONTACT STRIP */}
        <Reveal
          className="mx-auto mt-10 flex flex-col items-center justify-between gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-5 text-center sm:flex-row sm:text-left"
          delay={0.22}
          duration={0.5}
        >
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Questions about how CodeVerity works?
            </p>
            <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
              We read every message ourselves  no support tickets lost in a
              queue.
            </p>
          </div>
          <a
            href="mailto:support@codeverity.dev"
            className="shrink-0 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-5 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
          >
            Email the team
          </a>
        </Reveal>

        {/* CTA */}
        <Reveal
          className="relative mt-10 flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-[0_20px_45px_-25px_var(--accent-soft-strong)]"
          delay={0.25}
          duration={0.6}
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to see it on your own repo?
          </h2>
          <p className="max-w-md text-sm text-[var(--text-secondary)]">
            Drop in a public GitHub URL and get a full audit in under a minute
             no card required.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition-all duration-200 hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </Link>
            <Link
              to="/pricing"
              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.98]"
            >
              View Pricing
            </Link>
          </div>
        </Reveal>

        <p className="mt-10 text-center font-mono text-xs text-[var(--text-muted)]">
          CodeVerity · AI Repository Intelligence
        </p>
      </div>
    </div>
  );
}