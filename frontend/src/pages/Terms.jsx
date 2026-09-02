// frontend/src/pages/Terms.jsx
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext";

export default function Terms() {
  const { compact } = usePreferences();

  const compactClasses = compact
    ? {
        container: "px-3 py-4 sm:px-4",
        topPadding: "pt-14",
        heading: "text-lg sm:text-xl",
        subHeading: "text-xs",
        content: "text-xs space-y-4",
        sectionTitle: "text-sm font-semibold",
        sectionText: "text-xs leading-relaxed",
        listItem: "text-xs",
        backButton: "px-3 py-1.5 text-xs",
      }
    : {
        container: "px-4 py-6 sm:px-6 lg:px-8",
        topPadding: "pt-16",
        heading: "text-2xl sm:text-3xl",
        subHeading: "text-sm",
        content: "text-sm space-y-6",
        sectionTitle: "text-lg font-semibold",
        sectionText: "text-sm leading-relaxed",
        listItem: "text-sm",
        backButton: "px-4 py-2 text-sm",
      };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}>
      <div className={`mx-auto w-full max-w-4xl ${compactClasses.container}`}>
        {/* Header with back button */}
        <div className="mb-6">
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)] ${compactClasses.backButton}`}
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Legal
              </span>
            </div>
            <h1 className={`font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}>
              Terms of Service
            </h1>
            <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
              Last updated: September 1, 2026
            </p>
          </div>

          <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 ${compactClasses.content}`}>
            <section>
              <h2 className={compactClasses.sectionTitle}>1. Introduction</h2>
              <p className={compactClasses.sectionText}>
                Welcome to CodeVerity ("we," "our," or "us"). By using our platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>2. Acceptance of Terms</h2>
              <p className={compactClasses.sectionText}>
                By creating an account, accessing, or using CodeVerity, you acknowledge that you have read, understood, and agree to be bound by these terms and our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>3. User Accounts</h2>
              <ul className={`list-disc list-inside space-y-1 ${compactClasses.sectionText}`}>
                <li>You must be at least 18 years old to use this service.</li>
                <li>You are responsible for maintaining the security of your account and password.</li>
                <li>You agree to provide accurate and complete information during registration.</li>
                <li>You may not share your account credentials with others.</li>
              </ul>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>4. Use of Service</h2>
              <p className={compactClasses.sectionText}>
                CodeVerity provides AI‑powered repository analysis. You may use the service to:
              </p>
              <ul className={`list-disc list-inside space-y-1 ${compactClasses.sectionText}`}>
                <li>Analyse public and private GitHub repositories (with proper authorization).</li>
                <li>Generate reports, metrics, and test suggestions.</li>
                <li>Integrate with CI/CD pipelines via our API.</li>
              </ul>
              <p className={`mt-2 ${compactClasses.sectionText}`}>
                You may not use the service for any unlawful purpose or in a way that infringes the rights of others.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>5. Intellectual Property</h2>
              <p className={compactClasses.sectionText}>
                All content, trademarks, logos, and software on CodeVerity are the property of CodeVerity or its licensors. You may not copy, modify, or distribute any part of the service without prior written consent.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>6. Prohibited Activities</h2>
              <ul className={`list-disc list-inside space-y-1 ${compactClasses.sectionText}`}>
                <li>Reverse engineering or decompiling any part of the platform.</li>
                <li>Using the service to distribute malware or harmful code.</li>
                <li>Accessing data or accounts without proper authorisation.</li>
                <li>Interfering with the security or performance of the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>7. Termination</h2>
              <p className={compactClasses.sectionText}>
                We may suspend or terminate your account if you violate these terms. You may also delete your account at any time. Upon termination, your data will be deleted in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>8. Disclaimer of Warranties</h2>
              <p className={compactClasses.sectionText}>
                CodeVerity is provided "as is" without warranties of any kind. We do not guarantee that the analysis will be error‑free or that the service will be uninterrupted. Use at your own risk.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>9. Limitation of Liability</h2>
              <p className={compactClasses.sectionText}>
                To the fullest extent permitted by law, CodeVerity shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our service, even if we were advised of the possibility of such damages.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>10. Governing Law</h2>
              <p className={compactClasses.sectionText}>
                These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>11. Changes to Terms</h2>
              <p className={compactClasses.sectionText}>
                We may update these terms from time to time. We will notify you of any material changes via email or by posting a notice on our platform. Your continued use of the service constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className={compactClasses.sectionTitle}>12. Contact Information</h2>
              <p className={compactClasses.sectionText}>
                If you have any questions about these terms, please contact us at:
              </p>
              <p className={`mt-1 ${compactClasses.sectionText}`}>
                <a href="mailto:support@codeverity.dev" className="text-[var(--accent)] hover:underline">
                  support@codeverity.dev
                </a>
              </p>
            </section>

            <div className="mt-6 pt-4 border-t border-[var(--border-light)] text-[var(--text-muted)]">
              <p className="text-[9px]">© {new Date().getFullYear()} CodeVerity. All rights reserved.</p>
              <p className="text-[9px] mt-1">
                Also read our <Link to="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}