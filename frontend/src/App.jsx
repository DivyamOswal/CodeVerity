// frontend/src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useState, useCallback, createContext, useContext } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import History from "./components/History";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Result from "./components/Result";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import OAuthSuccess from "./pages/OAuthSuccess";

// ✅ Import the PreferencesProvider
import { PreferencesProvider } from "./context/PreferencesContext";

import { analyzeCode, generateTests, fetchRepoContents } from "./api/analyze";

//  Auth Context — single source of truth
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = useCallback((newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  const isAuth = !!token;

  return (
    <AuthContext.Provider value={{ token, isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

//  /analyze page (unchanged, keep your existing code)
function AnalyzePage() {
  // ... your existing AnalyzePage code ...
  // (I'm not repeating it here for brevity, but you should keep your existing code)
}

//  Layout
function Layout() {
  const location = useLocation();
  const { isAuth } = useAuth();

  const hideNavbar = ["/login", "/register"];
  const showNav = !hideNavbar.includes(location.pathname);

  return (
    <>
      {showNav && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuth ? <Navigate to="/dashboard" replace /> : <Register />}
        />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/oauth-error" element={<Navigate to="/login" replace />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          {" "}
          {/* ✅ Wrap Layout with PreferencesProvider */}
          <Layout />
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
