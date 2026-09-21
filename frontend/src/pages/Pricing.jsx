// src/pages/Pricing.jsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Shield, Users } from "lucide-react";
import {
  PRICING_PLANS,
  formatPrice,
  formatTokens,
} from "../components/PricingPlans";
import Reveal from "../components/Reveal";
import { gsap, useGSAP } from "../lib/gsap";
import { useToast } from "../hooks/useToast";

// -----------------------------------------------------------------
// Theme-driven throughout  no hardcoded palette values here, so this
// page follows whatever theme is active (see index.css) without edits.
// -----------------------------------------------------------------

// Small per-tier glyphs  purely visual, differentiates the three
// plan names at a glance.
const TIER_ICONS = {
  free: Shield,
  pro: Zap,
  team: Users,
};

function Toggle({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] p-1 font-mono text-[11px] sm:text-[12px]">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] sm:px-4 ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {opt.label}
            {opt.badge && (
              <span
                className={active ? "ml-1.5 opacity-90" : "ml-1.5 text-[var(--accent)]"}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({ plan, cycle, currency, onSelect }) {
  const price = plan[cycle][currency];
  const isFree = price === 0;
  const priceRef = useRef(null);

  const TierIcon = TIER_ICONS[plan.id] ?? TIER_ICONS.free;

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
      className={`relative flex h-full flex-col overflow-hidden rounded-xl border bg-[var(--bg-card)] p-5 transition-all duration-200 sm:p-6 ${
        plan.highlight
          ? "border-[var(--accent)] shadow-[var(--shadow-lg)] hover:shadow-xl lg:scale-105"
          : "border-[var(--border-light)] hover:-translate-y-1 hover:border-[var(--accent)]/30"
      }`}
    >
      {plan.highlight && (
        <span className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <TierIcon size={16} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            {plan.name}
          </h3>
        </div>
        {plan.highlight && (
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
            Most popular
          </span>
        )}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {plan.tagline}
      </p>

      <div className="mt-6 flex flex-wrap items-baseline gap-1.5">
        <span
          ref={priceRef}
          className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
        >
          {formatPrice(price, currency)}
        </span>
        {!isFree && (
          <span className="text-sm text-[var(--text-muted)]">
            /{cycle === "monthly" ? "mo" : "yr"}
          </span>
        )}
      </div>

      {!isFree && currency === "INR" && (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          + 18% GST at checkout
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[11px] text-[var(--accent)]">
          <Zap size={12} strokeWidth={2.2} aria-hidden="true" />
          {formatTokens(plan.tokensPerMonth)} tokens / mo
        </div>
      </div>

      <ul className="mt-6 flex-1 space-y-3 border-t border-[var(--border-light)] pt-5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)]"
          >
            <Check
              size={15}
              strokeWidth={2.2}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[var(--accent)]"
            />
            <span className="min-w-0">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(plan)}
        className={`mt-8 w-full rounded-lg px-4 py-2.5 text-center text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.98] ${
          plan.highlight
            ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_8px_24px_-6px_var(--accent-soft-strong)] hover:bg-[var(--accent-hover)]"
            : "border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
        }`}
      >
        {plan.cta}
      </button>
    </div>
  );
}

const TRUST_ITEMS = [
  "No credit card required",
  "Cancel anytime",
  "GST invoices included",
];

const FAQ = [
  {
    q: "What counts as a repository scan?",
    a: "One scan is one full analysis of a repo – code quality, structure, and the AI-generated summary – regenerated any time the repo changes.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrades apply immediately; downgrades take effect at the end of your current billing cycle.",
  },
  {
    q: "Do you support Indian GST invoices?",
    a: "Yes – GST is calculated at checkout for INR billing, and a GST-compliant invoice is emailed after every payment.",
  },
  {
    q: "Is there a free trial on Pro or Team?",
    a: "Solo is free forever with no card required. Pro and Team can be cancelled anytime from Settings – no lock-in.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { info } = useToast();
  const [cycle, setCycle] = useState("monthly");
  const [currency, setCurrency] = useState("INR");

  const handleSelect = (plan) => {
    if (plan.monthly.INR === 0) {
      info("Redirecting to registration...");
      navigate("/register");
      return;
    }
    info("Redirecting to checkout...");
    navigate(`/checkout?plan=${plan.id}&cycle=${cycle}&currency=${currency}`);
  };

  return (
    <div className="bg-[var(--bg-primary)]">
      {/* Hero */}
      <Reveal
        as="section"
        className="mx-auto max-w-4xl px-4 pb-6 pt-16 text-center sm:px-6 sm:pt-20"
        delay={0}
        duration={0.6}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] sm:text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          pricing
        </div>
        <h1 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
          Analyze more repos.
          <br className="hidden sm:block" />
          Pay for what you{" "}
          <span
            className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[var(--text-primary)] bg-clip-text text-transparent"
            style={{ backgroundSize: "200% 100%" }}
          >
            actually
          </span>{" "}
          use.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px]">
          Start free with a handful of scans a month. Upgrade once CodeVerity
          becomes part of how your team reviews code.
        </p>

        {/* Trust strip */}
        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-[var(--text-muted)] sm:text-[12px]">
          {TRUST_ITEMS.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <Check
                size={13}
                strokeWidth={2.4}
                aria-hidden="true"
                className="text-[var(--accent)]"
              />
              {item}
            </span>
          ))}
        </div>
      </Reveal>

      {/* Toggles */}
      <Reveal
        className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between sm:gap-4 sm:px-6"
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

      {/* Plan cards */}
      <section className="mx-auto mt-10 grid max-w-5xl gap-4 px-4 sm:grid-cols-2 sm:gap-6 sm:px-6 lg:grid-cols-3 lg:items-center lg:gap-8">
        {PRICING_PLANS.map((plan, i) => (
          <Reveal key={plan.id} className="h-full" delay={i * 0.1} duration={0.5}>
            <PlanCard
              plan={plan}
              cycle={cycle}
              currency={currency}
              onSelect={handleSelect}
            />
          </Reveal>
        ))}
      </section>

      {/* Enterprise / contact strip */}
      <Reveal
        className="mx-auto mt-6 flex max-w-5xl flex-col items-center justify-between gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-5 text-center sm:flex-row sm:px-6 sm:text-left"
        delay={0.35}
        duration={0.5}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Need more than 10 seats or a custom contract?
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
            We'll put together an Enterprise plan around your team's repos and
            compliance needs.
          </p>
        </div>

        <a
          href="mailto:sales@codeverity.dev"
          className="w-full shrink-0 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-5 py-2.5 text-center text-[13px] font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] sm:w-auto"
        >
          Contact sales
        </a>
      </Reveal>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
        <Reveal
          as="h2"
          className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] sm:text-[11px]"
        >
          frequently asked
        </Reveal>
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.08} duration={0.45}>
              <div
                className={`group p-4 transition-colors duration-150 hover:bg-[var(--bg-hover)]/40 sm:p-5 ${
                  i !== 0 ? "border-t border-[var(--border-light)]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[var(--accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                      {item.q}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                      {item.a}
                    </p>
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