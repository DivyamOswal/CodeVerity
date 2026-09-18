// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Activity,
  Clock,
  Zap,
  Check,
  X,
  AlertCircle,
  RotateCw,
  Inbox,
} from "lucide-react";
import { useAuth } from "../App";
import axios from "../api/axios";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { useToast } from "../hooks/useToast";

// ─── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_-20px_var(--accent-soft-strong)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)] sm:text-sm">{label}</p>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            {value}
          </p>
        </div>
        <div className={`shrink-0 rounded-full p-2.5 sm:p-3 ${color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// ─── Table Loading Skeleton ────────────────────────────────────
function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-light)]">
      <div className="flex items-center gap-4 bg-[var(--bg-hover)] px-4 py-2.5">
        {Array.from({ length: cols }, (_, i) => (
          <span key={i} className="admin-skeleton h-3 flex-1 rounded" />
        ))}
      </div>
      <div className="divide-y divide-[var(--border-dark)]">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: cols }, (_, j) => (
              <span key={j} className="admin-skeleton h-3 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty Table Row ───────────────────────────────────────────
function EmptyTable({ icon: Icon, message, hint }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        {message}
      </p>
      {hint && <p className="max-w-xs text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

// ─── Error Panel ───────────────────────────────────────────────
function ErrorPanel({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-4 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)] ring-1 ring-[var(--color-danger)]/30">
        <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Couldn't load data
        </p>
        <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] active:scale-[0.97]"
      >
        <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmVariant: "danger",
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!user?.isGlobalAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      error("Failed to load admin statistics.");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = ({
    title,
    message,
    confirmText,
    cancelText,
    confirmVariant,
    onConfirm,
  }) => {
    setDialog({
      isOpen: true,
      title,
      message,
      confirmText: confirmText || "Confirm",
      cancelText: cancelText || "Cancel",
      confirmVariant: confirmVariant || "danger",
      onConfirm,
    });
  };

  const TABS = ["overview", "users", "workspaces", "reports"];

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-4 pt-20 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="space-y-2">
              <div className="admin-skeleton h-6 w-56 rounded" />
              <div className="admin-skeleton h-3 w-80 max-w-full rounded" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="admin-skeleton h-3 w-20 rounded" />
                      <div className="admin-skeleton h-6 w-16 rounded" />
                    </div>
                    <div className="admin-skeleton h-10 w-10 shrink-0 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-skeleton h-8 w-72 rounded" />
            <TableSkeleton rows={5} cols={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 pt-20 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
          Manage users, workspaces, and system settings.
        </p>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            color="bg-[var(--color-info-soft)] text-[var(--color-info)]"
          />
          <StatCard
            label="Workspaces"
            value={stats?.totalWorkspaces ?? 0}
            icon={Briefcase}
            color="bg-[var(--accent-soft)] text-[var(--accent)]"
          />
          <StatCard
            label="Reports"
            value={stats?.totalReports ?? 0}
            icon={FileText}
            color="bg-[var(--color-success-soft)] text-[var(--color-success)]"
          />
          <StatCard
            label="Revenue"
            value={`₹${(stats?.totalRevenue ?? 0).toLocaleString()}`}
            icon={DollarSign}
            color="bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
          />
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="Admin sections"
          className="mt-8 overflow-x-auto border-b border-[var(--border-dark)]"
        >
          <div className="flex min-w-max gap-2 sm:gap-4">
            {TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap rounded-t-md px-3 py-2 text-xs font-medium capitalize transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] sm:px-4 sm:text-sm ${
                    active
                      ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "overview" && <Overview stats={stats} />}
          {activeTab === "users" && <UserManagement openDialog={openDialog} />}
          {activeTab === "workspaces" && (
            <WorkspaceManagement openDialog={openDialog} />
          )}
          {activeTab === "reports" && <ReportManagement />}
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={dialog.isOpen}
          onClose={() => setDialog({ ...dialog, isOpen: false })}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          confirmVariant={dialog.confirmVariant}
        />
      </div>
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────
function Overview({ stats }) {
  const currentTime = new Date().toLocaleString();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] sm:text-lg">
          System Overview
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 transition-colors duration-150 hover:border-[var(--border-medium)] sm:p-4">
            <Activity
              size={20}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-[var(--accent)]"
            />
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">System Status</p>
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-success)]">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
                  aria-hidden="true"
                />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 transition-colors duration-150 hover:border-[var(--border-medium)] sm:p-4">
            <Clock
              size={20}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-[var(--accent)]"
            />
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">Last Updated</p>
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {currentTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            User Activity
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Total Users</span>
              <span className="font-medium text-[var(--text-primary)]">
                {stats?.totalUsers ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Workspaces</span>
              <span className="font-medium text-[var(--text-primary)]">
                {stats?.totalWorkspaces ?? 0}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Reports Generated</span>
              <span className="font-medium text-[var(--text-primary)]">
                {stats?.totalReports ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Financial Summary
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Total Revenue</span>
              <span className="font-medium text-[var(--text-primary)]">
                ₹{(stats?.totalRevenue ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Average Revenue / User</span>
              <span className="font-medium text-[var(--text-primary)]">
                ₹
                {stats?.totalUsers
                  ? Math.round(
                      (stats.totalRevenue || 0) / stats.totalUsers
                    ).toLocaleString()
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UserManagement ─────────────────────────────────────────────
function UserManagement({ openDialog }) {
  const { error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 300ms debounce on the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await axios.get(
        `/admin/users?search=${encodeURIComponent(debouncedSearch)}`
      );
      setUsers(res.data.users ?? []);
    } catch (err) {
      console.error(err);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const toggleAdmin = (userId) => {
    openDialog({
      title: "Toggle Admin Status",
      message: "Are you sure you want to change this user's admin status?",
      confirmText: "Toggle",
      confirmVariant: "primary",
      onConfirm: async () => {
        try {
          await axios.put(`/admin/users/${userId}/toggle-admin`);
          fetchUsers();
        } catch (err) {
          error(err.response?.data?.error || "Failed to toggle admin");
        }
      },
    });
  };

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  if (errored) {
    return (
      <ErrorPanel
        message="Something went wrong while fetching users."
        onRetry={fetchUsers}
      />
    );
  }

  if (users.length === 0) {
    return (
      <EmptyTable
        icon={Inbox}
        message={debouncedSearch ? "No users match your search" : "No users yet"}
        hint={
          debouncedSearch
            ? "Try a different search term."
            : "Users will appear here once they sign up."
        }
      />
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              {["Name", "Email", "Admin", "Actions"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-dark)]">
            {users.map((u) => (
              <tr
                key={u._id}
                className="transition-colors duration-150 hover:bg-[var(--bg-hover)]/40"
              >
                <td className="px-4 py-2 text-[var(--text-primary)]">
                  {u.name}
                </td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {u.email}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center ${
                      u.isGlobalAdmin
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {u.isGlobalAdmin ? (
                      <Check
                        size={14}
                        strokeWidth={2.6}
                        aria-label="Admin"
                      />
                    ) : (
                      <X size={14} strokeWidth={2.4} aria-label="Not admin" />
                    )}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <button
                    type="button"
                    onClick={() => toggleAdmin(u._id)}
                    className="rounded-lg border border-[var(--border-light)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.96]"
                  >
                    Toggle Admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── WorkspaceManagement ────────────────────────────────────────
function WorkspaceManagement({ openDialog }) {
  const { error } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const fetchWorkspaces = async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await axios.get("/admin/workspaces");
      setWorkspaces(res.data.workspaces ?? []);
    } catch (err) {
      console.error(err);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteWorkspace = (id) => {
    openDialog({
      title: "Delete Workspace",
      message:
        "Delete this workspace and all its data? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await axios.delete(`/admin/workspaces/${id}`);
          fetchWorkspaces();
        } catch (err) {
          error(err.response?.data?.error || "Failed to delete workspace");
        }
      },
    });
  };

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  if (errored) {
    return (
      <ErrorPanel
        message="Something went wrong while fetching workspaces."
        onRetry={fetchWorkspaces}
      />
    );
  }

  if (workspaces.length === 0) {
    return (
      <EmptyTable
        icon={Briefcase}
        message="No workspaces yet"
        hint="Workspaces will appear here once users create them."
      />
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              {["Workspace", "Owner", "Members", "Actions"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-dark)]">
            {workspaces.map((ws) => (
              <tr
                key={ws._id}
                className="transition-colors duration-150 hover:bg-[var(--bg-hover)]/40"
              >
                <td className="px-4 py-2 text-[var(--text-primary)]">
                  {ws.name}
                </td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {ws.ownerId?.email || "N/A"}
                </td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {ws.members?.length || 0}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <button
                    type="button"
                    onClick={() => deleteWorkspace(ws._id)}
                    className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-1 text-xs text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] active:scale-[0.96]"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ReportManagement ───────────────────────────────────────────
function ReportManagement() {
  const { error } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await axios.get("/admin/reports");
      setReports(res.data.reports ?? []);
    } catch (err) {
      console.error(err);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  if (errored) {
    return (
      <ErrorPanel
        message="Something went wrong while fetching reports."
        onRetry={fetchReports}
      />
    );
  }

  if (reports.length === 0) {
    return (
      <EmptyTable
        icon={FileText}
        message="No reports yet"
        hint="Reports will appear here once users run repository scans."
      />
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              {["Repo", "User", "Workspace", "Date"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-dark)]">
            {reports.map((r) => (
              <tr
                key={r._id}
                className="transition-colors duration-150 hover:bg-[var(--bg-hover)]/40"
              >
                <td className="px-4 py-2 text-[var(--text-primary)]">
                  <span
                    className="inline-block max-w-[240px] truncate"
                    title={r.repoUrl}
                  >
                    {r.repoUrl}
                  </span>
                </td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {r.userId?.email || "Unknown"}
                </td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {r.workspaceId?.name || "N/A"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-[var(--text-secondary)]">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}