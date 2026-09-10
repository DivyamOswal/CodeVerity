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
    rounded-xl
    border
    bg-[var(--bg-input)]
    py-3
    pl-11
    pr-11
    text-sm
    text-[var(--text-primary)]
    placeholder:text-[var(--text-muted)]
    transition-all
    duration-200
    hover:border-[var(--border-medium)]
    focus:outline-none
    focus:ring-2
    focus:ring-[var(--accent)]/20
  `;

  const getInputBorder = (invalid) =>
    invalid
      ? "border-red-500/50 focus:border-red-500"
      : "border-[var(--border-light)] focus:border-[var(--accent)]";

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
        className="space-y-4"
      >
        {/* ================================================================== */}
        {/* NAME                                                               */}
        {/* ================================================================== */}

        <div
          className="animate-fadeUp space-y-2"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="name"
              className="
                font-mono
                text-[10px]
                font-medium
                uppercase
                tracking-[0.16em]
                text-[var(--text-muted)]
              "
            >
              Full name
            </label>

            <span
              className="
                font-mono
                text-[9px]
                uppercase
                tracking-wider
                text-[var(--text-muted)]
                opacity-60
              "
            >
              required
            </span>
          </div>

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
                    ? "text-red-400"
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
              className={`${inputBase} ${getInputBorder(
                nameInvalid
              )}`}
            />
          </div>

          {nameInvalid && (
            <p
              id="name-error"
              className="flex items-center gap-1.5 text-[10px] text-red-400"
            >
              <span>•</span>
              Please enter your name.
            </p>
          )}
        </div>

        {/* ================================================================== */}
        {/* EMAIL                                                              */}
        {/* ================================================================== */}

        <div
          className="animate-fadeUp space-y-2"
          style={{ animationDelay: "180ms" }}
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="email"
              className="
                font-mono
                text-[10px]
                font-medium
                uppercase
                tracking-[0.16em]
                text-[var(--text-muted)]
              "
            >
              Email address
            </label>

            <span
              className="
                font-mono
                text-[9px]
                uppercase
                tracking-wider
                text-[var(--text-muted)]
                opacity-60
              "
            >
              required
            </span>
          </div>

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
                    ? "text-red-400"
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
              className={`${inputBase} ${getInputBorder(
                emailInvalid
              )}`}
            />
          </div>

          {emailInvalid && (
            <p
              id="email-error"
              className="flex items-center gap-1.5 text-[10px] text-red-400"
            >
              <span>•</span>
              Enter a valid email address.
            </p>
          )}
        </div>

        {/* ================================================================== */}
        {/* PASSWORD                                                           */}
        {/* ================================================================== */}

        <div
          className="animate-fadeUp space-y-2"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="
                font-mono
                text-[10px]
                font-medium
                uppercase
                tracking-[0.16em]
                text-[var(--text-muted)]
              "
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
                    : "text-amber-400"
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
                    ? "text-red-400"
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
              className={`${inputBase} ${getInputBorder(
                passwordInvalid
              )}`}
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

          {/* Password strength */}

          <div
            id="password-hint"
            className="space-y-1.5"
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

          {passwordInvalid && (
            <p className="flex items-center gap-1.5 text-[10px] text-red-400">
              <span>•</span>
              Password is required.
            </p>
          )}
        </div>

        {/* ================================================================== */}
        {/* SECURITY INFO                                                      */}
        {/* ================================================================== */}

        <div
          className="
            animate-fadeUp
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-[var(--border-light)]
            bg-[var(--bg-secondary)]/50
            px-3
            py-2.5
          "
          style={{ animationDelay: "290ms" }}
        >
          <span
            className="
              flex
              h-5
              w-5
              shrink-0
              items-center
              justify-center
              rounded-md
              bg-[var(--accent)]/10
              text-[var(--accent)]
            "
          >
            <LockIcon className="h-3 w-3" />
          </span>

          <span className="text-[10px] leading-4 text-[var(--text-muted)]">
            Your account credentials are securely protected.
          </span>
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
          style={{ animationDelay: "330ms" }}
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