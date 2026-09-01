// -----------------------------------------------------------------
// Shared pricing data + currency formatting for Pricing.jsx and
// Checkout.jsx, so the two pages can never show mismatched numbers.
// Adjust the import path in those two files to wherever you place
// this (e.g. src/data/pricingPlans.js).
// -----------------------------------------------------------------

// Default currency is INR (₹) pass "USD" explicitly to override.
export function formatPrice(amount, currency = "INR") {
  if (amount === 0) return currency === "INR" ? "₹0" : "$0";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Compact display for the token allowance on plan cards, e.g. 150000 -> "150K".
export function formatTokens(amount) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

// Yearly prices are ~20% off (monthly × 12), pre-computed here so the
// "Save 20%" badge on the pricing page always matches the real total.
// tokensPerMonth is the AI-analysis token allowance included with the
// plan it resets monthly regardless of billing cycle.
export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For individual developers exploring a few repos",
    monthly: { INR: 499, USD: 6 },
    yearly: { INR: 4790, USD: 58 },
    tokensPerMonth: 50000,
    features: [
      "50,000 AI tokens / month",
      "Unlimited repository scans",
      "AI-generated repo summaries",
      "Basic code quality report",
      "Community support",
    ],
    cta: "Get Starter",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For developers who ship deeper insight, higher token limits",
    monthly: { INR: 999, USD: 12 },
    yearly: { INR: 9590, USD: 115 },
    tokensPerMonth: 150000,
    features: [
      "150,000 AI tokens / month",
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
    monthly: { INR: 1499, USD: 18 },
    yearly: { INR: 14390, USD: 173 },
    tokensPerMonth: 400000,
    features: [
      "400,000 AI tokens / month (pooled)",
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