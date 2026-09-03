// src/components/PricingPlans.jsx

export function formatPrice(amount, currency = "INR") {
  if (amount === 0) return currency === "INR" ? "₹0" : "$0";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "INR" ? 0 : 2, // show cents for USD
  }).format(amount);
}

export function formatTokens(amount) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For individual developers exploring a few repos",
    monthly: { INR: 589, USD: 7.08 },      // +18% GST
    yearly: { INR: 5652, USD: 68.44 },     // +18% GST
    tokensPerMonth: 15000,
    features: [
      "15,000 AI tokens / month",
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
    monthly: { INR: 1179, USD: 14.16 },    // +18% GST
    yearly: { INR: 11316, USD: 135.70 },   // +18% GST
    tokensPerMonth: 25000,
    features: [
      "25,000 AI tokens / month",
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
    monthly: { INR: 1769, USD: 21.24 },    // +18% GST
    yearly: { INR: 16980, USD: 204.14 },   // +18% GST
    tokensPerMonth: 50000,
    features: [
      "50,000 AI tokens / month (pooled)",
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

// Optional: add a label on the pricing page
export const TAX_NOTE = "* All prices include 18% GST";
