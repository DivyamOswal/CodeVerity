// frontend/src/components/Auth/Login.jsx

import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "../../api/axios";
import { useAuth } from "../../App";
import AuthLayout from "./AuthLayout";
import { useToast } from "../../hooks/useToast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* -------------------------------------------------------------------------- */
/* ICONS                                                                      */
/* -------------------------------------------------------------------------- */

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
/* LOGIN                                                                      */
/* -------------------------------------------------------------------------- */

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  /* ------------------------------------------------------------------------ */
  /* VALIDATION                                                               */
  /* ------------------------------------------------------------------------ */

  const emailInvalid =
    touched.email &&
    (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  const passwordInvalid = touched.password && !password;

  /* ------------------------------------------------------------------------ */
  /* SUBMIT                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      email: true,
      password: true,
    });

    if (!email.trim() || !password) {
      error("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const token = res.data?.token ?? res.data?.accessToken;

      if (!token) {
        console.error(
          "Login response had no token field:",
          res.data
        );

        error(
          "Login succeeded but no token was returned. Check the API response."
        );

        return;
      }

      login(token);

      success("Welcome back! Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (err) {
      console.error("Login request failed:", err);

      error(
        err.response?.data?.error ??
          "Login failed. Please check your credentials and try again."
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
      title="Sign in to verify your repos"
      terminalText="awaiting credentials"
      onOAuth={handleOAuth}
      footer={{
        question: "Don't have an account?",
        linkText: "Register",
        linkTo: "/register",
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
        {/* ================================================================== */}
        {/* EMAIL                                                              */}
        {/* ================================================================== */}

        <div
          className="animate-fadeUp space-y-2"
          style={{ animationDelay: "120ms" }}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              className="
                flex
                items-center
                gap-1.5
                text-[10px]
                text-red-400
              "
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
          style={{ animationDelay: "190ms" }}
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

            <NavLink
              to="/forgot-password"
              tabIndex={loading ? -1 : 0}
              className="
                text-[11px]
                text-[var(--text-muted)]
                transition-colors
                duration-200
                hover:text-[var(--accent)]
              "
            >
              Forgot password?
            </NavLink>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() =>
                setTouched((prev) => ({
                  ...prev,
                  password: true,
                }))
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={passwordInvalid}
              aria-describedby={
                passwordInvalid ? "password-error" : undefined
              }
              className={`${inputBase} ${getInputBorder(
                passwordInvalid
              )}`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
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

          {passwordInvalid && (
            <p
              id="password-error"
              className="
                flex
                items-center
                gap-1.5
                text-[10px]
                text-red-400
              "
            >
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
          style={{ animationDelay: "225ms" }}
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
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>

          <span className="text-[10px] leading-4 text-[var(--text-muted)]">
            Your session is protected with secure authentication.
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
          style={{ animationDelay: "270ms" }}
        >
          {/* Shine */}

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
                  verifying…
                </span>
              </>
            ) : (
              <>
                <span>Sign in</span>

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