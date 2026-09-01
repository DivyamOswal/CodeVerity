// src/components/PricingPlans.jsx

export function formatPrice(amount, currency = "INR") {
  if (amount === 0) return currency === "INR" ? "₹0" : "$0";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
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
    monthly: { INR: 499, USD: 6 },
    yearly: { INR: 4790, USD: 58 },
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
    monthly: { INR: 999, USD: 12 },
    yearly: { INR: 9590, USD: 115 },
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
    monthly: { INR: 1499, USD: 18 },
    yearly: { INR: 14390, USD: 173 },
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