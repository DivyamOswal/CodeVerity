// src/pages/Contact.jsx
import { useState } from "react";
import {
  ShieldCheck,
  Mail,
  Clock,
  Circle,
  Loader2,
} from "lucide-react";
import { useToast } from "../hooks/useToast";

// -----------------------------------------------------------------
// Local mini components
// -----------------------------------------------------------------

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
        <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
        <ShieldCheck
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className="relative text-[var(--accent)]"
        />
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-md border border-[var(--border-light)] bg-[var(--bg-secondary)]">
          <span className="font-mono text-[6px] font-bold text-[var(--accent)]">
            &lt;/&gt;
          </span>
        </div>
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}

// GitHub brand mark — custom SVG because lucide-react no longer
// exports the Github icon (removed for trademark reasons).
function GithubIcon({ size = 17, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.61-3.37-1.34-3.37-1.34-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.55 2.34 1.1 2.91.84.09-.66.35-1.1.63-1.36-2.22-.26-4.56-1.13-4.56-5.02 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.04a9.3 9.3 0 0 1 5 0c1.91-1.31 2.75-1.04 2.75-1.04.55 1.42.2 2.46.1 2.72.64.71 1.03 1.62 1.03 2.73 0 3.9-2.34 4.76-4.57 5.01.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

// Contact icons — three Lucide icons mapped by name.
const CONTACT_ICONS = {
  mail: Mail,
  github: GithubIcon,
  clock: Clock,
};

function ContactIcon({ name }) {
  const Icon = CONTACT_ICONS[name] ?? Mail;
  return <Icon size={17} strokeWidth={2} aria-hidden="true" />;
}

// Borderless input used inside a grouped fieldset.
const groupedInput = `
  w-full
  border-0
  bg-transparent
  px-3.5
  py-2.5
  text-sm
  text-[var(--text-primary)]
  outline-none
  placeholder:text-[var(--text-muted)]
  focus:outline-none
  focus-visible:outline-none
  focus:ring-0
`;

const contactInfo = [
  {
    icon: "mail",
    label: "Email",
    value: "support@codeverity.dev",
    href: "mailto:support@codeverity.dev",
  },
  {
    icon: "github",
    label: "GitHub",
    value: "github.com/codeverity",
    href: "https://github.com",
  },
  {
    icon: "clock",
    label: "Response time",
    value: "Usually within 1 business day",
    href: null,
  },
];

export default function Contact() {
  const { success, error } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!form.email.trim()) {
      next.email = "Enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!form.message.trim()) next.message = "Enter a message.";
    else if (form.message.trim().length < 10)
      next.message = "Message should be at least 10 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // TODO: replace with your backend's contact endpoint, e.g.
      // await api.post("/contact", form);
      await new Promise((resolve) => setTimeout(resolve, 900));
      success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setErrors({});
    } catch (err) {
      error("Something went wrong sending your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        {/* HERO */}
        <div className="animate-fadeDown text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <CodeVerityLogo />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            contact us
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Questions, bugs, or feedback{" "}
            <span className="text-[var(--accent)]">we read everything.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Whether it's a billing question, a false-positive from an audit, or
            a feature you wish existed — send it over.
          </p>
        </div>

        {/* CONTENT */}
        <div
          className="animate-fadeUp mt-14 grid gap-6 lg:grid-cols-[1fr_320px]"
          style={{ animationDelay: "100ms" }}
        >
          {/* FORM */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <span className="absolute -left-px -top-px h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/50" />
            <span className="absolute -right-px -top-px h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/50" />
            <span className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-2xl border-b-2 border-l-2 border-[var(--accent)]/50" />
            <span className="absolute -bottom-px -right-px h-4 w-4 rounded-br-2xl border-b-2 border-r-2 border-[var(--accent)]/50" />

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Name + Email */}
              <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] transition-colors duration-200 focus-within:border-[var(--accent)]">
                <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-[var(--border-light)]">
                  <div className="border-b border-[var(--border-light)] px-1 pt-1 sm:border-b-0">
                    <label
                      htmlFor="contact-name"
                      className="block px-3 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      value={form.name}
                      onChange={update("name")}
                      placeholder="Your name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name ? "contact-name-error" : undefined
                      }
                      className={groupedInput}
                    />
                  </div>
                  <div className="px-1 pb-1 sm:pb-0 sm:pt-1">
                    <label
                      htmlFor="contact-email"
                      className="block px-3 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder="you@example.com"
                      autoCapitalize="none"
                      spellCheck="false"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "contact-email-error" : undefined
                      }
                      className={groupedInput}
                    />
                  </div>
                </div>
              </div>

              {(errors.name || errors.email) && (
                <div className="-mt-2 space-y-1">
                  {errors.name && (
                    <p
                      id="contact-name-error"
                      className="flex items-center gap-1.5 text-xs text-[var(--color-danger)]"
                    >
                      <Circle
                        size={4}
                        fill="currentColor"
                        strokeWidth={0}
                        aria-hidden="true"
                      />
                      {errors.name}
                    </p>
                  )}
                  {errors.email && (
                    <p
                      id="contact-email-error"
                      className="flex items-center gap-1.5 text-xs text-[var(--color-danger)]"
                    >
                      <Circle
                        size={4}
                        fill="currentColor"
                        strokeWidth={0}
                        aria-hidden="true"
                      />
                      {errors.email}
                    </p>
                  )}
                </div>
              )}

              {/* Subject + Message */}
              <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] transition-colors duration-200 focus-within:border-[var(--accent)]">
                <div className="px-1 pt-1">
                  <label
                    htmlFor="contact-subject"
                    className="block px-3 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                  >
                    Subject <span className="opacity-60">(optional)</span>
                  </label>
                  <input
                    id="contact-subject"
                    value={form.subject}
                    onChange={update("subject")}
                    placeholder="What's this about?"
                    className={groupedInput}
                  />
                </div>

                <div className="h-px bg-[var(--border-light)]" />

                <div className="px-1 pb-1">
                  <div className="flex items-center justify-between px-3 pt-2">
                    <label
                      htmlFor="contact-message"
                      className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
                    >
                      Message
                    </label>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-wider transition-colors ${
                        form.message.trim().length === 0
                          ? "text-[var(--text-muted)] opacity-60"
                          : form.message.trim().length >= 10
                            ? "text-[var(--accent)]"
                            : "text-[var(--color-warning)]"
                      }`}
                    >
                      {form.message.trim().length === 0
                        ? "10+ characters"
                        : form.message.trim().length >= 10
                          ? "ok"
                          : `${form.message.trim().length}/10`}
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={update("message")}
                    rows={6}
                    placeholder="Tell us what's going on..."
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? "contact-message-error" : undefined
                    }
                    className={`${groupedInput} resize-none`}
                  />
                </div>
              </div>

              {errors.message && (
                <p
                  id="contact-message-error"
                  className="-mt-2 flex items-center gap-1.5 text-xs text-[var(--color-danger)]"
                >
                  <Circle
                    size={4}
                    fill="currentColor"
                    strokeWidth={0}
                    aria-hidden="true"
                  />
                  {errors.message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full overflow-hidden rounded-lg bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_8px_24px_-6px_var(--accent-soft-strong)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 disabled:hover:translate-y-0 sm:w-auto sm:px-8"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2
                        size={16}
                        strokeWidth={2.4}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                      Sending…
                    </>
                  ) : (
                    "Send message"
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-4">
            {contactInfo.map((c) => {
              const Wrapper = c.href ? "a" : "div";
              return (
                <Wrapper
                  key={c.label}
                  {...(c.href
                    ? {
                        href: c.href,
                        target: c.href.startsWith("http") ? "_blank" : undefined,
                        rel: "noreferrer",
                      }
                    : {})}
                  className={`flex items-start gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 transition-all duration-200 ${
                    c.href
                      ? "hover:-translate-y-1 hover:border-[var(--accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
                      : ""
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                    <ContactIcon name={c.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                      {c.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-[var(--text-primary)]">
                      {c.value}
                    </p>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>

        <p className="mt-10 text-center font-mono text-xs text-[var(--text-muted)]">
          CodeVerity · AI Repository Intelligence
        </p>
      </div>
    </div>
  );
}