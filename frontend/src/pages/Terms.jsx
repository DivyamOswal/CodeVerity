// src/pages/Terms.jsx
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext";

export default function Terms() {
  const { compact } = usePreferences();

  const compactClasses = compact
    ? {
        container: "px-3 py-4 sm:px-4",
        topPadding: "pt-20",
        heading: "text-lg sm:text-xl",
        subHeading: "text-xs",
        content: "text-xs space-y-5",
        sectionTitle: "text-sm font-semibold",
        sectionText: "text-xs leading-relaxed",
        backButton: "px-3 py-1.5 text-[11px]",
        footerText: "text-[10px]",
      }
    : {
        container: "px-4 py-6 sm:px-6 lg:px-8",
        topPadding: "pt-24",
        heading: "text-2xl sm:text-3xl",
        subHeading: "text-sm",
        content: "text-sm space-y-6",
        sectionTitle: "text-lg font-semibold",
        sectionText: "text-sm leading-relaxed",
        backButton: "px-4 py-2 text-sm",
        footerText: "text-[11px]",
      };

  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}
    >
      <div className={`mx-auto w-full max-w-4xl ${compactClasses.container}`}>
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${compactClasses.backButton}`}
          >
            <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back
          </Link>
        </div>

        <div className="space-y-6">
          {/* HEADER */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]"
              />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Legal
              </span>
            </div>
            <h1
              className={`font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}
            >
              Terms of Service
            </h1>
            <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
              Last updated: September 1, 2026
            </p>
          </div>

          {/* CONTENT */}
          <div
            className={`relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 sm:p-8 ${compactClasses.content}`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"
            />

            <section>
              <h2 className={compactClasses.sectionTitle}>1. Introduction</h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                Welcome to CodeVerity ("we," "our," or "us"). By using our
                platform, you agree to comply with and be bound by these Terms
                of Service. If you do not agree, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>2. Acceptance of Terms</h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                By creating an account, accessing, or using CodeVerity, you
                acknowledge that you have read, understood, and agree to be
                bound by these terms and our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>3. User Accounts</h2>
              <ul className={`mt-2 ${compactClasses.sectionText}`}>
                {[
                  "You must be at least 18 years old to use this service.",
                  "You are responsible for maintaining the security of your account and password.",
                  "You agree to provide accurate and complete information during registration.",
                  "You may not share your account credentials with others.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>4. Use of Service</h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                CodeVerity provides AI-powered repository analysis. You may use
                the service to:
              </p>
              <ul className={`mt-2 ${compactClasses.sectionText}`}>
                {[
                  "Analyse public and private GitHub repositories (with proper authorization).",
                  "Generate reports, metrics, and test suggestions.",
                  "Integrate with CI/CD pipelines via our API.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className={`mt-3 ${compactClasses.sectionText}`}>
                You may not use the service for any unlawful purpose or in a way
                that infringes the rights of others.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>
                5. Intellectual Property
              </h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                All content, trademarks, logos, and software on CodeVerity are
                the property of CodeVerity or its licensors. You may not copy,
                modify, or distribute any part of the service without prior
                written consent.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>
                6. Prohibited Activities
              </h2>
              <ul className={`mt-2 ${compactClasses.sectionText}`}>
                {[
                  "Reverse engineering or decompiling any part of the platform.",
                  "Using the service to distribute malware or harmful code.",
                  "Accessing data or accounts without proper authorisation.",
                  "Interfering with the security or performance of the platform.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>7. Termination</h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                We may suspend or terminate your account if you violate these
                terms. You may also delete your account at any time. Upon
                termination, your data will be deleted in accordance with our
                Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>
                8. Disclaimer of Warranties
              </h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                CodeVerity is provided "as is" without warranties of any kind.
                We do not guarantee that the analysis will be error-free or that
                the service will be uninterrupted. Use at your own risk.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>
                9. Limitation of Liability
              </h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                To the fullest extent permitted by law, CodeVerity shall not be
                liable for any indirect, incidental, special, or consequential
                damages arising from the use of our service, even if we were
                advised of the possibility of such damages.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>10. Governing Law</h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                These terms shall be governed by and construed in accordance
                with the laws of India, without regard to its conflict of law
                provisions.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>11. Changes to Terms</h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                We may update these terms from time to time. We will notify you
                of any material changes via email or by posting a notice on our
                platform. Your continued use of the service constitutes
                acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>
                12. Contact Information
              </h2>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                If you have any questions about these terms, please contact us
                at{" "}
                <a
                  href="mailto:support@codeverity.dev"
                  className="rounded text-[var(--accent)] underline-offset-2 transition-colors hover:text-[var(--accent-hover)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                >
                  support@codeverity.dev
                </a>
                .
              </p>
            </section>

            {/* FOOTER */}
            <div
              className={`mt-6 border-t border-[var(--border-light)] pt-4 text-[var(--text-muted)] ${compactClasses.footerText}`}
            >
              <p>
                © {new Date().getFullYear()} CodeVerity. All rights reserved.
              </p>
              <p className="mt-1">
                Also read our{" "}
                <Link
                  to="/privacy"
                  className="rounded text-[var(--accent)] underline-offset-2 transition-colors hover:text-[var(--accent-hover)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}