// src/components/Auth/AuthLayout.jsx
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ShieldCheck, Bug, Workflow, Sparkles, AlertCircle } from "lucide-react";
import gsap from "gsap";

/* -------------------------------------------------------------------------- */
/*                                  LOGO                                      */
/* -------------------------------------------------------------------------- */

function CodeVerityLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className="
          relative flex h-10 w-10 shrink-0 items-center justify-center
          overflow-hidden rounded-xl
          border border-[var(--border-light)]
          bg-[var(--bg-card)]
          shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_12%,transparent)]
        "
      >
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_70%)]
          "
        />

        <ShieldCheck
          size={20}
          strokeWidth={2.2}
          aria-hidden="true"
          className="relative z-10 text-[var(--accent)]"
        />

        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-card)]" />
      </div>

      {!compact && (
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            Code<span className="text-[var(--accent)]">Verity</span>
          </div>

          <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
            AI Code Intelligence
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FEATURE ROW                                   */
/* -------------------------------------------------------------------------- */

function FeatureRow({ icon, title, description }) {
  return (
    <div className="group flex gap-4 transition-transform duration-300 hover:translate-x-1">
      <div
        className="
          flex h-9 w-9 shrink-0 items-center justify-center
          rounded-lg
          border border-[var(--border-light)]
          bg-[var(--bg-card)]
          text-[var(--accent)]
          transition-all duration-300
          group-hover:border-[var(--accent)]
          group-hover:bg-[var(--accent-soft)]
          group-hover:shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_15%,transparent)]
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {title}
        </div>

        <div className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
          {description}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              METRIC CARD                                   */
/* -------------------------------------------------------------------------- */

function MetricCard({ label, value, accent = false }) {
  return (
    <div
      className={`
        rounded-lg border px-3 py-2.5
        ${
          accent
            ? "border-[var(--accent)]/25 bg-[var(--accent-soft)]"
            : "border-[var(--border-light)] bg-[var(--bg-card)]"
        }
      `}
    >
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              AUTH LAYOUT                                   */
/* -------------------------------------------------------------------------- */

export default function AuthLayout({
  title,
  terminalText,
  error,
  onOAuth,
  footer,
  children,
}) {
  const cornersRef = useRef(null);
  const cursorRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const cardRef = useRef(null);
  const cardGlowRef = useRef(null);
  const rightPanelRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      if (cornersRef.current) {
        gsap.to(cornersRef.current.children, {
          opacity: 0.35,
          duration: 1.8,
          stagger: 0.15,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          opacity: 0,
          duration: 0.55,
          repeat: -1,
          yoyo: true,
          ease: "none",
        });
      }

      if (orb1Ref.current) {
        gsap.to(orb1Ref.current, {
          x: 55,
          y: 35,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (orb2Ref.current) {
        gsap.to(orb2Ref.current, {
          x: -45,
          y: -30,
          duration: 10,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 14, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "power3.out" }
        );
      }

      if (cardRef.current && cardGlowRef.current) {
        const card = cardRef.current;
        const glow = cardGlowRef.current;
        const quickX = gsap.quickTo(glow, "left", {
          duration: 0.5,
          ease: "power3.out",
        });
        const quickY = gsap.quickTo(glow, "top", {
          duration: 0.5,
          ease: "power3.out",
        });

        const handleMove = (e) => {
          const rect = card.getBoundingClientRect();
          quickX(e.clientX - rect.left);
          quickY(e.clientY - rect.top);
        };
        const handleEnter = () => gsap.to(glow, { opacity: 1, duration: 0.3 });
        const handleLeave = () => gsap.to(glow, { opacity: 0, duration: 0.4 });

        if (window.matchMedia("(pointer: fine)").matches) {
          card.addEventListener("mousemove", handleMove);
          card.addEventListener("mouseenter", handleEnter);
          card.addEventListener("mouseleave", handleLeave);
        }

        return () => {
          card.removeEventListener("mousemove", handleMove);
          card.removeEventListener("mouseenter", handleEnter);
          card.removeEventListener("mouseleave", handleLeave);
        };
      }
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (rightPanelRef.current) {
      gsap.fromTo(
        rightPanelRef.current.children,
        { opacity: 0, x: 18 },
        {
          opacity: 1,
          x: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.1,
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!error || !errorRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.fromTo(
      errorRef.current,
      { x: -6 },
      { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" }
    );
  }, [error]);

  return (
    <div
      className="
        flex h-dvh w-full overflow-hidden
        bg-[var(--bg-primary)]
        text-[var(--text-primary)]
      "
    >
      {/* ================================================================== */}
      {/* LEFT SIDE                                                          */}
      {/* ================================================================== */}

      <main
        className="
          no-scrollbar relative flex min-h-0 w-full
          flex-col overflow-y-auto overscroll-contain
          lg:w-1/2
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0
            opacity-[0.035]
            [background-image:linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)]
            [background-size:36px_36px]
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute left-1/2 top-[-180px]
            h-[360px] w-[360px]
            -translate-x-1/2
            rounded-full
            bg-[var(--accent)]
            opacity-[0.035]
            blur-[100px]
          "
        />

        {/* Mobile header */}
        <div
          className="
            relative z-10 flex items-center justify-between
            border-b border-[var(--border-light)]/60
            bg-[var(--bg-primary)]/80 px-6 py-4
            backdrop-blur-md
            lg:hidden
          "
        >
          <Link
            to="/"
            aria-label="CodeVerity home"
            className="rounded transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          >
            <CodeVerityLogo compact />
          </Link>

          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Secure
            </span>
          </div>
        </div>

        {/* Centered content */}
        <div
          className="
            relative z-10
            flex flex-1
            items-center justify-center
            px-5 py-6
            sm:px-8
            lg:px-10
            xl:px-14
          "
        >
          <div className="w-full max-w-[470px]">
            {/* HEADER */}
            <div className="mb-6">
              <div
                className="
                  mb-3 flex items-center gap-2
                  font-mono text-[11px]
                  text-[var(--text-muted)]
                "
              >
                <span className="text-[var(--accent)]">~/codeverity</span>
                <span className="opacity-40">›</span>
                <span>{terminalText}</span>

                <span
                  ref={cursorRef}
                  className="ml-0.5 inline-block h-3 w-[2px] bg-[var(--accent)]"
                />
              </div>

              <h1
                className="
                  text-2xl font-semibold
                  tracking-[-0.025em]
                  text-[var(--text-primary)]
                  sm:text-[28px]
                "
              >
                {title}
              </h1>

              <div className="mt-2 h-px w-10 bg-[var(--accent)] opacity-70" />
            </div>

            {/* AUTH CARD */}
            <div
              ref={cardRef}
              className="
                relative
                overflow-hidden
                rounded-2xl
                border border-[var(--border-light)]
                bg-[var(--bg-card)]
                shadow-[var(--shadow-xl)]
                backdrop-blur-xl
                transition-shadow duration-300
              "
            >
              <div
                ref={cardGlowRef}
                aria-hidden="true"
                className="pointer-events-none absolute z-0 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
                style={{
                  left: "50%",
                  top: "0%",
                  background:
                    "radial-gradient(circle, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)",
                }}
              />

              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60"
              />

              <div
                ref={cornersRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10"
              >
                <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-xl border-l border-t border-[var(--accent)]" />
                <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-xl border-r border-t border-[var(--accent)]" />
                <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-xl border-b border-l border-[var(--accent)]" />
                <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-xl border-b border-r border-[var(--accent)]" />
              </div>

              <div className="relative z-10 p-5 sm:p-7">
                {/* ERROR */}
                {error && (
                  <div
                    ref={errorRef}
                    role="alert"
                    aria-live="assertive"
                    className="
                      mb-5 flex gap-3
                      rounded-xl
                      border border-[var(--color-danger)]/20
                      bg-[var(--color-danger-soft)]
                      px-4 py-3
                    "
                  >
                    <div
                      className="
                        mt-0.5 flex h-5 w-5 shrink-0
                        items-center justify-center
                        rounded-full
                        bg-[var(--color-danger)]/10
                        text-[var(--color-danger)]
                      "
                    >
                      <AlertCircle
                        size={12}
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--color-danger)]">
                        Something went wrong
                      </div>

                      <div
                        className="mt-0.5 text-xs leading-5"
                        style={{
                          color:
                            "color-mix(in srgb, var(--color-danger) 70%, transparent)",
                        }}
                      >
                        {error}
                      </div>
                    </div>
                  </div>
                )}

                {/* OAUTH */}
                {onOAuth && (
                  <>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => onOAuth("github")}
                        className="
                          group flex h-12 items-center justify-center gap-2.5
                          rounded-xl
                          border border-[var(--border-light)]
                          bg-[var(--bg-secondary)]
                          text-sm font-medium
                          text-[var(--text-primary)]
                          transition-all duration-200
                          hover:-translate-y-0.5
                          hover:border-[var(--accent)]
                          hover:bg-[var(--bg-primary)]
                          hover:shadow-[0_8px_25px_color-mix(in_srgb,var(--accent)_8%,transparent)]
                          focus-visible:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-[var(--accent)]/50
                          focus-visible:ring-offset-2
                          focus-visible:ring-offset-[var(--bg-card)]
                          active:translate-y-0
                          active:scale-[0.98]
                          sm:h-11
                        "
                      >
                        <GithubIcon />
                        <span>GitHub</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOAuth("google")}
                        className="
                          group flex h-12 items-center justify-center gap-2.5
                          rounded-xl
                          border border-[var(--border-light)]
                          bg-[var(--bg-secondary)]
                          text-sm font-medium
                          text-[var(--text-primary)]
                          transition-all duration-200
                          hover:-translate-y-0.5
                          hover:border-[var(--accent)]
                          hover:bg-[var(--bg-primary)]
                          hover:shadow-[0_8px_25px_color-mix(in_srgb,var(--accent)_8%,transparent)]
                          focus-visible:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-[var(--accent)]/50
                          focus-visible:ring-offset-2
                          focus-visible:ring-offset-[var(--bg-card)]
                          active:translate-y-0
                          active:scale-[0.98]
                          sm:h-11
                        "
                      >
                        <GoogleIcon />
                        <span>Google</span>
                      </button>
                    </div>

                    <div className="my-6 flex items-center gap-3">
                      <div className="h-px flex-1 bg-[var(--border-light)]" />

                      <span
                        className="
                          font-mono text-[9px]
                          uppercase tracking-[0.18em]
                          text-[var(--text-muted)]
                        "
                      >
                        or continue with
                      </span>

                      <div className="h-px flex-1 bg-[var(--border-light)]" />
                    </div>
                  </>
                )}

                {/* FORM CONTENT */}
                <div>{children}</div>

                {/* FOOTER */}
                {footer && (
                  <div
                    className="
                      mt-6
                      border-t
                      border-[var(--border-light)]
                      pt-5
                      text-center
                      text-xs
                      text-[var(--text-muted)]
                    "
                  >
                    {typeof footer === "object" ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{footer.question}</span>

                        <Link
                          to={footer.linkTo}
                          className="
                            rounded font-medium
                            text-[var(--accent)]
                            transition-colors duration-200
                            hover:text-[var(--accent-hover)]
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[var(--accent)]/50
                          "
                        >
                          {footer.linkText}
                        </Link>
                      </div>
                    ) : (
                      footer
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECURITY FOOTNOTE */}
            <div className="mt-4 flex flex-col items-center gap-2.5">
              <div
                className="
                  flex items-center gap-2
                  rounded-full
                  border border-[var(--border-light)]
                  bg-[var(--bg-card)]/60
                  px-3 py-1.5
                  text-[10px]
                  text-[var(--text-muted)]
                "
              >
                <span
                  className="
                    h-1.5 w-1.5 rounded-full
                    bg-[var(--accent)]
                    shadow-[0_0_8px_var(--accent)]
                  "
                />

                <span>Secure authentication · Your data stays protected</span>
              </div>

              <Link
                to="/"
                className="
                  flex items-center gap-1.5
                  rounded
                  text-[11px] font-medium
                  text-[var(--text-muted)]
                  transition-colors duration-200
                  hover:text-[var(--accent)]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[var(--accent)]/50
                "
              >
                <span aria-hidden="true">←</span>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ================================================================== */}
      {/* RIGHT SIDE                                                         */}
      {/* ================================================================== */}

      <aside
        className="
          relative hidden
          w-1/2 overflow-hidden
          border-l border-[var(--border-light)]
          bg-[var(--bg-secondary)]
          lg:flex
          lg:items-stretch
          lg:justify-center
        "
      >
        <div
          ref={orb1Ref}
          aria-hidden="true"
          className="
            pointer-events-none absolute
            -right-24 -top-24
            h-80 w-80
            rounded-full
            bg-[var(--accent)]
            opacity-[0.07]
            blur-[90px]
          "
        />

        <div
          ref={orb2Ref}
          aria-hidden="true"
          className="
            pointer-events-none absolute
            -bottom-24 -left-24
            h-96 w-96
            rounded-full
            bg-[var(--accent)]
            opacity-[0.045]
            blur-[100px]
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0
            opacity-[0.035]
            [background-image:radial-gradient(circle,var(--text-primary)_1px,transparent_1px)]
            [background-size:22px_22px]
          "
        />

        <div
          ref={rightPanelRef}
          className="
            relative z-10 flex min-h-full w-full max-w-[500px]
            flex-col px-10 py-8
            xl:px-14
          "
        >
          {/* BRAND */}
          <Link
            to="/"
            aria-label="CodeVerity home"
            className="
              inline-flex self-start rounded
              transition-opacity
              hover:opacity-80
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--accent)]/50
            "
          >
            <CodeVerityLogo />
          </Link>

          {/* HERO */}
          <div className="mt-12">
            <div
              className="
                mb-5 inline-flex items-center gap-2
                rounded-full
                border border-[var(--border-light)]
                bg-[var(--bg-card)]
                px-3 py-1.5
                font-mono text-[9px]
                uppercase tracking-[0.16em]
                text-[var(--text-muted)]
              "
            >
              <span
                className="
                  h-1.5 w-1.5 rounded-full
                  bg-[var(--accent)]
                  shadow-[0_0_8px_var(--accent)]
                "
              />
              Intelligent development
            </div>

            <h2
              className="
                max-w-[430px]
                text-3xl font-semibold
                leading-[1.12]
                tracking-[-0.035em]
                text-[var(--text-primary)]
                xl:text-[38px]
              "
            >
              Understand your code.
              <br />
              <span className="text-[var(--accent)]">
                Ship with confidence.
              </span>
            </h2>

            <p
              className="
                mt-5 max-w-[410px]
                text-sm leading-6
                text-[var(--text-secondary)]
              "
            >
              CodeVerity combines AI-powered code intelligence with practical
              developer workflows to help you understand, analyze, and improve
              your software.
            </p>
          </div>

          {/* FEATURES */}
          <div className="mt-10 space-y-6">
            <FeatureRow
              icon={<Bug size={16} strokeWidth={1.75} aria-hidden="true" />}
              title="AI-powered analysis"
              description="Get intelligent insights into code quality, architecture, bugs, and potential improvements."
            />

            <FeatureRow
              icon={<Workflow size={16} strokeWidth={1.75} aria-hidden="true" />}
              title="Developer-first workflow"
              description="Keep analysis, history, repositories, and development context connected in one workspace."
            />

            <FeatureRow
              icon={<Sparkles size={16} strokeWidth={1.75} aria-hidden="true" />}
              title="Actionable intelligence"
              description="Turn complex code insights into practical recommendations you can actually implement."
            />
          </div>

          {/* SYSTEM STATUS  hidden below 860px viewport height */}
          <div className="mt-10 hidden [@media(min-height:860px)]:block">
            <div
              className="
                flex items-center justify-between
                border-t border-[var(--border-light)]
                pt-5
              "
            >
              <div className="flex items-center gap-2">
                <span
                  className="
                    h-1.5 w-1.5 rounded-full
                    bg-[var(--accent)]
                    shadow-[0_0_9px_var(--accent)]
                  "
                />

                <span
                  className="
                    font-mono text-[9px]
                    uppercase tracking-[0.16em]
                    text-[var(--text-muted)]
                  "
                >
                  System online
                </span>
              </div>

              <span className="font-mono text-[9px] text-[var(--text-muted)]">
                v1.0
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MetricCard label="AI Engine" value="Ready" accent />
              <MetricCard label="Uptime" value="99.9%" />
              <MetricCard label="Response" value="&lt; 2s" />
            </div>
          </div>

          {/* COPYRIGHT  pushed to bottom by mt-auto */}
          <div
            className="
              mt-auto flex items-center justify-between pt-8
              font-mono text-[9px]
              text-[var(--text-muted)]
            "
          >
            <span>© {new Date().getFullYear()} CodeVerity</span>
            <div className="flex items-center gap-3">
              <Link
                to="/privacy"
                className="rounded transition-colors hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="rounded transition-colors hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ICONS                                       */
/* -------------------------------------------------------------------------- */

function GithubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="
        h-[17px] w-[17px]
        text-[var(--text-secondary)]
        transition-colors
        group-hover:text-[var(--text-primary)]
      "
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.16c-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.08.78 2.18v3.24c0 .31.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.7-.06-1.38-.18-2.03H12v3.84h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.17Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.83-.87 6.43-2.36l-3.14-2.43c-.87.58-1.98.92-3.29.92-2.53 0-4.68-1.71-5.45-4.01H3.3v2.51A9.71 9.71 0 0 0 12 21.5Z"
      />
      <path
        fill="#FBBC05"
        d="M6.55 13.62A5.84 5.84 0 0 1 6.24 12c0-.56.1-1.1.31-1.62V7.87H3.3A9.5 9.5 0 0 0 2.3 12c0 1.49.36 2.9 1 4.13l3.25-2.51Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.37c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.48 14.63 2.5 12 2.5a9.71 9.71 0 0 0-8.7 5.37l3.25 2.51c.77-2.3 2.92-4.01 5.45-4.01Z"
      />
    </svg>
  );
}