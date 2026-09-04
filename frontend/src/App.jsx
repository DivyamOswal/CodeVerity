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
} from "react";
import SmoothScroll from "./components/SmoothScroll";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import History from "./components/History";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Result from "./components/Result";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Workspace from "./pages/Workspace";
import OAuthSuccess from "./pages/OAuthSuccess";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/AdminDashboard";

import { PreferencesProvider } from "./context/PreferencesContext";

import { analyzeCode, generateTests, fetchRepoContents } from "./api/analyze";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";

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

  // Fetch user when token changes
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
          // Invalid token – logout
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
  // (I've omitted it for brevity, but you should keep your existing code)
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
      </SmoothScroll>
    </>
  );
}

// ─── App ────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          <Layout />
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
