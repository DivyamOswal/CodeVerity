// frontend/src/pages/Checkout.jsx
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { PRICING_PLANS, formatPrice, formatTokens } from "../components/PricingPlans";
import axios from "../api/axios";
import { useToast } from "../hooks/useToast";

// ─── Icons ──────────────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function LockIcon({ className = "" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </svg>
  );
}

function CheckIcon({ className = "" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SparklesIcon({ className = "" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="m4.93 4.93 2.83 2.83" />
      <path d="m16.24 16.24 2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="m4.93 19.07 2.83-2.83" />
      <path d="m16.24 7.76 2.83-2.83" />
    </svg>
  );
}

function ShieldIcon({ className = "" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
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
  const price = plan[cycle][currency];
  const gst = currency === "INR" ? Math.round(price * 0.18) : 0;
  const total = price + gst;

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
  const priceDisplay = formatPrice(price, currency);
  const totalDisplay = formatPrice(total, currency);
  const gstDisplay = currency === "INR" ? formatPrice(gst, currency) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back link */}
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)] sm:text-[12px]"
        >
          <ArrowLeftIcon /> back to pricing
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

        {/* ─── Layout ─────────────────────────────────────────── */}
        <div className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-[1fr_400px] lg:gap-8">
          {/* ─── LEFT – Checkout Form ─────────────────────────── */}
          <div className="min-w-0">
            {/* Payment card */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_25px_55px_-35px_var(--accent-soft-strong)] transition-shadow hover:shadow-[0_30px_65px_-35px_var(--accent-soft-strong)] sm:p-6">
              <div className="space-y-5">
                {/* Plan summary */}
                <div className="flex flex-col gap-3 border-b border-[var(--border-dark)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                      {plan.name} Plan
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatTokens(plan.tokensPerMonth)} tokens / mo · {cycle}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
                    <p className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                      {priceDisplay}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {isMonthly ? "per month" : "per year"}
                    </p>
                  </div>
                </div>

                {/* Order breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">{priceDisplay}</span>
                  </div>
                  {gstDisplay && (
                    <div className="flex items-center justify-between gap-3 text-[var(--text-secondary)]">
                      <span>GST (18%)</span>
                      <span className="font-mono tabular-nums">{gstDisplay}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--border-dark)] pt-3 text-base font-bold text-[var(--text-primary)]">
                    <span>Total</span>
                    <span className="font-mono tabular-nums">{totalDisplay}</span>
                  </div>
                </div>

                {/* Payment button */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 sm:text-[15px]"
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
                        Proceed to Payment
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                </button>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 text-center text-[10px] text-[var(--text-muted)] sm:text-[11px]">
                  <LockIcon className="shrink-0 text-[var(--text-muted)]" />
                  <span>Secured by Stripe – your payment details are encrypted.</span>
                </div>
              </div>
            </div>

            {/* Trust signals */}
            <div className="mt-6 grid grid-cols-1 gap-2 sm:mt-8 sm:grid-cols-3 sm:gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
                <ShieldIcon className="shrink-0 text-[var(--accent)]" />
                <span>256‑bit SSL</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
                <SparklesIcon className="shrink-0 text-[var(--accent)]" />
                <span>AI‑powered audit</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
                <CheckIcon className="shrink-0 text-[var(--accent)]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* ─── RIGHT – Order Summary Card ───────────────────── */}
          <aside className="h-fit rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_20px_45px_-30px_var(--accent-soft-strong)] transition-shadow hover:shadow-[0_25px_55px_-30px_var(--accent-soft-strong)] sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] sm:text-[11px]">
              Order Summary
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {plan.name} Plan
                </p>
                <p className="text-[12px] text-[var(--text-muted)]">
                  billed {cycle}
                </p>
                <p className="mt-1 font-mono text-[11px] text-[var(--accent)]">
                  {formatTokens(plan.tokensPerMonth)} tokens / mo
                </p>
              </div>

              <div className="space-y-2 border-t border-[var(--border-light)] pt-4 text-[13px]">
                <div className="flex items-center justify-between gap-3 text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{priceDisplay}</span>
                </div>
                {gstDisplay && (
                  <div className="flex items-center justify-between gap-3 text-[var(--text-secondary)]">
                    <span>GST (18%)</span>
                    <span className="font-mono tabular-nums">{gstDisplay}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[var(--border-light)] pt-4">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Total due today
                </span>
                <span className="font-mono text-lg font-bold tabular-nums text-[var(--text-primary)] sm:text-xl">
                  {totalDisplay}
                </span>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-[var(--accent)]">✓</span>
                    <span className="min-w-0">{f}</span>
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-[var(--text-muted)]">
                    +{plan.features.length - 4} more
                  </li>
                )}
              </ul>

              {/* Payment method note */}
              <div className="mt-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center text-xs text-[var(--text-muted)]">
                <span className="block">
                  💳 All major credit &amp; debit cards accepted
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[10px] text-[var(--text-muted)] sm:mt-12">
          By proceeding you agree to our{" "}
          <Link to="/terms" className="text-[var(--accent)] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-[var(--accent)] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}