// frontend/src/pages/Privacy.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePreferences } from "../context/PreferencesContext";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "repository-code", label: "Repository & Code Data" },
  { id: "how-we-use-it", label: "How We Use Information" },
  { id: "sharing", label: "Data Sharing" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "security", label: "Data Security" },
  { id: "retention", label: "Data Retention" },
  { id: "your-rights", label: "Your Rights & Choices" },
  { id: "children", label: "Children's Privacy" },
  { id: "international", label: "International Users" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
];

const LAST_UPDATED = "September 1, 2026";

export default function Privacy() {
  const { compact } = usePreferences();
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const navOffset = compact ? 64 : 76;
    const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const compactClasses = compact
    ? {
        topPadding: "pt-14",
        container: "px-3 py-4 sm:px-4",
        headerMargin: "mb-4",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[10px]",
        sidebarWidth: "md:w-56",
        sidebarButton: "px-3 py-2 text-xs",
        contentPadding: "p-4 sm:p-5",
        sectionGap: "space-y-4",
      }
    : {
        topPadding: "pt-16",
        container: "px-4 py-6 sm:px-6 lg:px-8",
        headerMargin: "mb-6",
        heading: "text-xl sm:text-2xl",
        subHeading: "text-xs",
        sidebarWidth: "md:w-64",
        sidebarButton: "px-4 py-2.5 text-sm",
        contentPadding: "p-6 sm:p-8",
        sectionGap: "space-y-5",
      };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}>
      <div className={`mx-auto w-full max-w-7xl ${compactClasses.container}`}>
        {/* HEADER */}
        <div className={compactClasses.headerMargin}>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Legal
            </span>
          </div>
          <h1 className={`mt-1 font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}>
            Privacy Policy
          </h1>
          <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
            Last updated: {LAST_UPDATED} · How CodeVerity collects, uses, and protects your data.
          </p>
        </div>

        {/* LAYOUT */}
        <div className={`flex flex-col md:flex-row ${compact ? "gap-4" : "gap-6"}`}>
          {/* SIDEBAR NAV — sticky, with scroll-spy active state */}
          <nav
            className={`${compactClasses.sidebarWidth} shrink-0`}
            aria-label="Privacy policy sections"
          >
            <div className="sticky top-20 flex flex-col gap-1 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-2 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`${compactClasses.sidebarButton} rounded-xl text-left font-medium transition-all ${
                    activeSection === s.id
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30"
                      : "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  }`}
                  aria-current={activeSection === s.id ? "true" : undefined}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </nav>

          {/* CONTENT */}
          <div
            className={`flex-1 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.contentPadding} ${compactClasses.sectionGap}`}
          >
            <PolicySection
              id="overview"
              title="Overview"
              refCallback={(el) => (sectionRefs.current.overview = el)}
            >
              <p>
                CodeVerity ("we," "our," "us") provides AI-powered analysis of GitHub
                repositories, including bug detection, security review, and test
                generation. This policy explains what information we collect when you
                use CodeVerity, how we use it, and the choices available to you.
              </p>
              <p>
                By creating an account or using CodeVerity, you agree to the practices
                described here. If you don't agree, please don't use the service.
              </p>
            </PolicySection>

            <PolicySection
              id="information-we-collect"
              title="Information We Collect"
              refCallback={(el) => (sectionRefs.current["information-we-collect"] = el)}
            >
              <SubHeading>Account information</SubHeading>
              <List
                items={[
                  "Name and email address, when you register directly or via GitHub/Google sign-in.",
                  "A securely hashed password, if you register with email and password rather than OAuth.",
                  "Basic profile details returned by GitHub or Google when you sign in with those providers (such as your name, email, and avatar).",
                ]}
              />
              <SubHeading>Usage information</SubHeading>
              <List
                items={[
                  "Repository URLs you submit for analysis.",
                  "Generated reports: scores, grades, summaries, and other analysis output tied to your account.",
                  "Token and scan usage against your plan's limits, so we can enforce fair-use and billing.",
                ]}
              />
              <SubHeading>Payment information</SubHeading>
              <p>
                If you upgrade to a paid plan, payment is handled by a third-party
                payment processor. CodeVerity does not store your full card details on
                our own servers.
              </p>
            </PolicySection>

            <PolicySection
              id="repository-code"
              title="Repository & Code Data"
              refCallback={(el) => (sectionRefs.current["repository-code"] = el)}
            >
              <p>
                When you submit a public GitHub repository for analysis, CodeVerity
                fetches the repository contents to run AI-powered analysis. Source code
                is processed in memory for the duration of the analysis and is not
                retained afterward.
              </p>
              <p>
                What <em>is</em> retained is the output of that analysis: your report
                (summary, scores, identified issues, generated tests) tied to your
                account, so you can revisit it later from your History page. If you
                delete a report or clear your history from Settings, that stored output
                is permanently removed.
              </p>
              <p>
                Private repository scanning (available on paid plans) uses OAuth-scoped,
                short-lived access tokens issued by GitHub, used only to fetch the
                repository you explicitly requested.
              </p>
            </PolicySection>

            <PolicySection
              id="how-we-use-it"
              title="How We Use Information"
              refCallback={(el) => (sectionRefs.current["how-we-use-it"] = el)}
            >
              <List
                items={[
                  "To provide the core service: authenticating you, running repository analysis, and displaying your reports.",
                  "To enforce plan limits (scans per month, tokens remaining) and manage billing for paid plans.",
                  "To communicate with you about your account, security notices, or changes to this policy.",
                  "To maintain and improve the reliability, security, and performance of CodeVerity.",
                ]}
              />
              <p>
                We do not use your submitted source code to train AI models, and we do
                not sell your personal information.
              </p>
            </PolicySection>

            <PolicySection
              id="sharing"
              title="Data Sharing"
              refCallback={(el) => (sectionRefs.current.sharing = el)}
            >
              <p>We share information only in the following limited circumstances:</p>
              <List
                items={[
                  "With infrastructure and AI-processing providers strictly necessary to run the analysis you request, under contractual confidentiality obligations.",
                  "With payment processors, to handle billing for paid plans.",
                  "If required by law, legal process, or to protect the rights, safety, or property of CodeVerity or others.",
                  "In connection with a merger, acquisition, or sale of assets, with notice to affected users where required.",
                ]}
              />
              <p>We do not sell or rent your personal data to third parties.</p>
            </PolicySection>

            <PolicySection
              id="cookies"
              title="Cookies & Tracking"
              refCallback={(el) => (sectionRefs.current.cookies = el)}
            >
              <p>
                CodeVerity uses essential cookies/local storage to keep you signed in
                (session tokens) and to remember display preferences such as compact
                mode and theme. We do not use third-party advertising trackers.
              </p>
            </PolicySection>

            <PolicySection
              id="security"
              title="Data Security"
              refCallback={(el) => (sectionRefs.current.security = el)}
            >
              <p>
                We use industry-standard measures to protect your data, including
                encrypted connections (HTTPS), hashed password storage, and
                access-scoped OAuth tokens for repository access. No method of
                transmission or storage is 100% secure, and we can't guarantee absolute
                security, but we work to protect your information and to respond
                quickly to any issue.
              </p>
            </PolicySection>

            <PolicySection
              id="retention"
              title="Data Retention"
              refCallback={(el) => (sectionRefs.current.retention = el)}
            >
              <List
                items={[
                  "Account information is retained for as long as your account is active.",
                  "Analysis reports are retained until you delete them individually, clear your history, or delete your account, all available from Settings.",
                  "Submitted source code is processed in memory only and is not retained after analysis completes.",
                  "Deleting your account permanently removes your account information and associated reports, generally within 30 days, except where retention is required by law.",
                ]}
              />
            </PolicySection>

            <PolicySection
              id="your-rights"
              title="Your Rights & Choices"
              refCallback={(el) => (sectionRefs.current["your-rights"] = el)}
            >
              <p>Depending on your location, you may have the right to:</p>
              <List
                items={[
                  "Access the personal data we hold about you.",
                  "Correct inaccurate information (via your Settings page).",
                  "Delete your account and associated data at any time from Settings → Danger Zone.",
                  "Export your report data (available as PDF downloads from History).",
                  "Object to or restrict certain processing of your data.",
                ]}
              />
              <p>
                To exercise any right not directly available in your account settings,
                contact us using the details below.
              </p>
            </PolicySection>

            <PolicySection
              id="children"
              title="Children's Privacy"
              refCallback={(el) => (sectionRefs.current.children = el)}
            >
              <p>
                CodeVerity is not directed to children under 16, and we do not
                knowingly collect personal information from children under 16. If you
                believe a child has provided us with personal information, please
                contact us and we will delete it.
              </p>
            </PolicySection>

            <PolicySection
              id="international"
              title="International Users"
              refCallback={(el) => (sectionRefs.current.international = el)}
            >
              <p>
                CodeVerity may process and store information on servers located outside
                your country of residence. By using the service, you consent to your
                information being processed in these locations, which may have data
                protection laws different from those in your jurisdiction.
              </p>
            </PolicySection>

            <PolicySection
              id="changes"
              title="Changes to This Policy"
              refCallback={(el) => (sectionRefs.current.changes = el)}
            >
              <p>
                We may update this policy from time to time. If we make material
                changes, we'll notify you by email or through a notice in the app
                before the changes take effect. The "Last updated" date at the top of
                this page reflects the most recent revision.
              </p>
            </PolicySection>

            <PolicySection
              id="contact"
              title="Contact Us"
              refCallback={(el) => (sectionRefs.current.contact = el)}
            >
              <p>
                If you have questions about this Privacy Policy or how your data is
                handled, reach out to{" "}
                
                  href="mailto:support@codeverity.dev"
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
                <a>
                  support@codeverity.dev
                </a>
                , or visit our{" "}
                <Link to="/contact" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                  Contact page
                </Link>
                .
              </p>
            </PolicySection>
          </div>
        </div>

        {/* FOOTER */}
        <div className={`flex items-center justify-center gap-2 py-3 text-[var(--text-muted)] text-[9px] ${compact ? "mt-4" : "mt-6"}`}>
          <span>CodeVerity</span>
          <span>•</span>
          <span>AI Repository Intelligence</span>
          <span>•</span>
          <Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function PolicySection({ id, title, children, refCallback }) {
  return (
    <section id={id} ref={refCallback} className="scroll-mt-20">
      <h2 className="text-base font-semibold text-[var(--text-primary)] sm:text-lg">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }) {
  return (
    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] first:mt-0">
      {children}
    </h3>
  );
}

function List({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}