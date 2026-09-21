// src/pages/Checkout.jsx
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Check,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  PRICING_PLANS,
  formatPrice,
  formatTokens,
} from "../components/PricingPlans";
import axios from "../api/axios";
import { useToast } from "../hooks/useToast";

// ─────────────────────────────────────────────────────────────
// Tax math  GST is ADDED on top of the base price.
// The base is what the pricing page shows.
// The total is what Stripe charges (and what the user pays).
// Both numbers must sum exactly: total = base + tax.
// ─────────────────────────────────────────────────────────────
const TAX_RATE = 0.18;

function addTaxExclusive(base, currency) {
  if (currency !== "INR" || !base) {
    return { base, tax: 0, total: base, hasTax: false };
  }
  const tax = Math.round(base * TAX_RATE * 100) / 100;
  const total = Math.round((base + tax) * 100) / 100;
  return { base, tax, total, hasTax: true };
}

// ─── Main Component ────────────────────────────────────────────
export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { error } = useToast();

  const planId = searchParams.get("plan") || "pro";
  const cycle = searchParams.get("cycle") === "yearly" ? "yearly" : "monthly";
  const currency = searchParams.get("currency") === "USD" ? "USD" : "INR";

  const plan = useMemo(
    () => PRICING_PLANS.find((p) => p.id === planId) ?? PRICING_PLANS[1],
    [planId]
  );

  // Base = what the pricing page shows. Total = base + GST.
  const basePrice = plan[cycle][currency];
  const { tax, total, hasTax } = addTaxExclusive(basePrice, currency);

  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/billing/create-checkout-session", {
        plan: planId,
        cycle,
        currency,
      });
      window.location.href = res.data.url;
    } catch (err) {
      const msg =
        err.response?.data?.error || "Checkout failed. Please try again.";
      error(msg);
      setLoading(false);
    }
  };

  const isMonthly = cycle === "monthly";
  const baseDisplay = formatPrice(basePrice, currency);
  const taxDisplay = formatPrice(tax, currency);
  const totalDisplay = formatPrice(total, currency);

  const perMonthDisplay = !isMonthly
    ? formatPrice(Math.round(basePrice / 12), currency)
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back link */}
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 rounded font-mono text-[11px] text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] sm:text-[12px]"
        >
          <ArrowLeft size={12} strokeWidth={2} aria-hidden="true" />
          back to pricing
        </Link>

        {/* Page header */}
        <div className="mt-5 sm:mt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Secure checkout
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Complete your subscription
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
            You're subscribing to the{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {plan.name}
            </span>{" "}
            plan, billed {cycle}.
          </p>
        </div>

        {/* ─── Layout  Order Summary FIRST on mobile ─────────── */}
        <div className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-[1fr_400px] lg:gap-8">
          {/* ─── Order Summary  moves to the right column on lg ── */}
          <aside
            aria-labelledby="order-summary-heading"
            className="h-fit overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[var(--shadow-md)] lg:order-last lg:sticky lg:top-24"
          >
            <div className="border-b border-[var(--border-dark)] px-4 py-3 sm:px-6 sm:py-4">
              <h2
                id="order-summary-heading"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] sm:text-[11px]"
              >
                Order Summary
              </h2>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              {/* Line items */}
              <div className="space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">
                      {plan.name} Plan
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      billed {cycle}
                      {perMonthDisplay && ` · ${perMonthDisplay}/mo effective`}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono tabular-nums text-[var(--text-secondary)]">
                    {baseDisplay}
                  </span>
                </div>

                {hasTax && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[var(--text-secondary)]">GST (18%)</p>
                    <span className="shrink-0 font-mono tabular-nums text-[var(--color-success)]">
                      {taxDisplay}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    Total due today
                  </span>
                  <span className="font-mono text-xl font-bold tabular-nums text-[var(--text-primary)] sm:text-2xl">
                    {totalDisplay}
                  </span>
                </div>
                {!isMonthly && (
                  <p className="mt-1.5 text-right font-mono text-[10px] text-[var(--accent)]">
                    one payment · covers 12 months
                  </p>
                )}
              </div>

              {/* What's included */}
              <div className="border-t border-[var(--border-light)] pt-4">
                <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  What's included
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[var(--accent)]"
                      />
                      <span className="min-w-0">{f}</span>
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="pl-5 text-[var(--text-muted)]">
                      +{plan.features.length - 4} more
                    </li>
                  )}
                </ul>
              </div>

              {/* Payment method note */}
              <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center text-[11px] text-[var(--text-muted)]">
                All major credit &amp; debit cards accepted
              </div>
            </div>
          </aside>

          {/* ─── Confirm & Pay ─────────────────────────────────── */}
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-lg)] sm:p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"
              />

              <div className="space-y-5">
                {/* Plan confirmation */}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    You're subscribing to
                  </p>
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)]">
                      <Sparkles size={18} strokeWidth={2} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)] sm:text-base">
                        {plan.name} Plan
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-[var(--accent)]">
                        {formatTokens(plan.tokensPerMonth)} tokens / mo · billed{" "}
                        {cycle}
                      </p>
                    </div>
                    <Link
                      to="/pricing"
                      className="shrink-0 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                    >
                      Change
                    </Link>
                  </div>
                </div>

                {/* Payment button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  aria-live="polite"
                  className="group relative w-full overflow-hidden rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_10px_30px_-8px_var(--accent-soft-strong)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 disabled:active:scale-100 sm:text-[15px]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                          style={{
                            borderColor: "var(--accent-contrast)",
                            borderTopColor: "transparent",
                          }}
                        />
                        Redirecting…
                      </>
                    ) : (
                      <>
                        Pay {totalDisplay}
                        <span
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                  />
                </button>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 text-center text-[10px] text-[var(--text-muted)] sm:text-[11px]">
                  <Lock
                    size={12}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span>
                    Secured by Stripe – your payment details are encrypted.
                  </span>
                </div>

                {/* Trust signals */}
                <div className="grid grid-cols-1 gap-2 border-t border-[var(--border-dark)] pt-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
                    <ShieldCheck
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="shrink-0 text-[var(--accent)]"
                    />
                    <span>256-bit SSL</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
                    <Sparkles
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="shrink-0 text-[var(--accent)]"
                    />
                    <span>AI-powered audit</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className="shrink-0 text-[var(--accent)]"
                    />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[10px] text-[var(--text-muted)] sm:mt-12">
          By proceeding you agree to our{" "}
          <Link
            to="/terms"
            className="rounded text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="rounded text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}