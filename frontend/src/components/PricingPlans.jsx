// -----------------------------------------------------------------
// Shared pricing data + currency formatting for Pricing.jsx and
// Checkout.jsx, so the two pages can never show mismatched numbers.
// Adjust the import path in those two files to wherever you place
// this (e.g. src/data/pricingPlans.js).
// -----------------------------------------------------------------

// Default currency is INR (₹) — pass "USD" explicitly to override.
export function formatPrice(amount, currency = "INR") {
  if (amount === 0) return currency === "INR" ? "₹0" : "$0";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Yearly prices are ~20% off (monthly × 12), pre-computed here so the
// "Save 20%" badge on the pricing page always matches the real total.
export const PRICING_PLANS = [
  {
    id: "solo",
    name: "Solo",
    tagline: "For individual developers exploring a few repos",
    monthly: { INR: 0, USD: 0 },
    yearly: { INR: 0, USD: 0 },
    features: [
      "5 repository scans / month",
      "AI-generated repo summaries",
      "Basic code quality report",
      "Community support",
    ],
    cta: "Start for free",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For developers who ship — unlimited scans, deeper insight",
    monthly: { INR: 799, USD: 10 },
    yearly: { INR: 7670, USD: 96 },
    features: [
      "Unlimited repository scans",
      "Deep AI code review & summaries",
      "Security & vulnerability flags",
      "Full scan history & exports",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    id: "team",
    name: "Team",
    tagline: "For teams reviewing code together, at scale",
    monthly: { INR: 2499, USD: 30 },
    yearly: { INR: 23990, USD: 288 },
    features: [
      "Everything in Pro",
      "Up to 10 team seats",
      "Shared scan history & dashboards",
      "Org-wide usage analytics",
      "Priority chat support",
    ],
    cta: "Get Team",
    highlight: false,
  },
];