// frontend/src/components/Auth/Register.jsx

import { useState } from "react";
import { registerUser } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useToast } from "../../hooks/useToast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* -------------------------------------------------------------------------- */
/* ICONS                                                                      */
/* -------------------------------------------------------------------------- */

function UserIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.6-3.6 4.6-5.5 7.5-5.5s5.9 1.9 7.5 5.5" />
    </svg>
  );
}

function MailIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2.5" />
      <path d="m3 6.5 9 6 9-6" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </svg>
  );
}

function EyeIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16.7 16.7 0 0 1-3.1 3.8" />
      <path d="M6.2 6.9C3.8 8.7 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.8" />
      <path d="M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5" />
    </svg>
  );
}

function ArrowIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* REGISTER                                                                   */
/* -------------------------------------------------------------------------- */

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const { success, error } = useToast();
  const navigate = useNavigate();

  /* ------------------------------------------------------------------------ */
  /* VALIDATION                                                               */
  /* ------------------------------------------------------------------------ */

  const nameInvalid = touched.name && !form.name.trim();

  const emailInvalid =
    touched.email &&
    (!form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));

  const passwordInvalid = touched.password && !form.password;

  const passwordLengthValid = form.password.length >= 8;

  /* ------------------------------------------------------------------------ */
  /* FORM UPDATE                                                              */
  /* ------------------------------------------------------------------------ */

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* SUBMIT                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
    });

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      error("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      error("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      success("Account created! Please log in.");

      navigate("/login");
    } catch (err) {
      error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* OAUTH                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleOAuth = (provider) => {
    if (loading) return;

    window.location.href = `${API_URL}/auth/${provider}`;
  };

  /* ------------------------------------------------------------------------ */
  /* STYLES                                                                   */
  /* ------------------------------------------------------------------------ */

const inputBase = `
  w-full
  border-0
  bg-transparent
  py-3
  pl-11
  pr-11
  text-sm
  text-[var(--text-primary)]
  placeholder:text-[var(--text-muted)]
  transition-all
  duration-200
  focus:outline-none
  focus-visible:outline-none
  focus:ring-0
`;

  return (
    <AuthLayout
      title="Create your account"
      terminalText="start auditing repos"
      onOAuth={handleOAuth}
      footer={{
        question: "Already have an account?",
        linkText: "Sign in",
        linkTo: "/login",
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
        {/* ================================================================== */}
        {/* CREDENTIALS GROUP — name + email + password grouped into one
             bordered fieldset with hairline dividers, matching the
             pattern used on the Login form. */}
        {/* ================================================================== */}

        <div
          className="animate-fadeUp overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] transition-colors duration-200 focus-within:border-[var(--accent)]"
          style={{ animationDelay: "100ms" }}
        >
          {/* NAME */}
          <div className="px-1 pt-1">
            <label
              htmlFor="name"
              className="block px-3 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
            >
              Full name
            </label>

            <div className="group relative">
              <UserIcon
                className={`
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
                  h-[17px]
                  w-[17px]
                  -translate-y-1/2
                  transition-colors
                  duration-200
                  ${
                    nameInvalid
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--text-muted)] group-focus-within:text-[var(--accent)]"
                  }
                `}
              />

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    name: true,
                  }))
                }
                placeholder="Jane Doe"
                autoComplete="name"
                disabled={loading}
                aria-invalid={nameInvalid}
                aria-describedby={
                  nameInvalid ? "name-error" : undefined
                }
                className={inputBase}
              />
            </div>
          </div>

          <div className="h-px bg-[var(--border-light)]" />

          {/* EMAIL */}
          <div className="px-1">
            <label
              htmlFor="email"
              className="block px-3 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
            >
              Email address
            </label>

            <div className="group relative">
              <MailIcon
                className={`
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
                  h-[17px]
                  w-[17px]
                  -translate-y-1/2
                  transition-colors
                  duration-200
                  ${
                    emailInvalid
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--text-muted)] group-focus-within:text-[var(--accent)]"
                  }
                `}
              />

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    email: true,
                  }))
                }
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                disabled={loading}
                aria-invalid={emailInvalid}
                aria-describedby={
                  emailInvalid ? "email-error" : undefined
                }
                className={inputBase}
              />
            </div>
          </div>

          <div className="h-px bg-[var(--border-light)]" />

          {/* PASSWORD */}
          <div className="px-1 pb-1">
            <div className="flex items-center justify-between px-3 pt-2">
              <label
                htmlFor="password"
                className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]"
              >
                Password
              </label>

              <span
                className={`
                  font-mono
                  text-[9px]
                  uppercase
                  tracking-wider
                  transition-colors
                  ${
                    form.password.length === 0
                      ? "text-[var(--text-muted)] opacity-60"
                      : passwordLengthValid
                      ? "text-[var(--accent)]"
                      : "text-[var(--color-warning)]"
                  }
                `}
              >
                {form.password.length === 0
                  ? "8+ characters"
                  : passwordLengthValid
                  ? "valid"
                  : `${form.password.length}/8`}
              </span>
            </div>

            <div className="group relative">
              <LockIcon
                className={`
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
                  h-[17px]
                  w-[17px]
                  -translate-y-1/2
                  transition-colors
                  duration-200
                  ${
                    passwordInvalid
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--text-muted)] group-focus-within:text-[var(--accent)]"
                  }
                `}
              />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  updateField("password", e.target.value)
                }
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    password: true,
                  }))
                }
                placeholder="Create a secure password"
                autoComplete="new-password"
                disabled={loading}
                aria-invalid={passwordInvalid}
                aria-describedby="password-hint"
                className={inputBase}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="
                  absolute
                  right-2
                  top-1/2
                  flex
                  h-8
                  w-8
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-[var(--text-muted)]
                  transition-all
                  duration-200
                  hover:bg-[var(--bg-secondary)]
                  hover:text-[var(--text-primary)]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[var(--accent)]/30
                "
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Field errors — combined below the group, same pattern as
             the Login form, so the fieldset itself stays visually
             clean regardless of which field is invalid. */}

        {(nameInvalid || emailInvalid || passwordInvalid) && (
          <div className="-mt-2 space-y-1">
            {nameInvalid && (
              <p
                id="name-error"
                className="flex items-center gap-1.5 text-[10px] text-[var(--color-danger)]"
              >
                <span>•</span>
                Please enter your name.
              </p>
            )}
            {emailInvalid && (
              <p
                id="email-error"
                className="flex items-center gap-1.5 text-[10px] text-[var(--color-danger)]"
              >
                <span>•</span>
                Enter a valid email address.
              </p>
            )}
            {passwordInvalid && (
              <p className="flex items-center gap-1.5 text-[10px] text-[var(--color-danger)]">
                <span>•</span>
                Password is required.
              </p>
            )}
          </div>
        )}

        {/* Password strength — kept outside the fieldset as
             supplementary guidance rather than validation error. */}

        <div
          id="password-hint"
          className="animate-fadeUp -mt-2 space-y-1.5"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((segment) => {
              const filled =
                form.password.length >=
                [1, 4, 8, 12][segment];

              return (
                <div
                  key={segment}
                  className={`
                    h-1
                    flex-1
                    rounded-full
                    transition-all
                    duration-300
                    ${
                      filled
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--border-light)]"
                    }
                  `}
                />
              );
            })}
          </div>

          <p className="text-[9px] text-[var(--text-muted)]">
            Use at least 8 characters for your password.
          </p>
        </div>

        {/* ================================================================== */}
        {/* SUBMIT                                                             */}
        {/* ================================================================== */}

        <button
          type="submit"
          disabled={loading}
          className="
            animate-fadeUp
            group
            relative
            w-full
            overflow-hidden
            rounded-xl
            bg-[var(--accent)]
            py-3
            text-sm
            font-semibold
            text-[var(--accent-contrast)]
            shadow-[0_8px_30px_color-mix(in_srgb,var(--accent)_14%,transparent)]
            transition-all
            duration-300
            hover:-translate-y-[1px]
            hover:bg-[var(--accent-hover)]
            hover:shadow-[0_12px_35px_color-mix(in_srgb,var(--accent)_20%,transparent)]
            active:translate-y-0
            disabled:cursor-not-allowed
            disabled:translate-y-0
            disabled:opacity-50
            disabled:shadow-none
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--accent)]/40
            focus:ring-offset-2
            focus:ring-offset-[var(--bg-card)]
          "
          style={{ animationDelay: "220ms" }}
        >
          {/* Button shine */}

          <span
            aria-hidden="true"
            className="
              absolute
              inset-0
              -translate-x-full
              bg-gradient-to-r
              from-transparent
              via-white/15
              to-transparent
              transition-transform
              duration-1000
              ease-in-out
              group-hover:translate-x-full
            "
          />

          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span
                  className="
                    h-4
                    w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-[var(--accent-contrast)]/30
                    border-t-[var(--accent-contrast)]
                  "
                />

                <span className="font-mono text-[11px]">
                  creating account…
                </span>
              </>
            ) : (
              <>
                <span>Create account</span>

                <ArrowIcon
                  className="
                    h-4
                    w-4
                    transition-transform
                    duration-200
                    group-hover:translate-x-0.5
                  "
                />
              </>
            )}
          </span>
        </button>
      </form>
    </AuthLayout>
  );
}