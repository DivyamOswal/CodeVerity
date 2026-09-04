import { Navigate } from "react-router-dom";
import { useAuth } from "../App";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuth, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.isGlobalAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}