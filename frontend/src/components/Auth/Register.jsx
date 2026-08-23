// frontend/src/components/Auth/Register.jsx
import { useState } from "react";
import { registerUser } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return setError("Please fill in all fields.");
    }

    try {
      setLoading(true);
      setError("");
      await registerUser(form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <AuthLayout
      title="Create your account"
      terminalText="start auditing repos"
      error={error}
      onOAuth={handleOAuth}
      footer={{ question: "Already have an account?", linkText: "Sign in", linkTo: "/login" }}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Full name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Doe"
            autoComplete="name"
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)]
              text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
              focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)]
              text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
              focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="new-password"
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
              creating account…
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}