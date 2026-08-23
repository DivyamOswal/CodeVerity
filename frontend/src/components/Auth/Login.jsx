// frontend/src/components/Auth/Login.jsx
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "../../api/axios";
import { useAuth } from "../../App";
import AuthLayout from "./AuthLayout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields.");

    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/auth/login", { email, password });

      // Defensive: some backends return `token`, others `accessToken`.
      // If sign-in still fails after this, check res.data in the console —
      // that'll confirm whether the problem is the response shape or
      // something upstream (axios baseURL, CORS, backend route) that
      // this component can't see on its own.
      const token = res.data?.token ?? res.data?.accessToken;

      if (!token) {
        console.error("Login response had no token field:", res.data);
        setError("Login succeeded but no token was returned. Check the API response shape.");
        return;
      }

      login(token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login request failed:", err);
      setError(err.response?.data?.error ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <AuthLayout
      title="Sign in to verify your repos"
      terminalText="awaiting credentials"
      error={error}
      onOAuth={handleOAuth}
      footer={{ question: "Don't have an account?", linkText: "Register", linkTo: "/register" }}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)]
              text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
              focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              Password
            </label>
            <NavLink to="/forgot-password" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              Forgot password?
            </NavLink>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)]
              text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
              focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl font-semibold text-sm text-[var(--accent-contrast,#ffffff)]
            bg-[var(--accent)] hover:bg-[var(--accent-hover)]
            disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2 font-mono text-xs">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              verifying…
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}