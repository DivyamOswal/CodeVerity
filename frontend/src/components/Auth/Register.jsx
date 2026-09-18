// src/components/Auth/Register.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Circle,
} from "lucide-react";
import { registerUser } from "../../api/auth";
import AuthLayout from "./AuthLayout";
import { useToast } from "../../hooks/useToast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  const [formError, setFormError] = useState("");

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  /* ------------------------------------------------------------------------ */
  /* VALIDATION                                                               */
  /* ------------------------------------------------------------------------ */

  const nameInvalid = touched.name && !form.name.trim();

  const emailInvalid =
    touched.email &&
    (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));

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
    if (formError) setFormError("");
  };

  /* ------------------------------------------------------------------------ */
  /* SUBMIT                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");
    setTouched({
      name: true,
      email: true,
      password: true,
    });

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      const msg = "Please fill in all fields.";
      setFormError(msg);
      toastError(msg);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      const msg = "Please enter a valid email address.";
      setFormError(msg);
      toastError(msg);
      return;
    }

    if (form.password.length < 8) {
      const msg = "Password must be at least 8 characters.";
      setFormError(msg);
      toastError(msg);
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
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Registration failed. Please try again.";
      setFormError(msg);
      toastError(msg);
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
      error={formError}
      onOAuth={handleOAuth}
      footer={{
        question: "Already have an account?",
        linkText: "Sign in",
        linkTo: "/login",
      }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* CREDENTIALS GROUP */}
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
              <User
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
                className={`
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
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
                enterKeyHint="next"
                disabled={loading}
                aria-invalid={nameInvalid}
                aria-describedby={nameInvalid ? "name-error" : undefined}
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
              <Mail
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
                className={`
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
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
                enterKeyHint="next"
                disabled={loading}
                aria-invalid={emailInvalid}
                aria-describedby={emailInvalid ? "email-error" : undefined}
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
              <Lock
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
                className={`
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
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
                onChange={(e) => updateField("password", e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    password: true,
                  }))
                }
                placeholder="Create a secure password"
                autoComplete="new-password"
                enterKeyHint="go"
                disabled={loading}
                aria-invalid={passwordInvalid}
                aria-describedby="password-hint"
                className={inputBase}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[var(--accent)]/50
                "
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={1.8} aria-hidden="true" />
                ) : (
                  <Eye size={16} strokeWidth={1.8} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FIELD ERRORS */}
        {(nameInvalid || emailInvalid || passwordInvalid) && (
          <div className="-mt-2 space-y-1">
            {nameInvalid && (
              <p
                id="name-error"
                className="flex items-center gap-1.5 text-[10px] text-[var(--color-danger)]"
              >
                <Circle
                  size={4}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
                Please enter your name.
              </p>
            )}
            {emailInvalid && (
              <p
                id="email-error"
                className="flex items-center gap-1.5 text-[10px] text-[var(--color-danger)]"
              >
                <Circle
                  size={4}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
                Enter a valid email address.
              </p>
            )}
            {passwordInvalid && (
              <p className="flex items-center gap-1.5 text-[10px] text-[var(--color-danger)]">
                <Circle
                  size={4}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
                Password is required.
              </p>
            )}
          </div>
        )}

        {/* PASSWORD STRENGTH */}
        <div
          id="password-hint"
          className="animate-fadeUp -mt-2 space-y-1.5"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((segment) => {
              const filled = form.password.length >= [1, 4, 8, 12][segment];

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

        {/* SUBMIT */}
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
            hover:-translate-y-0.5
            hover:bg-[var(--accent-hover)]
            hover:shadow-[0_12px_35px_color-mix(in_srgb,var(--accent)_20%,transparent)]
            active:translate-y-0
            disabled:cursor-not-allowed
            disabled:translate-y-0
            disabled:opacity-50
            disabled:shadow-none
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--accent)]/50
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[var(--bg-card)]
          "
          style={{ animationDelay: "220ms" }}
        >
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
                <ArrowRight
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </>
            )}
          </span>
        </button>
      </form>
    </AuthLayout>
  );
}