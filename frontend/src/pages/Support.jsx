// frontend/src/pages/Support.jsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePreferences } from "../context/PreferencesContext";

const CATEGORIES = ["All", "Getting Started", "Analysis", "Billing", "Account", "Privacy & Security"];

const FAQS = [
  {
    category: "Getting Started",
    q: "How do I analyze my first repository?",
    a: "Sign in, go to your Dashboard, and paste a public GitHub repository URL into the analyzer. CodeVerity will run a full AI-powered audit covering architecture, bugs, security, and more, usually in under two minutes.",
  },
  {
    category: "Getting Started",
    q: "Do I need a GitHub account to use CodeVerity?",
    a: "You can register with just an email and password to analyze public repositories. Signing in with GitHub is optional but required if you want to scan private repositories.",
  },
  {
    category: "Analysis",
    q: "What does a CodeVerity report include?",
    a: "Each report includes a summary, architecture review, identified bugs, security findings, a future roadmap, detected tools and packages, and four category scores (code quality, security, performance, maintainability) rolled up into an overall grade.",
  },
  {
    category: "Analysis",
    q: "Can CodeVerity generate tests for my code?",
    a: "Yes. From any report, open the Test Cases tab to generate unit tests, edge cases, integration tests, and mocks based on your submitted source code.",
  },
  {
    category: "Analysis",
    q: "Can I scan private repositories?",
    a: "Private repository scanning is available on Pro and Enterprise plans. You'll need to authorize CodeVerity via GitHub OAuth with read access to the specific repository you want analyzed.",
  },
  {
    category: "Analysis",
    q: "Can I download my report?",
    a: "Yes — every report can be exported as a PDF from the report view or from your History page, and raw JSON is also available for programmatic use.",
  },
  {
    category: "Billing",
    q: "What happens when I run out of tokens or scans?",
    a: "You'll see a notice in the analyzer and won't be able to run new scans until your monthly limit resets or you upgrade your plan. Existing reports remain fully accessible.",
  },
  {
    category: "Billing",
    q: "Do unused scans roll over to the next month?",
    a: "No, scan and token limits reset at the start of each billing cycle and don't carry over, unless stated otherwise on the pricing page for your specific plan.",
  },
  {
    category: "Billing",
    q: "How do I cancel my subscription?",
    a: "Go to Settings, and from there you can downgrade or cancel your plan. Cancellation takes effect at the end of your current billing period — you keep access until then.",
  },
  {
    category: "Billing",
    q: "Can I get a refund?",
    a: "Fees are generally non-refundable, but reach out to support and we're happy to look at your specific situation.",
  },
  {
    category: "Account",
    q: "How do I change my password?",
    a: "Go to Settings → Security to update your password. You'll need your current password to set a new one.",
  },
  {
    category: "Account",
    q: "Can I change the email associated with my account?",
    a: "Yes, from Settings → Account. You'll need to enter a valid email address; we recommend confirming you have access to it before switching.",
  },
  {
    category: "Account",
    q: "How do I delete my account?",
    a: "Go to Settings → Danger Zone → Delete Account. This permanently removes your account and all associated reports and cannot be undone.",
  },
  {
    category: "Privacy & Security",
    q: "Does CodeVerity store my source code?",
    a: "No. Your source code is processed in memory during analysis and is not retained afterward. What is stored is the output of the analysis — your report, scores, and summary — tied to your account.",
  },
  {
    category: "Privacy & Security",
    q: "Is my data used to train AI models?",
    a: "No, we do not use your submitted code or reports to train AI models.",
  },
  {
    category: "Privacy & Security",
    q: "How do I clear my report history?",
    a: "Go to Settings → Danger Zone → Clear Report History to permanently delete all past reports from your account.",
  },
];

export default function Support() {
  const { compact } = usePreferences();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQS.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch =
        !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const toggle = (key) => setOpenIndex((prev) => (prev === key ? null : key));

  const compactClasses = compact
    ? {
        topPadding: "pt-14",
        container: "px-3 py-4 sm:px-4",
        headerMargin: "mb-4",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[10px]",
        heroPadding: "p-4",
        searchHeight: "h-10",
        categoryGap: "gap-1.5",
        categoryPadding: "px-2.5 py-1.5 text-[10px]",
        faqPadding: "px-4 py-3",
        faqQSize: "text-xs",
        faqASize: "text-[11px]",
        cardGap: "gap-2",
        cardPadding: "p-4",
      }
    : {
        topPadding: "pt-16",
        container: "px-4 py-6 sm:px-6 lg:px-8",
        headerMargin: "mb-6",
        heading: "text-xl sm:text-2xl",
        subHeading: "text-xs",
        heroPadding: "p-6",
        searchHeight: "h-12",
        categoryGap: "gap-2",
        categoryPadding: "px-3.5 py-2 text-xs",
        faqPadding: "px-5 py-4",
        faqQSize: "text-sm",
        faqASize: "text-[13px]",
        cardGap: "gap-3",
        cardPadding: "p-5",
      };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}>
      <div className={`mx-auto w-full max-w-5xl ${compactClasses.container}`}>
        {/* HEADER */}
        <div className={compactClasses.headerMargin}>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Help Center
            </span>
          </div>
          <h1 className={`mt-1 font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}>
            How can we help?
          </h1>
          <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
            Search common questions, or reach out directly if you can't find what you need.
          </p>
        </div>

        {/* SEARCH */}
        <div className={`relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.heroPadding} mb-5`}>
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--accent-soft)] blur-3xl" />
          <div className="relative">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                aria-label="Search help articles"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for answers — e.g. &quot;private repo&quot;, &quot;refund&quot;, &quot;delete account&quot;"
                className={`w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.searchHeight}`}
              />
            </div>

            <div className={`mt-4 flex flex-wrap ${compactClasses.categoryGap}`}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`${compactClasses.categoryPadding} rounded-lg border font-medium transition-all ${
                    category === c
                      ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS COUNT */}
        {(search || category !== "All") && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] text-[var(--text-muted)]">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {search && <> for "<span className="text-[var(--text-secondary)]">{search}</span>"</>}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* FAQ LIST */}
        {filtered.length > 0 ? (
          <div className={`flex flex-col ${compactClasses.cardGap} mb-6`}>
            {filtered.map((item, i) => {
              const key = `${item.category}-${i}`;
              const isOpen = openIndex === key;
              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] transition-colors hover:border-[var(--border-medium)]"
                >
                  <button
                    onClick={() => toggle(key)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center justify-between gap-4 text-left ${compactClasses.faqPadding} hover:bg-[var(--bg-hover)]/50 transition-colors`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 rounded-md border border-[var(--border-light)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide text-[var(--text-muted)]">
                        {item.category}
                      </span>
                      <span className={`font-medium text-[var(--text-primary)] ${compactClasses.faqQSize}`}>
                        {item.q}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-lg text-[var(--accent)] transition-transform duration-200 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className={`border-t border-[var(--border-light)] ${compactClasses.faqPadding} pt-3`}>
                      <p className={`leading-relaxed text-[var(--text-secondary)] ${compactClasses.faqASize}`}>
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-primary)] text-[var(--text-muted)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">No matching articles</p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Try a different search term, or reach out to us directly below.
            </p>
          </div>
        )}

        {/* CONTACT FALLBACK */}
        <div className={`relative overflow-hidden rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] ${compactClasses.cardPadding}`}>
          <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-[var(--accent-soft-strong)] blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                Still need help?
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
                Our team typically replies within one business day.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                to="/contact"
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] transition hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-95"
              >
                Contact support →
              </Link>
              
              <a  href="mailto:support@codeverity.dev"
                className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]"
              >
                Email us
              </a>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className={`flex items-center justify-center gap-2 py-3 text-[var(--text-muted)] text-[9px] ${compact ? "mt-4" : "mt-6"}`}>
          <span>CodeVerity</span>
          <span>•</span>
          <span>AI Repository Intelligence</span>
          <span>•</span>
          <Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}