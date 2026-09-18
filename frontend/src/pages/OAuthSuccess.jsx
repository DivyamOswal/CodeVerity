// src/pages/OAuthSuccess.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../App";

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      navigate("/login?error=" + encodeURIComponent(error));
      return;
    }

    if (token) {
      login(token);
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [params, login, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] px-4">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-soft)] opacity-50 blur-3xl"
      />

      <div
        role="status"
        aria-live="polite"
        aria-label="Completing sign in"
        className="relative z-10 flex flex-col items-center gap-5 text-center"
      >
        {/* Spinner with logo mark in the center */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <Loader2
            size={56}
            strokeWidth={1.6}
            aria-hidden="true"
            className="absolute inset-0 animate-spin text-[var(--accent)]"
          />
          <ShieldCheck
            size={20}
            strokeWidth={2}
            aria-hidden="true"
            className="relative text-[var(--accent)]"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Completing sign in
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            You'll be redirected to your dashboard shortly.
          </p>
        </div>
      </div>
    </div>
  );
}