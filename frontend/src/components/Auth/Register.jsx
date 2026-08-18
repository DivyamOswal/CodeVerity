// frontend/src/components/Auth/Register.jsx
import { useState } from "react";
import { registerUser } from "../../api/auth";
import { Link, useNavigate } from "react-router-dom";
import { GitHubIcon, GoogleIcon } from "./OAuthIcons";

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
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Create your account</h1>
          <p className="text-neutral-500 text-sm mt-1.5">Start auditing repos with CodeVerity</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-7 space-y-5">
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* OAuth options */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium
                bg-white/5 border border-white/10 text-neutral-200
                hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium
                bg-white/5 border border-white/10 text-neutral-200
                hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              <GoogleIcon className="w-4 h-4" />
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-neutral-600 font-mono uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-neutral-400">Full name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                autoComplete="name"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10
                  text-white placeholder-neutral-600 text-sm
                  focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-neutral-400">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10
                  text-white placeholder-neutral-600 text-sm
                  focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-neutral-400">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10
                  text-white placeholder-neutral-600 text-sm
                  focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white
                bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}