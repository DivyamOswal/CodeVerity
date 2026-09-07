// frontend/src/pages/Checkout.jsx
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { PRICING_PLANS, formatPrice, formatTokens } from "../components/PricingPlans";
import axios from "../api/axios";

function ArrowLeftIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function LockIcon({ className = "" }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </svg>
  );
}

function AlertIcon({ className = "" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const planId = searchParams.get("plan") || "pro";
  const cycle = searchParams.get("cycle") === "yearly" ? "yearly" : "monthly";
  const currency = searchParams.get("currency") === "USD" ? "USD" : "INR";

  const plan = useMemo(() => PRICING_PLANS.find((p) => p.id === planId) ?? PRICING_PLANS[1], [planId]);
  const price = plan[cycle][currency];
  const gst = currency === "INR" ? Math.round(price * 0.18) : 0;
  const total = price + gst;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/billing/create-checkout-session", {
        plan: planId,
        cycle,
        currency,
      });
      // Redirect to Stripe Checkout
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 bg-[var(--bg-primary)] px-6 py-16 lg:grid-cols-[1fr_360px]">
      {/* LEFT – Checkout Form */}
      <div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
        >
          <ArrowLeftIcon /> back to pricing
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Checkout</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          You're subscribing to the {plan.name} plan, billed {cycle}.
        </p>

        <div className="mt-8 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[0_25px_55px_-35px_var(--accent-soft-strong)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-dark)] pb-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{plan.name} Plan</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatTokens(plan.tokensPerMonth)} tokens / mo · {cycle}
                </p>
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{formatPrice(price, currency)}</p>
            </div>

            {/* Order summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>{formatPrice(price, currency)}</span>
              </div>
              {currency === "INR" && (
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>GST (18%)</span>
                  <span>{formatPrice(gst, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--border-dark)] pt-2 text-base font-bold text-[var(--text-primary)]">
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                <AlertIcon className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full rounded-lg bg-[var(--accent)] py-3 text-center text-[14px] font-semibold text-[var(--accent-contrast,#ffffff)] shadow-sm shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              {loading ? "Redirecting…" : "Proceed to Payment"}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--text-muted)]">
              <LockIcon className="text-[var(--text-muted)]" />
              Secured by Stripe. Your payment details are encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT – Order Summary Card */}
      <aside className="h-fit rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[0_20px_45px_-30px_var(--accent-soft-strong)]">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
          Order Summary
        </h2>

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
              <span>{formatPrice(price, currency)}</span>
            </div>
            {currency === "INR" && (
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>GST (18%)</span>
                <span>{formatPrice(gst, currency)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border-light)] pt-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Total due today</span>
            <span className="text-lg font-bold text-[var(--text-primary)]">{formatPrice(total, currency)}</span>
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
        </div>
      </aside>
    </div>
  );
}
