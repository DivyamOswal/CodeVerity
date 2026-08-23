import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { PRICING_PLANS, formatPrice, formatTokens } from "./pricingPlans";

// -----------------------------------------------------------------
// UI-only checkout flow — no payment gateway wired in. The submit
// handler below is a stub; swap it for your real backend/payment
// gateway call (e.g. Razorpay for INR) where marked with TODO.
// -----------------------------------------------------------------

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

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
      />
    </label>
  );
}

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const planId = searchParams.get("plan") || "pro";
  const cycle = searchParams.get("cycle") === "yearly" ? "yearly" : "monthly";
  // Default currency is INR unless the link explicitly requests USD.
  const currency = searchParams.get("currency") === "USD" ? "USD" : "INR";

  const plan = useMemo(() => PRICING_PLANS.find((p) => p.id === planId) ?? PRICING_PLANS[1], [planId]);
  const price = plan[cycle][currency];
  const gst = currency === "INR" ? Math.round(price * 0.18) : 0;
  const subtotalWithTax = price + gst;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    promo: "",
  });
  const [promoApplied, setPromoApplied] = useState(null); // { code, discountPct }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleApplyPromo = () => {
    const code = form.promo.trim().toUpperCase();
    if (!code) return;
    // TODO: validate against your backend's promo-code endpoint instead of this stub
    if (code === "CODEVERITY20") {
      setPromoApplied({ code, discountPct: 20 });
      setError("");
    } else {
      setPromoApplied(null);
      setError("That promo code isn't valid.");
    }
  };

  const discount = promoApplied ? Math.round(subtotalWithTax * (promoApplied.discountPct / 100)) : 0;
  const grandTotal = Math.max(subtotalWithTax - discount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.email || !form.cardName || !form.cardNumber || !form.expiry || !form.cvv) {
      setError("Fill in every field before continuing.");
      return;
    }
    setSubmitting(true);
    try {
      // TODO: replace with your backend's order/checkout endpoint, e.g.
      // await api.post("/billing/checkout", { planId: plan.id, cycle, currency, amount: grandTotal, ...form });
      await new Promise((resolve) => setTimeout(resolve, 900));
      navigate("/dashboard");
    } catch {
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 bg-[var(--bg-primary)] px-6 py-16 lg:grid-cols-[1fr_360px]">
      {/* Payment form */}
      <div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeftIcon /> back to pricing
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Checkout</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          You're subscribing to the {plan.name} plan, billed {cycle}.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-7 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6"
        >
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
              contact
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.fullName} onChange={update("fullName")} placeholder="Full name" />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
              payment
            </h2>
            <div className="mt-3 space-y-4">
              <Field
                label="Name on card"
                value={form.cardName}
                onChange={update("cardName")}
                placeholder="Name as shown on card"
              />
              <Field
                label="Card number"
                value={form.cardNumber}
                onChange={(e) => setForm((f) => ({ ...f, cardNumber: formatCardNumber(e.target.value) }))}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Expiry"
                  value={form.expiry}
                  onChange={(e) => setForm((f) => ({ ...f, expiry: formatExpiry(e.target.value) }))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                />
                <Field
                  label="CVV"
                  type="password"
                  value={form.cvv}
                  onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                  placeholder="123"
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
              promo code
            </h2>
            <div className="mt-3 flex gap-2">
              <input
                value={form.promo}
                onChange={update("promo")}
                placeholder="Enter code"
                className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
              >
                Apply
              </button>
            </div>
            {promoApplied && (
              <p className="mt-2 text-[12px] text-[var(--accent)]">
                {promoApplied.code} applied — {promoApplied.discountPct}% off
              </p>
            )}
          </div>

          {error && <p className="text-[12px] text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--accent)] py-3 text-center text-[14px] font-semibold text-[var(--accent-contrast,#ffffff)] shadow-sm shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Processing…" : `Pay ${formatPrice(grandTotal, currency)}`}
          </button>
          <p className="text-center text-[11px] text-[var(--text-muted)]">
            Payments are processed securely. Cancel anytime from Settings.
          </p>
        </form>
      </div>

      {/* Order summary */}
      <aside className="h-fit rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
          order summary
        </h2>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{plan.name} plan</p>
            <p className="text-[12px] text-[var(--text-muted)]">billed {cycle}</p>
            <p className="mt-1 font-mono text-[11px] text-[var(--accent)]">
              {formatTokens(plan.tokensPerMonth)} tokens / mo · {plan.scansPerMonth} scans / mo
            </p>
          </div>
          <p className="font-mono text-sm text-[var(--text-primary)]">{formatPrice(price, currency)}</p>
        </div>

        <div className="mt-4 space-y-2 border-t border-[var(--border-light)] pt-4 text-[13px]">
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
          {promoApplied && (
            <div className="flex justify-between text-[var(--accent)]">
              <span>Discount ({promoApplied.discountPct}%)</span>
              <span>−{formatPrice(discount, currency)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--border-light)] pt-4">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Total due today</span>
          <span className="text-lg font-bold text-[var(--text-primary)]">{formatPrice(grandTotal, currency)}</span>
        </div>
      </aside>
    </div>
  );
}