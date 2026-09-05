import { useState } from "react";

// -----------------------------------------------------------------
// Local mini components  same pattern as the other pages in this app
// -----------------------------------------------------------------

function CodeVerityLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent)] shadow-lg shadow-[var(--accent-soft-strong)]">
        <div className="absolute inset-[1px] rounded-[7px] bg-[var(--bg-primary)]" />
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative text-[var(--accent)]"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-md bg-[var(--bg-secondary)] border border-[var(--border-light)]">
          <span className="font-mono text-[6px] font-bold text-[var(--accent)]">&lt;/&gt;</span>
        </div>
        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
      </div>
    </div>
  );
}

function ContactIcon({ name }) {
  const icons = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    github: (
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.61-3.37-1.34-3.37-1.34-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.55 2.34 1.1 2.91.84.09-.66.35-1.1.63-1.36-2.22-.26-4.56-1.13-4.56-5.02 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.04a9.3 9.3 0 0 1 5 0c1.91-1.31 2.75-1.04 2.75-1.04.55 1.42.2 2.46.1 2.72.64.71 1.03 1.62 1.03 2.73 0 3.9-2.34 4.76-4.57 5.01.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={name === "github" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
      />
    </label>
  );
}

const contactInfo = [
  {
    icon: "mail",
    label: "Email",
    value: "support@codeverity.app",
    href: "mailto:support@codeverity.app",
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
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    else if (form.message.trim().length < 10) next.message = "Message should be at least 10 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      // TODO: replace with your backend's contact endpoint, e.g.
      // await api.post("/contact", form);
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong sending your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", subject: "", message: "" });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Ambient background  flat color + blur, dot grid, no gradients */}
      <div className="pointer-events-none absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        {/* HERO */}
        <div className="text-center" style={{ animation: "fadeDown 0.6s ease both" }}>
          <div className="mb-5 flex items-center justify-center gap-3">
            <CodeVerityLogo />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            contact us
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Questions, bugs, or feedback {" "}
            <span className="text-[var(--accent)]">we read everything.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Whether it's a billing question, a false-positive from an audit, or a feature you wish existed 
            send it over.
          </p>
        </div>

        {/* CONTENT */}
        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_320px]" style={{ animation: "fadeUp 0.6s 0.1s ease both" }}>
          {/* FORM */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[0_20px_45px_-25px_var(--accent-soft-strong)] sm:p-8">
            <span className="absolute -top-px -left-px h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-[var(--accent)]/50" />
            <span className="absolute -top-px -right-px h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-[var(--accent)]/50" />
            <span className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-2xl border-b-2 border-l-2 border-[var(--accent)]/50" />
            <span className="absolute -bottom-px -right-px h-4 w-4 rounded-br-2xl border-b-2 border-r-2 border-[var(--accent)]/50" />

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold tracking-tight">Message sent</h2>
                <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
                  Thanks  we'll get back to you at <span className="text-[var(--text-primary)]">{form.email}</span> soon.
                </p>
                <button
                  onClick={resetForm}
                  className="mt-6 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.98]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Field label="Name" value={form.name} onChange={update("name")} placeholder="Your name" />
                    {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <Field
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>

                <Field
                  label="Subject (optional)"
                  value={form.subject}
                  onChange={update("subject")}
                  placeholder="What's this about?"
                />

                <div>
                  <label className="block">
                    <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                      Message
                    </span>
                    <textarea
                      value={form.message}
                      onChange={update("message")}
                      rows={6}
                      placeholder="Tell us what's going on..."
                      className="w-full resize-none rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </label>
                  {errors.message && <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>}
                </div>

                {submitError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">
                    error: {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--accent-contrast,#ffffff)] shadow-sm shadow-[var(--accent-soft-strong)] transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 sm:w-auto sm:px-8"
                >
                  {submitting ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-4">
            {contactInfo.map((c) => {
              const Wrapper = c.href ? "a" : "div";
              return (
                <Wrapper
                  key={c.label}
                  {...(c.href ? { href: c.href, target: c.href.startsWith("http") ? "_blank" : undefined, rel: "noreferrer" } : {})}
                  className={`flex items-start gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 transition-all duration-200 ${
                    c.href ? "hover:-translate-y-1 hover:border-[var(--accent)]/40" : ""
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                    <ContactIcon name={c.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{c.label}</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-[var(--text-primary)]">{c.value}</p>
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