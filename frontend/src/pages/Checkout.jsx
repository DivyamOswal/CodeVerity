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

  const plan = useMemo(() => PRICING_PLANS.find((p) => p.id === planId) ?? PRICING_PLANS[1], [planId]);
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
      // Redirect to Stripe Checkout
      window.location.href = res.data.url;
    } catch (err) {
      const msg = err.response?.data?.error || "Checkout failed. Please try again.";
      error(msg);
      setLoading(false);
    }
  };

  const isMonthly = cycle === "monthly";
  const priceDisplay = formatPrice(price, currency);
  const totalDisplay = formatPrice(total, currency);
  const gstDisplay = currency === "INR" ? formatPrice(gst, currency) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back link */}
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
        >
          <ArrowLeftIcon /> back to pricing
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* ─── LEFT – Checkout Form ─────────────────────────── */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Checkout</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              You're subscribing to the <span className="font-semibold text-[var(--text-primary)]">{plan.name}</span> plan, billed {cycle}.
            </p>

            {/* Payment card */}
            <div className="mt-8 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[0_25px_55px_-35px_var(--accent-soft-strong)] transition-shadow hover:shadow-[0_30px_65px_-35px_var(--accent-soft-strong)]">
              <div className="space-y-5">
                {/* Plan summary */}
                <div className="flex items-start justify-between border-b border-[var(--border-dark)] pb-4">
                  <div>
                    <p className="text-base font-semibold text-[var(--text-primary)]">{plan.name} Plan</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatTokens(plan.tokensPerMonth)} tokens / mo · {cycle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[var(--text-primary)]">{priceDisplay}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{isMonthly ? 'per month' : 'per year'}</p>
                  </div>
                </div>

                {/* Order breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span>{priceDisplay}</span>
                  </div>
                  {gstDisplay && (
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>GST (18%)</span>
                      <span>{gstDisplay}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[var(--border-dark)] pt-2 text-base font-bold text-[var(--text-primary)]">
                    <span>Total</span>
                    <span>{totalDisplay}</span>
                  </div>
                </div>

                {/* Payment button */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-[var(--accent)] py-3.5 text-[15px] font-semibold text-[var(--accent-contrast)] transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 shadow-lg shadow-[var(--accent-soft-strong)]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--accent-contrast)', borderTopColor: 'transparent' }} />
                        Redirecting…
                      </>
                    ) : (
                      <>
                        Proceed to Payment
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                </button>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 text-center text-[11px] text-[var(--text-muted)]">
                  <LockIcon className="text-[var(--text-muted)]" />
                  <span>Secured by Stripe – your payment details are encrypted.</span>
                </div>
              </div>
            </div>

            {/* Trust signals */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                <ShieldIcon className="text-[var(--accent)]" />
                <span>256‑bit SSL</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                <SparklesIcon className="text-[var(--accent)]" />
                <span>AI‑powered audit</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                <CheckIcon className="text-[var(--accent)]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* ─── RIGHT – Order Summary Card ───────────────────── */}
          <aside className="h-fit rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[0_20px_45px_-30px_var(--accent-soft-strong)] transition-shadow hover:shadow-[0_25px_55px_-30px_var(--accent-soft-strong)]">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">Order Summary</h2>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{plan.name} Plan</p>
                <p className="text-[12px] text-[var(--text-muted)]">billed {cycle}</p>
                <p className="mt-1 font-mono text-[11px] text-[var(--accent)]">
                  {formatTokens(plan.tokensPerMonth)} tokens / mo
                </p>
              </div>

              <div className="border-t border-[var(--border-light)] pt-4 space-y-2 text-[13px]">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>{priceDisplay}</span>
                </div>
                {gstDisplay && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>GST (18%)</span>
                    <span>{gstDisplay}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border-light)] pt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Total due today</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{totalDisplay}</span>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[var(--accent)]">✓</span>
                    {f}
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-[var(--text-muted)]">+{plan.features.length - 4} more</li>
                )}
              </ul>

              {/* Payment method note */}
              <div className="mt-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center text-xs text-[var(--text-muted)]">
                <span className="block">💳 All major credit & debit cards accepted</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-center text-[10px] text-[var(--text-muted)]">
          By proceeding you agree to our <Link to="/terms" className="text-[var(--accent)] hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
