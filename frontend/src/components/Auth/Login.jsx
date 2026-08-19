// frontend/src/components/Auth/Login.jsx
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "../../api/axios";
import { useAuth } from "../../App";

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
      const token = res.data.token;
      login(token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Full-page redirect — OAuth requires the backend to hand off to the
  // provider (Passport or similar), an axios call can't do this handshake.
  const handleOAuth = (provider) => {
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Signature: faint scanline field + one-time verification sweep, standing in for "analyzing a repo" */}
      <style>{`
        @keyframes cv-scan-sweep {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(420px); opacity: 0; }
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
            Sign in to verify your repos
          </h1>
          <p className="font-mono text-xs text-neutral-600 mt-2">
            <span className="text-indigo-400">$</span> awaiting credentials
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

            {/* Email / password */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10
                    text-white placeholder-neutral-600 text-sm
                    focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                    Password
                  </label>
                  <NavLink to="/forgot-password" className="text-xs text-neutral-500 hover:text-indigo-400 transition-colors">
                    Forgot password?
                  </NavLink>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                    verifying…
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-neutral-500">
              Don't have an account?{" "}
              <NavLink to="/register" className="text-indigo-400 hover:text-indigo-300">
                Register
              </NavLink>
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

function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.21 11.68.6.12.82-.27.82-.6 0-.3-.01-1.08-.02-2.12-3.34.75-4.04-1.64-4.04-1.64-.55-1.44-1.34-1.82-1.34-1.82-1.09-.77.08-.75.08-.75 1.21.09 1.84 1.28 1.84 1.28 1.07 1.87 2.81 1.33 3.5 1.02.11-.79.42-1.33.76-1.64-2.67-.31-5.47-1.38-5.47-6.15 0-1.36.47-2.47 1.24-3.34-.12-.31-.54-1.57.12-3.28 0 0 1.01-.33 3.3 1.28a11.3 11.3 0 0 1 6 0c2.29-1.61 3.3-1.28 3.3-1.28.66 1.71.24 2.97.12 3.28.77.87 1.24 1.98 1.24 3.34 0 4.78-2.81 5.83-5.49 6.14.43.38.82 1.13.82 2.29 0 1.65-.02 2.98-.02 3.39 0 .33.22.72.83.6C20.57 22.34 24 17.73 24 12.3 24 5.5 18.63 0 12 0Z" />
    </svg>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.1A11.998 11.998 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}
