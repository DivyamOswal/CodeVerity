import { useEffect, useState } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { Users, Briefcase, FileText, DollarSign, TrendingUp, Activity, Clock, Zap } from "lucide-react";
import axios from "../api/axios";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { useToast } from "../hooks/useToast";

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_-20px_var(--accent-soft-strong)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)] sm:text-sm">{label}</p>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">{value}</p>
        </div>
        <div className={`shrink-0 rounded-full p-2.5 sm:p-3 ${color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}

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
  }, [user]);

  const fetchStats = async () => {
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

  const openDialog = ({ title, message, confirmText, cancelText, confirmVariant, onConfirm }) => {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 pt-20 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Admin Dashboard</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">Manage users, workspaces, and system settings.</p>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-[var(--color-info-soft)] text-[var(--color-info)]" />
          <StatCard label="Workspaces" value={stats?.totalWorkspaces || 0} icon={Briefcase} color="bg-[var(--accent-soft)] text-[var(--accent)]" />
          <StatCard label="Reports" value={stats?.totalReports || 0} icon={FileText} color="bg-[var(--color-success-soft)] text-[var(--color-success)]" />
          <StatCard label="Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="bg-[var(--color-warning-soft)] text-[var(--color-warning)]" />
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 overflow-x-auto border-b border-[var(--border-dark)]">
          <div className="flex gap-2 min-w-max sm:gap-4">
            {["overview", "users", "workspaces", "reports"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-2 text-xs font-medium capitalize transition-colors duration-150 sm:px-4 sm:text-sm ${
                  activeTab === tab
                    ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "overview" && <Overview stats={stats} />}
          {activeTab === "users" && <UserManagement openDialog={openDialog} />}
          {activeTab === "workspaces" && <WorkspaceManagement openDialog={openDialog} />}
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
  const systemUptime = "2d 4h 32m"; // Placeholder – you can compute from server start time if needed

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] sm:text-lg">System Overview</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 transition-colors duration-150 hover:border-[var(--border-medium)] sm:p-4">
            <Activity className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">System Status</p>
              <p className="text-sm font-medium text-[var(--color-success)]">● Online</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 transition-colors duration-150 hover:border-[var(--border-medium)] sm:p-4">
            <Clock className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">Uptime</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{systemUptime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 transition-colors duration-150 hover:border-[var(--border-medium)] sm:p-4">
            <Zap className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">Last Updated</p>
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{currentTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">User Activity</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Total Users</span>
              <span className="font-medium text-[var(--text-primary)]">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Workspaces</span>
              <span className="font-medium text-[var(--text-primary)]">{stats?.totalWorkspaces || 0}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Reports Generated</span>
              <span className="font-medium text-[var(--text-primary)]">{stats?.totalReports || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Financial Summary</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Total Revenue</span>
              <span className="font-medium text-[var(--text-primary)]">₹{(stats?.totalRevenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Average Revenue / User</span>
              <span className="font-medium text-[var(--text-primary)]">
                ₹{stats?.totalUsers ? Math.round((stats.totalRevenue || 0) / stats.totalUsers).toLocaleString() : 0}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--text-muted)]">Paid Users</span>
              <span className="font-medium text-[var(--text-primary)]">0</span> {/* You can add a field if you track paid users */}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Actions</h3>
        <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
          <button className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] active:scale-[0.97] sm:px-4 sm:text-sm">
            View All Users
          </button>
          <button className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] active:scale-[0.97] sm:px-4 sm:text-sm">
            Export Reports
          </button>
          <button className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] active:scale-[0.97] sm:px-4 sm:text-sm">
            System Logs
          </button>
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
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`/admin/users?search=${search}`);
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
      error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

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

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading users...</div>;

  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Name</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Email</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Admin</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-dark)]">
            {users.map((u) => (
              <tr key={u._id} className="transition-colors duration-150 hover:bg-[var(--bg-hover)]/40">
                <td className="px-4 py-2 text-[var(--text-primary)]">{u.name}</td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">{u.email}</td>
                <td className="px-4 py-2">
                  <span className={u.isGlobalAdmin ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}>
                    {u.isGlobalAdmin ? "✅" : "❌"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <button
                    onClick={() => toggleAdmin(u._id)}
                    className="rounded-lg border border-[var(--border-light)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-hover)] active:scale-[0.96]"
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

  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get("/admin/workspaces");
      setWorkspaces(res.data.workspaces);
    } catch (err) {
      console.error(err);
      error("Failed to load workspaces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const deleteWorkspace = (id) => {
    openDialog({
      title: "Delete Workspace",
      message: "Delete this workspace and all its data? This action cannot be undone.",
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

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading workspaces...</div>;

  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Workspace</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Owner</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Members</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-dark)]">
            {workspaces.map((ws) => (
              <tr key={ws._id} className="transition-colors duration-150 hover:bg-[var(--bg-hover)]/40">
                <td className="px-4 py-2 text-[var(--text-primary)]">{ws.name}</td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">{ws.ownerId?.email || "N/A"}</td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">{ws.members?.length || 0}</td>
                <td className="whitespace-nowrap px-4 py-2">
                  <button
                    onClick={() => deleteWorkspace(ws._id)}
                    className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-1 text-xs text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)]/20 active:scale-[0.96]"
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

  const fetchReports = async () => {
    try {
      const res = await axios.get("/admin/reports");
      setReports(res.data.reports);
    } catch (err) {
      console.error(err);
      error("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading reports...</div>;

  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Repo</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">User</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Workspace</th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-[var(--text-muted)]">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-dark)]">
            {reports.map((r) => (
              <tr key={r._id} className="transition-colors duration-150 hover:bg-[var(--bg-hover)]/40">
                <td className="px-4 py-2 text-[var(--text-primary)]">
                  <span className="inline-block max-w-[240px] truncate" title={r.repoUrl}>
                    {r.repoUrl}
                  </span>
                </td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">{r.userId?.email || "Unknown"}</td>
                <td className="px-4 py-2 text-[var(--text-secondary)]">{r.workspaceId?.name || "N/A"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-[var(--text-secondary)]">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}