import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRICING_PLANS, formatPrice, formatTokens } from "../components/PricingPlans";

// -----------------------------------------------------------------
// Built on the existing Indigo Slate theme (same CSS vars as Navbar):
// --bg-primary / --bg-card / --bg-hover / --border-light / --accent /
// --accent-hover / --accent-soft / --accent-contrast / --text-*.
// No gradients — flat accent fills only, matching the rest of the app.
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

function ScanIcon({ className = "" }) {
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
      <path d="M3 7V4h3" />
      <path d="M21 7V4h-3" />
      <path d="M3 17v3h3" />
      <path d="M21 17v3h-3" />
      <path d="M3 12h18" />
    </svg>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-1 font-mono text-[12px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3.5 py-1.5 transition-colors duration-150 ${
            value === opt.value
              ? "bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          {opt.label}
          {opt.badge && <span className="ml-1.5 text-[var(--accent)]">{opt.badge}</span>}
        </button>
      ))}
    </div>
  );
}

function PlanCard({ plan, cycle, currency, onSelect }) {
  const price = plan[cycle][currency];
  const isFree = price === 0;

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 transition-shadow duration-200 ${
        plan.highlight
          ? "border-[var(--accent)] bg-[var(--bg-card)] shadow-[0_0_0_1px_var(--accent)]"
          : "border-[var(--border-light)] bg-[var(--bg-card)]"
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-6 rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-contrast,#ffffff)]">
          most popular
        </span>
      )}

      <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
        {plan.name}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">{plan.tagline}</p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          {formatPrice(price, currency)}
        </span>
        {!isFree && (
          <span className="text-sm text-[var(--text-muted)]">/{cycle === "monthly" ? "mo" : "yr"}</span>
        )}
      </div>
      {currency === "INR" && !isFree && (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">+ GST as applicable</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[11px] text-[var(--accent)]">
          <TokenIcon />
          {formatTokens(plan.tokensPerMonth)} tokens / mo
        </div>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[11px] text-[var(--accent)]">
          <ScanIcon />
          {plan.scansPerMonth} scans / mo
        </div>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
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
        className={`mt-8 rounded-lg px-4 py-2.5 text-center text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
          plan.highlight
            ? "bg-[var(--accent)] text-[var(--accent-contrast,#ffffff)] shadow-sm shadow-[var(--accent-soft-strong)] hover:bg-[var(--accent-hover)]"
            : "border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        }`}
      >
        {plan.cta}
      </button>
    </div>
  );
}

const FAQ = [
  {
    q: "What counts as a repository scan?",
    a: "One scan is one full analysis of a repo — code quality, structure, and the AI-generated summary — regenerated any time the repo changes.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrades apply immediately; downgrades take effect at the end of your current billing cycle.",
  },
  {
    q: "Do you support Indian GST invoices?",
    a: "Yes — GST is calculated at checkout for INR billing, and a GST-compliant invoice is emailed after every payment.",
  },
  {
    q: "Is there a free trial on Pro or Team?",
    a: "Solo is free forever with no card required. Pro and Team can be cancelled anytime from Settings — no lock-in.",
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
      <section className="mx-auto max-w-4xl px-6 pb-10 pt-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          pricing
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
          Analyze more repos.
          <br className="hidden sm:block" />
          Pay for what you <span className="text-[var(--accent)]">actually</span> use.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          Start free with a handful of scans a month. Upgrade once CodeVerity becomes part of how your team
          reviews code.
        </p>
      </section>

      {/* Toggles */}
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
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
      </div>

      {/* Plan cards */}
      <section className="mx-auto mt-10 grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} cycle={cycle} currency={currency} onSelect={handleSelect} />
        ))}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          frequently asked
        </h2>
        <div className="mt-6 divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
          {FAQ.map((item) => (
            <div key={item.q} className="p-5">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">{item.q}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}