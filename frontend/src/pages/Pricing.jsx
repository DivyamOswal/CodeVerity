import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRICING_PLANS, formatPrice, formatTokens } from "../components/PricingPlans";
import Reveal from "../components/Reveal";
import { gsap, useGSAP } from "../lib/gsap";

// -----------------------------------------------------------------
// Built on the existing Indigo Slate theme (same CSS vars as Navbar):
// --bg-primary / --bg-card / --bg-hover / --border-light / --accent /
// --accent-hover / --accent-soft / --accent-contrast / --text-*.
// No gradients flat accent fills only, matching the rest of the app.
// -----------------------------------------------------------------

function CheckIcon({ className = "" }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function TokenIcon({ className = "" }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5h1.6a1.4 1.4 0 0 1 0 2.8H9.5V9.5Zm0 2.8h2.2a1.4 1.4 0 0 1 0 2.8H9.5v-2.8Z" />
    </svg>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] p-1 font-mono text-[12px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-4 py-1.5 transition-colors duration-150 ${
            value === opt.value
              ? "bg-[var(--accent)] text-[var(--accent-contrast,#ffffff)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          {opt.label}
          {opt.badge && (
            <span className={value === opt.value ? "ml-1.5 opacity-90" : "ml-1.5 text-[var(--accent)]"}>
              {opt.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function PlanCard({ plan, cycle, currency, onSelect }) {
  const price = plan[cycle][currency];
  const isFree = price === 0;
  const priceRef = useRef(null);

  // Interaction-driven GSAP: Reveal above only handles scroll-entrance —
  // this handles the moment the user actually flips monthly/yearly or
  // INR/USD, which previously just snapped to the new number with no
  // motion. Skips the animation for prefers-reduced-motion, same
  // pattern as Reveal.jsx.
  useGSAP(
    () => {
      if (!priceRef.current) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          priceRef.current,
          { opacity: 0, y: -6, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power2.out" }
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(priceRef.current, { opacity: 1, y: 0, scale: 1 });
      });

      return () => mm.revert();
    },
    { dependencies: [price], scope: priceRef }
  );

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-xl border bg-[var(--bg-card)] p-6 transition-all duration-200 ${
        plan.highlight
          ? "border-[var(--accent)] shadow-[0_20px_45px_-20px_var(--accent-soft-strong)]"
          : "border-[var(--border-light)] hover:-translate-y-1 hover:border-[var(--accent)]/30"
      }`}
    >
      {plan.highlight && (
        <span className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />
      )}

      <div className="flex items-center justify-between gap-2">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
          {plan.name}
        </h3>
        {plan.highlight && (
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
            Most popular
          </span>
        )}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{plan.tagline}</p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span ref={priceRef} className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          {formatPrice(price, currency)}
        </span>
        {!isFree && (
          <span className="text-sm text-[var(--text-muted)]">/{cycle === "monthly" ? "mo" : "yr"}</span>
        )}
      </div>

      {!isFree && (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">incl. 18% GST</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[11px] text-[var(--accent)]">
          <TokenIcon />
          {formatTokens(plan.tokensPerMonth)} tokens / mo
        </div>
      </div>

      <ul className="mt-6 flex-1 space-y-3 border-t border-[var(--border-light)] pt-5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)]">
            <CheckIcon className="mt-0.5 shrink-0 text-[var(--accent)]" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(plan)}
        className={`mt-8 rounded-lg px-4 py-2.5 text-center text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] ${
          plan.highlight
            ? "bg-[var(--accent)] text-[var(--accent-contrast,#ffffff)] hover:bg-[var(--accent-hover)]"
            : "border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
        }`}
      >
        {plan.cta}
      </button>
    </div>
  );
}

const TRUST_ITEMS = ["No credit card required", "Cancel anytime", "GST invoices included"];

const FAQ = [
  {
    q: "What counts as a repository scan?",
    a: "One scan is one full analysis of a repo code quality, structure, and the AI-generated summary regenerated any time the repo changes.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrades apply immediately; downgrades take effect at the end of your current billing cycle.",
  },
  {
    q: "Do you support Indian GST invoices?",
    a: "Yes GST is calculated at checkout for INR billing, and a GST-compliant invoice is emailed after every payment.",
  },
  {
    q: "Is there a free trial on Pro or Team?",
    a: "Solo is free forever with no card required. Pro and Team can be cancelled anytime from Settings no lock-in.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState("monthly");
  const [currency, setCurrency] = useState("INR"); // default currency: Rupee

  const handleSelect = (plan) => {
    if (plan.monthly.INR === 0) {
      navigate("/register");
      return;
    }
    navigate(`/checkout?plan=${plan.id}&cycle=${cycle}&currency=${currency}`);
  };

  return (
    <div className="bg-[var(--bg-primary)]">
      {/* Hero */}
      <Reveal as="section" className="mx-auto max-w-4xl px-6 pb-6 pt-20 text-center" delay={0} duration={0.6}>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          pricing
        </div>
        <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-5xl">
          Analyze more repos.
          <br className="hidden sm:block" />
          Pay for what you <span className="text-[var(--accent)]">actually</span> use.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          Start free with a handful of scans a month. Upgrade once CodeVerity becomes part of how your team
          reviews code.
        </p>

        {/* Trust strip a professional pricing page reassures before it asks for a decision */}
        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[var(--text-muted)]">
          {TRUST_ITEMS.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <CheckIcon className="text-[var(--accent)]" />
              {item}
            </span>
          ))}
        </div>
      </Reveal>

      {/* Toggles */}
      <Reveal
        className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between"
        delay={0.1}
        duration={0.5}
      >
        <Toggle
          value={cycle}
          onChange={setCycle}
          options={[
            { value: "monthly", label: "monthly" },
            { value: "yearly", label: "yearly", badge: "−20%" },
          ]}
        />
        <Toggle
          value={currency}
          onChange={setCurrency}
          options={[
            { value: "INR", label: "₹ INR" },
            { value: "USD", label: "$ USD" },
          ]}
        />
      </Reveal>

      {/* Plan cards each staggers in as the grid scrolls into view */}
      <section className="mx-auto mt-10 grid max-w-5xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRICING_PLANS.map((plan, i) => (
          <Reveal key={plan.id} className="h-full" delay={i * 0.1} duration={0.5}>
            <PlanCard plan={plan} cycle={cycle} currency={currency} onSelect={handleSelect} />
          </Reveal>
        ))}
      </section>

      {/* Enterprise / contact strip a plain text-and-link row, not a new page or a fourth plan card */}
      <Reveal
        className="mx-auto mt-6 flex max-w-5xl flex-col items-center justify-between gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-5 text-center sm:flex-row sm:text-left"
        delay={0.35}
        duration={0.5}
      >
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Need more than 10 seats or a custom contract?</p>
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
            We'll put together an Enterprise plan around your team's repos and compliance needs.
          </p>
        </div>
        <a
          href="mailto:sales@codeverity.dev"
          className="shrink-0 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-5 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
        >
          Contact sales
        </a>
      </Reveal>

      {/* FAQ heading reveals once, then each question staggers in */}
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-16">
        <Reveal as="h2" className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          frequently asked
        </Reveal>
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.08} duration={0.45}>
              <div
                className={`group p-5 transition-colors duration-150 hover:bg-[var(--bg-hover)]/40 ${
                  i !== 0 ? "border-t border-[var(--border-light)]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-[11px] text-[var(--accent)]">Q.</span>
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.q}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}