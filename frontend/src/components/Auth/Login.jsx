// src/components/Auth/Login.jsx

import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Circle } from "lucide-react";
import axios from "../../api/axios";
import { useAuth } from "../../App";
import AuthLayout from "./AuthLayout";
import { useToast } from "../../hooks/useToast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* -------------------------------------------------------------------------- */
/* LOGIN                                                                      */
/* -------------------------------------------------------------------------- */

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

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

    setFormError("");
    setTouched({
      email: true,
      password: true,
    });

    if (!email.trim() || !password) {
      const msg = "Please enter your email and password.";
      setFormError(msg);
      toastError(msg);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const msg = "Please enter a valid email address.";
      setFormError(msg);
      toastError(msg);
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
        console.error("Login response had no token field:", res.data);

        const msg =
          "Login succeeded but no token was returned. Check the API response.";
        setFormError(msg);
        toastError(msg);
        return;
      }

      login(token);

      success("Welcome back! Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (err) {
      console.error("Login request failed:", err);

      const msg =
        err.response?.data?.error ??
        "Login failed. Please check your credentials and try again.";

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
      title="Sign in to verify your repos"
      terminalText="awaiting credentials"
      error={formError}
      onOAuth={handleOAuth}
      footer={{
        question: "Don't have an account?",
        linkText: "Register",
        linkTo: "/register",
      }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ================================================================== */}
        {/* CREDENTIALS GROUP                                                  */}
        {/* ================================================================== */}

        <div
          className="animate-fadeUp overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] transition-colors duration-200 focus-within:border-[var(--accent)]"
          style={{ animationDelay: "100ms" }}
        >
          {/* EMAIL */}
          <div className="px-1 pt-1">
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError("");
                }}
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

              <NavLink
                to="/forgot-password"
                tabIndex={loading ? -1 : 0}
                className="rounded text-[10px] text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-card)]"
              >
                Forgot password?
              </NavLink>
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
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError("");
                }}
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    password: true,
                  }))
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                enterKeyHint="go"
                disabled={loading}
                aria-invalid={passwordInvalid}
                aria-describedby={passwordInvalid ? "password-error" : undefined}
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

        {(emailInvalid || passwordInvalid) && (
          <div
            className="animate-fadeUp -mt-2 space-y-1"
            style={{ animationDelay: "0ms" }}
          >
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
              <p
                id="password-error"
                className="flex items-center gap-1.5 text-[10px] text-[var(--color-danger)]"
              >
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
          style={{ animationDelay: "180ms" }}
        >
          {/* Shine sweep on hover */}
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
                <span className="font-mono text-[11px]">verifying…</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
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