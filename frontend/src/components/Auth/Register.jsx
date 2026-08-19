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
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Signature: same scanline field + one-time verification sweep as Login, kept consistent across auth */}
      <style>{`
        @keyframes cv-scan-sweep {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(480px); opacity: 0; }
        }
        @keyframes cv-blink {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        .cv-sweep { animation: cv-scan-sweep 2.4s ease-in-out 1; }
        .cv-caret { animation: cv-blink 1.1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cv-sweep { animation: none; opacity: 0; }
          .cv-caret { animation: none; }
        }
      `}</style>

      {/* ambient background: sparse dot grid, single color, very low opacity */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <span className="w-2 h-2 rounded-sm bg-indigo-400" />
            </span>
            <span className="font-mono text-sm tracking-[0.2em] text-neutral-400 uppercase">
              CodeVerify
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Create your account
          </h1>
          <p className="font-mono text-xs text-neutral-600 mt-2">
            <span className="text-indigo-400">$</span> start auditing repos
            <span className="cv-caret text-indigo-400">_</span>
          </p>
        </div>

        {/* Card with scan-corner framing */}
        <div className="relative">
          {/* corner brackets — single accent color, no gradients */}
          <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-indigo-500/50 rounded-tl-2xl" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-indigo-500/50 rounded-tr-2xl" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-indigo-500/50 rounded-bl-2xl" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-indigo-500/50 rounded-br-2xl" />

          <div className="relative overflow-hidden bg-[#111113] border border-white/10 rounded-2xl p-7 space-y-5">
            {/* one-time verification sweep line */}
            <div className="cv-sweep pointer-events-none absolute left-0 right-0 h-px bg-indigo-400/70 shadow-[0_0_12px_2px_rgba(99,102,241,0.6)]" />

            {error && (
              <div className="font-mono text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                error: {error}
              </div>
            )}

            {/* OAuth options */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium
                  bg-white/[0.04] border border-white/10 text-neutral-200
                  hover:bg-white/[0.08] hover:border-indigo-500/40 transition-colors"
              >
                <GitHubIcon className="w-4 h-4" />
                Continue with GitHub
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium
                  bg-white/[0.04] border border-white/10 text-neutral-200
                  hover:bg-white/[0.08] hover:border-indigo-500/40 transition-colors"
              >
                <GoogleIcon className="w-4 h-4" />
                Continue with Google
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                  Full name
                </label>
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
                <label className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                  Email
                </label>
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
                <label className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                  Password
                </label>
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
                  <span className="flex items-center justify-center gap-2 font-mono text-xs">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    creating account…
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

        <p className="text-center font-mono text-[11px] text-neutral-700 mt-6 tracking-wide">
          codeverify · repo analysis, verified
        </p>
      </div>
    </div>
  );
}
