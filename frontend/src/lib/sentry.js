// frontend/src/lib/sentry.js
import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN_FRONTEND;

  if (!dsn) {
    console.warn("Sentry DSN not set — skipping init.");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // "development" | "production"
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    enabled: import.meta.env.MODE === "production",
  });
}