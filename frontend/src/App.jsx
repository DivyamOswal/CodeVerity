// frontend/src/App.jsx
import axios from "./api/axios";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  useState,
  useCallback,
  createContext,
  useContext,
  useEffect,
  lazy,
  Suspense,
} from "react";
import * as Sentry from "@sentry/react";
import SmoothScroll from "./components/SmoothScroll";
import Navbar from "./components/Navbar";
import PageLoader from "./components/PageLoader";
import ProtectedRoute from "./components/ProtectedRoute";

// ─── Lazy-loaded pages ───────────────────────────────────────
const Home = lazy(() => import("./components/Home"));
const Login = lazy(() => import("./components/Auth/Login"));
const Register = lazy(() => import("./components/Auth/Register"));
const History = lazy(() => import("./components/History"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Result = lazy(() => import("./components/Result"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Workspace = lazy(() => import("./pages/Workspace"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Support = lazy(() => import("./pages/Support"));
const Terms = lazy(() => import("./pages/Terms"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

import { PreferencesProvider } from "./context/PreferencesContext";
import { analyzeCode, generateTests, fetchRepoContents } from "./api/analyze";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { Toaster } from "react-hot-toast";

// ─── Sentry Error Fallback UI ──────────────────────────────────
function SentryFallback({ error, resetError }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--bg-card)] p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)]">
          <span className="text-2xl text-[var(--color-danger)]">⚠</span>
        </div>

        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          The error has been reported. You can reload or return home.
        </p>

        {error && (
          <details className="mt-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)]">
              Error details
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[10px] text-[var(--color-danger)]">
              {error.toString()}
            </pre>
          </details>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
          >
            Reload Page
          </button>
          <button
            onClick={resetError}
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Context ──────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Auth Provider ──────────────────────────────────────────────
function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setLoading(true);
      axios
        .get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    if (userData) setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const isAuth = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ token, user, isAuth, loading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── AnalyzePage (keep your existing code) ──────────────────
function AnalyzePage() {
  // ... your existing AnalyzePage code ...
}

// ─── Layout ─────────────────────────────────────────────────────
function Layout() {
  const location = useLocation();
  const { isAuth } = useAuth();

  const hideNavbar = ["/login", "/register"];
  const showNav = !hideNavbar.includes(location.pathname);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const smoother = ScrollSmoother.get();
      if (smoother) {
        smoother.scrollTo(0, false);
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <>
      {showNav && <Navbar />}
      <SmoothScroll>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/support" element={<Support />} />
            <Route
              path="/login"
              element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={
                isAuth ? <Navigate to="/dashboard" replace /> : <Register />
              }
            />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route
              path="/oauth-error"
              element={<Navigate to="/login" replace />}
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace"
              element={
                <ProtectedRoute>
                  <Workspace />
                </ProtectedRoute>
              }
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SmoothScroll>
    </>
  );
}

// ─── App ────────────────────────────────────────────────────────
export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={SentryFallback} showDialog={false}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-light)",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            },
            success: {
              iconTheme: { primary: "var(--color-success)", secondary: "white" },
              duration: 3000,
            },
            error: {
              iconTheme: { primary: "var(--color-danger)", secondary: "white" },
              duration: 5000,
            },
            loading: {
              iconTheme: { primary: "var(--accent)", secondary: "white" },
            },
          }}
        />
        <AuthProvider>
          <PreferencesProvider>
            <Layout />
          </PreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}