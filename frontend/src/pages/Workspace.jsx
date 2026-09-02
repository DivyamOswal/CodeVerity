// frontend/src/pages/WorkspaceSettings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";
import { Copy, Check, RefreshCw, Trash2, Plus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

// ─── Import the workspace API functions ──────────────────────
import {
  getWorkspace,
  updateWorkspace,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
  leaveWorkspace,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  updateIntegrations,
  getAuditLogs,
  getRepositories,
  getWorkspaceAnalytics,
  updateBranding,
  getQualityTrends,
  getSchedules,
  createSchedule,
  deleteSchedule,
  updateWebhook,
  testWebhook,
} from "../api/workspace";

const TABS = [
  "General",
  "Integrations",
  "API Keys",
  "Members",
  "Billing",
  "Audit Log",
  "Repositories",
  "Analytics",
  "Branding",
  "Schedules",
  "Webhooks",
  "Trends",
];

export default function WorkspaceSettings() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { compact } = usePreferences();

  // ── Core data ──
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("General");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Analytics ──
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Branding ──
  const [branding, setBranding] = useState({
    logo: "",
    primaryColor: "#22d3ee",
    secondaryColor: "#0e7490",
    brandName: "CodeVerity",
  });
  const [brandingSubmitting, setBrandingSubmitting] = useState(false);

  // ── Schedules ──
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    repoUrl: "",
    frequency: "daily",
    time: "09:00",
  });

  // ── Webhooks ──
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  // ── Trends ──
  const [trends, setTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // ── General Settings ──
  const [workspaceName, setWorkspaceName] = useState("");
  const [editingName, setEditingName] = useState(false);

  // ── Integrations ──
  const [integrations, setIntegrations] = useState({
    slack: { enabled: false, webhookUrl: "", channel: "" },
    jira: { enabled: false, url: "", apiToken: "", projectKey: "" },
  });

  // ── API Keys ──
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState(null);

  // ── Members ──
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [showInvite, setShowInvite] = useState(false);

  // ── Load data ──
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadWorkspaceData();
  }, [token]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      const [wsRes, membersRes, keysRes, logsRes] = await Promise.all([
        getWorkspace(),
        getMembers(),
        getApiKeys(),
        getAuditLogs(),
      ]);
      setWorkspace(wsRes.data.workspace);
      setWorkspaceName(wsRes.data.workspace?.name || "");
      setMembers(membersRes.data.members || []);
      setApiKeys(keysRes.data.apiKeys || []);
      setAuditLogs(logsRes.data.logs || []);
      if (wsRes.data.workspace?.settings?.integrations) {
        setIntegrations(wsRes.data.workspace.settings.integrations);
      }
      if (wsRes.data.workspace?.branding) {
        setBranding(wsRes.data.workspace.branding);
      }
      if (wsRes.data.workspace?.webhookUrl) {
        setWebhookUrl(wsRes.data.workspace.webhookUrl);
      }
      if (wsRes.data.workspace?.webhookSecret) {
        setWebhookSecret(wsRes.data.workspace.webhookSecret);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  // ── Repositories ──
  const fetchRepositories = async () => {
    try {
      setReposLoading(true);
      const res = await getRepositories();
      setRepositories(res.data.repositories || []);
    } catch (err) {
      console.error("Failed to fetch repositories", err);
      setError(err.response?.data?.error || "Failed to load repositories");
    } finally {
      setReposLoading(false);
    }
  };

  // ── Analytics ──
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await getWorkspaceAnalytics();
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      setError(err.response?.data?.error || "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ── Schedules ──
  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const res = await getSchedules();
      setSchedules(res.data.schedules || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load schedules");
    } finally {
      setSchedulesLoading(false);
    }
  };

  // ── Trends ──
  const fetchTrends = async () => {
    try {
      setTrendsLoading(true);
      const res = await getQualityTrends();
      setTrends(res.data.trends || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load trends");
    } finally {
      setTrendsLoading(false);
    }
  };

  // Auto-fetch when tab changes
  useEffect(() => {
    if (activeTab === "Repositories") fetchRepositories();
    if (activeTab === "Analytics") fetchAnalytics();
    if (activeTab === "Schedules") fetchSchedules();
    if (activeTab === "Trends") fetchTrends();
  }, [activeTab]);

  // ── Handlers ──

  // Workspace name
  const updateWorkspaceName = async () => {
    if (!workspaceName.trim()) return;
    try {
      setSubmitting(true);
      await updateWorkspace({ name: workspaceName.trim() });
      setEditingName(false);
      setSuccess("Workspace name updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Integrations
  const updateIntegrationsSettings = async () => {
    try {
      setSubmitting(true);
      await updateIntegrations(integrations);
      setSuccess("Integrations saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save integrations");
    } finally {
      setSubmitting(false);
    }
  };

  // API Keys
  const createApiKeyHandler = async () => {
    if (!newKeyName.trim()) return;
    try {
      setSubmitting(true);
      const res = await createApiKey({ name: newKeyName.trim() });
      setApiKeys([...apiKeys, res.data.apiKey]);
      setNewKeyValue(res.data.apiKey.key);
      setNewKeyName("");
      setShowNewKey(false);
      setSuccess("API key created");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteApiKeyHandler = async (keyId) => {
    if (!window.confirm("Delete this API key? This cannot be undone.")) return;
    try {
      await deleteApiKey(keyId);
      setApiKeys(apiKeys.filter((k) => k._id !== keyId));
      setSuccess("API key deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete API key");
    }
  };

  // Members
  const inviteMemberHandler = async () => {
    if (!inviteEmail.trim()) return;
    try {
      setSubmitting(true);
      await addMember({ email: inviteEmail.trim(), role: inviteRole });
      const membersRes = await getMembers();
      setMembers(membersRes.data.members || []);
      setShowInvite(false);
      setInviteEmail("");
      setSuccess("Member invited");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to invite member");
    } finally {
      setSubmitting(false);
    }
  };

  const removeMemberHandler = async (userId) => {
    if (!window.confirm("Remove this member from the workspace?")) return;
    try {
      await removeMember(userId);
      setMembers(members.filter((m) => m.userId._id !== userId));
      setSuccess("Member removed");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove member");
    }
  };

  const updateRoleHandler = async (userId, role) => {
    try {
      await updateMemberRole(userId, role);
      setMembers(
        members.map((m) => {
          if (m.userId._id === userId) return { ...m, role };
          return m;
        })
      );
      setSuccess("Role updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update role");
    }
  };

  const leaveWorkspaceHandler = async () => {
    if (!window.confirm("Are you sure you want to leave this workspace?")) return;
    try {
      await leaveWorkspace();
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to leave workspace");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(null), 2000);
  };

  // ── Branding Handlers ──
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBranding({ ...branding, logo: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const updateBrandingHandler = async () => {
    try {
      setBrandingSubmitting(true);
      await updateBranding(branding);
      setSuccess("Branding updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update branding");
    } finally {
      setBrandingSubmitting(false);
    }
  };

  // ── Schedule Handlers ──
  const createScheduleHandler = async () => {
    try {
      setSubmitting(true);
      await createSchedule(newSchedule);
      setShowScheduleForm(false);
      setNewSchedule({ repoUrl: "", frequency: "daily", time: "09:00" });
      await fetchSchedules();
      setSuccess("Schedule created");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteScheduleHandler = async (id) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      await deleteSchedule(id);
      await fetchSchedules();
      setSuccess("Schedule deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete schedule");
    }
  };

  // ── Webhook Handlers ──
  const updateWebhookHandler = async () => {
    try {
      setSubmitting(true);
      await updateWebhook({ webhookUrl, webhookSecret });
      setSuccess("Webhook updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update webhook");
    } finally {
      setSubmitting(false);
    }
  };

  const testWebhookHandler = async () => {
    try {
      setWebhookTesting(true);
      setWebhookTestResult(null);
      const res = await testWebhook();
      setWebhookTestResult({
        success: res.data.success,
        status: res.data.status,
        response: res.data.response,
      });
    } catch (err) {
      setWebhookTestResult({
        success: false,
        status: err.response?.status,
        response: err.message,
      });
    } finally {
      setWebhookTesting(false);
    }
  };

  // Compact classes
  const compactClasses = compact
    ? {
        container: "px-3 py-4 sm:px-4",
        topPadding: "pt-14",
        headerMargin: "mb-4",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[10px]",
        cardPadding: "p-4",
        tabPadding: "px-3 py-2 text-[10px]",
        tableCell: "px-2 py-2 text-[10px]",
        buttonPadding: "px-3 py-1.5 text-[10px]",
        inputPadding: "px-3 py-2 text-xs",
      }
    : {
        container: "px-4 py-6 sm:px-6 lg:px-8",
        topPadding: "pt-16",
        headerMargin: "mb-6",
        heading: "text-xl sm:text-2xl",
        subHeading: "text-xs",
        cardPadding: "p-6",
        tabPadding: "px-4 py-2.5 text-sm",
        tableCell: "px-3 py-3 text-xs",
        buttonPadding: "px-4 py-2 text-xs",
        inputPadding: "px-4 py-2.5 text-sm",
      };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
          <p className="text-xs text-[var(--text-muted)]">Loading workspace settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}>
      <div className={`mx-auto w-full max-w-6xl ${compactClasses.container}`}>
        <div className="space-y-5">
          {/* Header */}
          <div className={compactClasses.headerMargin}>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Workspace Settings
              </span>
            </div>
            <h1 className={`mt-1 font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}>
              {workspace?.name || "Workspace"}
            </h1>
            <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
              Manage workspace settings, members, integrations, and API keys.
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-xs text-[var(--accent)]">
              ✅ {success}
            </div>
          )}

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-1 border-b border-[var(--border-dark)] pb-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${compactClasses.tabPadding} rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {/* ===== GENERAL ===== */}
            {activeTab === "General" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">General Settings</h2>

                <div className="mb-6">
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Workspace Name</label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                        placeholder="Enter workspace name"
                        autoFocus
                      />
                      <button
                        onClick={updateWorkspaceName}
                        disabled={submitting || !workspaceName.trim()}
                        className={`rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingName(false); setWorkspaceName(workspace?.name || ""); }}
                        className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] ${compactClasses.buttonPadding}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--text-secondary)]">{workspace?.name}</p>
                      <button
                        onClick={() => setEditingName(true)}
                        className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)] ${compactClasses.buttonPadding}`}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{members.length}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Members</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{workspace?.totalScans || 0}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Total Scans</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{apiKeys.length}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">API Keys</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{workspace?.plan || "Starter"}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Plan</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-red-500/20">
                  <h3 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h3>
                  <button
                    onClick={leaveWorkspaceHandler}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400 transition hover:bg-red-500/20"
                  >
                    Leave Workspace
                  </button>
                </div>
              </div>
            )}

            {/* ===== INTEGRATIONS ===== */}
            {activeTab === "Integrations" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Integrations</h2>
                {/* Slack */}
                <div className="mb-6 p-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-primary)]">Slack</h3>
                      <p className="text-[10px] text-[var(--text-muted)]">Send scan notifications to Slack</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrations.slack.enabled}
                        onChange={(e) => setIntegrations({ ...integrations, slack: { ...integrations.slack, enabled: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[var(--border-light)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--accent)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-[var(--accent)] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all relative" />
                    </label>
                  </div>
                  {integrations.slack.enabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Webhook URL</label>
                        <input
                          type="url"
                          value={integrations.slack.webhookUrl}
                          onChange={(e) => setIntegrations({ ...integrations, slack: { ...integrations.slack, webhookUrl: e.target.value } })}
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Channel (optional)</label>
                        <input
                          type="text"
                          value={integrations.slack.channel}
                          onChange={(e) => setIntegrations({ ...integrations, slack: { ...integrations.slack, channel: e.target.value } })}
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="#general"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Jira */}
                <div className="mb-6 p-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-primary)]">Jira</h3>
                      <p className="text-[10px] text-[var(--text-muted)]">Create tickets from scan findings</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrations.jira.enabled}
                        onChange={(e) => setIntegrations({ ...integrations, jira: { ...integrations.jira, enabled: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[var(--border-light)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--accent)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-[var(--accent)] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all relative" />
                    </label>
                  </div>
                  {integrations.jira.enabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Jira URL</label>
                        <input
                          type="url"
                          value={integrations.jira.url}
                          onChange={(e) => setIntegrations({ ...integrations, jira: { ...integrations.jira, url: e.target.value } })}
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="https://your-domain.atlassian.net"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Project Key</label>
                        <input
                          type="text"
                          value={integrations.jira.projectKey}
                          onChange={(e) => setIntegrations({ ...integrations, jira: { ...integrations.jira, projectKey: e.target.value } })}
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="PROJ"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">API Token</label>
                        <input
                          type="password"
                          value={integrations.jira.apiToken}
                          onChange={(e) => setIntegrations({ ...integrations, jira: { ...integrations.jira, apiToken: e.target.value } })}
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="ATCTT..."
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={updateIntegrationsSettings}
                  disabled={submitting}
                  className={`rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}
                >
                  {submitting ? "Saving…" : "Save Integrations"}
                </button>
              </div>
            )}

            {/* ===== API KEYS ===== */}
            {activeTab === "API Keys" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">API Keys</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">Use these keys for CI/CD integration</p>
                  </div>
                  <button
                    onClick={() => setShowNewKey(true)}
                    className={`flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] ${compactClasses.buttonPadding}`}
                  >
                    <Plus size={14} /> New Key
                  </button>
                </div>

                {newKeyValue && (
                  <div className="mb-4 p-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)]">
                    <p className="text-xs font-medium text-[var(--text-primary)]">Your new API key (copy it now):</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 rounded bg-[var(--bg-primary)] text-[var(--accent)] text-xs font-mono break-all">{newKeyValue}</code>
                      <button onClick={() => copyToClipboard(newKeyValue)} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2 py-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="mt-1 text-[9px] text-[var(--text-muted)]">This key will not be shown again. Store it securely.</p>
                  </div>
                )}

                {apiKeys.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <p className="text-sm">No API keys created yet.</p>
                  </div>
                )}

                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div key={key._id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{key.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[9px] text-[var(--text-muted)]">Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                          <span className="text-[9px] text-[var(--text-muted)]">Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyToClipboard(key.key)} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2 py-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => deleteApiKeyHandler(key._id)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-red-400 transition hover:bg-red-500/20">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {showNewKey && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 ${compact ? "p-4" : "p-6"}`}>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Create API Key</h3>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Name this key to identify it later.</p>
                      <div className="mt-4">
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Key Name</label>
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="CI/CD Pipeline"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-3 mt-4 pt-2">
                        <button onClick={createApiKeyHandler} disabled={submitting || !newKeyName.trim()} className={`flex-1 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}>
                          {submitting ? "Creating…" : "Create"}
                        </button>
                        <button onClick={() => { setShowNewKey(false); setNewKeyName(""); }} className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] ${compactClasses.buttonPadding}`}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== MEMBERS ===== */}
            {activeTab === "Members" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Members</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">{members.length} members in this workspace</p>
                  </div>
                  <button onClick={() => setShowInvite(true)} className={`flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] ${compactClasses.buttonPadding}`}>
                    <Plus size={14} /> Invite
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border-dark)]">
                        <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Name</th>
                        <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Email</th>
                        <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Role</th>
                        <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Joined</th>
                        <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => {
                        const isMe = member.userId._id === user?.id;
                        const isOwner = member.role === "owner";
                        const canEdit = !isMe || (isMe && isOwner);
                        return (
                          <tr key={member.userId._id} className="border-b border-[var(--border-dark)] last:border-none hover:bg-[var(--bg-hover)]/30">
                            <td className={`${compactClasses.tableCell} font-medium text-[var(--text-primary)]`}>{member.userId.name || member.userId.email}</td>
                            <td className={`${compactClasses.tableCell} text-[var(--text-secondary)]`}>{member.userId.email}</td>
                            <td className={`${compactClasses.tableCell}`}>
                              <select
                                value={member.role}
                                onChange={(e) => updateRoleHandler(member.userId._id, e.target.value)}
                                disabled={!canEdit || isOwner}
                                className={`rounded border border-[var(--border-light)] bg-[var(--bg-input)] px-2 py-1 text-[var(--text-secondary)] outline-none transition focus:border-[var(--accent)] disabled:opacity-60 ${compact ? "text-[9px]" : "text-[10px]"}`}
                              >
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </td>
                            <td className={`${compactClasses.tableCell} text-[var(--text-muted)] text-[9px]`}>{new Date(member.joinedAt).toLocaleDateString()}</td>
                            <td className={`${compactClasses.tableCell} text-right`}>
                              {!isMe && (
                                <button onClick={() => removeMemberHandler(member.userId._id)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] text-red-400 transition hover:bg-red-500/20">
                                  Remove
                                </button>
                              )}
                              {isMe && (
                                <button onClick={leaveWorkspaceHandler} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] text-red-400 transition hover:bg-red-500/20">
                                  Leave
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {showInvite && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 ${compact ? "p-4" : "p-6"}`}>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Invite Member</h3>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Enter the email of the user you want to invite.</p>
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Email</label>
                          <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`} placeholder="colleague@example.com" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Role</label>
                          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4 pt-2">
                        <button onClick={inviteMemberHandler} disabled={submitting || !inviteEmail.trim()} className={`flex-1 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}>
                          {submitting ? "Inviting…" : "Invite"}
                        </button>
                        <button onClick={() => { setShowInvite(false); setInviteEmail(""); }} className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] ${compactClasses.buttonPadding}`}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== BILLING ===== */}
            {activeTab === "Billing" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Billing & Subscription</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Current Plan</p>
                      <p className="text-xs text-[var(--text-muted)]">{workspace?.plan || "Starter"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{workspace?.plan === "starter" ? "Free" : "Paid"}</p>
                      <p className="text-[9px] text-[var(--text-muted)]">{workspace?.subscriptionStatus === "active" ? "✅ Active" : "❌ Inactive"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-center">
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{workspace?.scansLimit || 5}</p>
                      <p className="text-[9px] text-[var(--text-muted)]">Scans / month</p>
                    </div>
                    <div className="p-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-center">
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{workspace?.tokensLimit || 50000}</p>
                      <p className="text-[9px] text-[var(--text-muted)]">Tokens / month</p>
                    </div>
                  </div>

                  <button onClick={() => navigate("/pricing")} className="w-full rounded-lg bg-[var(--accent)] text-white font-semibold py-2.5 transition hover:bg-[var(--accent-hover)]">
                    {workspace?.plan === "starter" ? "Upgrade Plan" : "Change Plan"}
                  </button>
                </div>
              </div>
            )}

            {/* ===== AUDIT LOG ===== */}
            {activeTab === "Audit Log" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Audit Log</h2>
                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <p className="text-sm">No audit logs available yet.</p>
                  </div>
                )}
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)]">
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`inline-block px-2 py-0.5 text-[9px] rounded ${log.action === "scan" ? "bg-blue-500/10 text-blue-400" : log.action === "invite" ? "bg-green-500/10 text-green-400" : log.action === "delete" ? "bg-red-500/10 text-red-400" : "bg-[var(--border-light)] text-[var(--text-muted)]"}`}>
                          {log.action}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-secondary)]">{log.message}</p>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{log.user?.name || "Unknown"} • {new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== REPOSITORIES ===== */}
            {activeTab === "Repositories" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Repositories</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">All repositories scanned in this workspace</p>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">{repositories.length} repos</span>
                </div>

                {reposLoading ? (
                  <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" /></div>
                ) : repositories.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <p className="text-sm">No repositories scanned yet.</p>
                    <p className="text-[10px] mt-1">Scan a repository from the dashboard to see it here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-dark)]">
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Repository</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Last Scan</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Grade</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Score</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Scans</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] text-right`}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repositories.map((repo) => {
                          const grade = repo.latestGrade || "N/A";
                          const gradeColor = { A: "text-[var(--color-success)]", B: "text-[var(--color-info)]", C: "text-[var(--color-warning)]", D: "text-[var(--color-caution)]", F: "text-[var(--color-danger)]" }[grade[0]] || "text-[var(--text-muted)]";
                          return (
                            <tr key={repo.repoUrl} className="border-b border-[var(--border-dark)] last:border-none hover:bg-[var(--bg-hover)]/30">
                              <td className={`${compactClasses.tableCell} font-medium text-[var(--text-primary)]`}>
                                <span className="truncate max-w-[200px] inline-block" title={repo.repoUrl}>{repo.repoUrl.replace("https://github.com/", "")}</span>
                              </td>
                              <td className={`${compactClasses.tableCell} text-[var(--text-secondary)] text-[9px]`}>{repo.lastScannedAt ? new Date(repo.lastScannedAt).toLocaleDateString() : "Never"}</td>
                              <td className={`${compactClasses.tableCell} font-bold ${gradeColor}`}>{grade}</td>
                              <td className={`${compactClasses.tableCell} text-[var(--text-secondary)]`}>{repo.overallAvg || 0}%</td>
                              <td className={`${compactClasses.tableCell} text-[var(--text-secondary)]`}>{repo.totalScans}</td>
                              <td className={`${compactClasses.tableCell} text-right`}>
                                <button onClick={() => navigate(`/dashboard?repo=${encodeURIComponent(repo.repoUrl)}`)} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2 py-1 text-[9px] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">
                                  Scan again
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ===== ANALYTICS ===== */}
            {activeTab === "Analytics" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Usage Analytics</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">Token consumption and scan activity across your workspace</p>
                  </div>
                  {analytics?.lastUpdated && <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">Updated: {new Date(analytics.lastUpdated).toLocaleDateString()}</span>}
                </div>

                {analyticsLoading ? (
                  <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" /></div>
                ) : analytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-center">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{analytics.totalScans}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Total Scans</p>
                      </div>
                      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-center">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{analytics.totalTokens.toLocaleString()}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Total Tokens Used</p>
                      </div>
                      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-center">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{analytics.totalMembers}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Active Members</p>
                      </div>
                    </div>

                    {analytics.dailyUsage && analytics.dailyUsage.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                            <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Scans per Day (Last 30 Days)</h3>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={analytics.dailyUsage}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                <XAxis dataKey="_id" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-primary)" }} />
                                <Bar dataKey="scans" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                            <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Tokens Used per Day (Last 30 Days)</h3>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={analytics.dailyUsage}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                <XAxis dataKey="_id" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-primary)" }} />
                                <Bar dataKey="tokens" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                          <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Member Usage Breakdown</h3>
                          {analytics.members && analytics.members.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b border-[var(--border-dark)]">
                                    <th className="px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Name</th>
                                    <th className="px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Email</th>
                                    <th className="px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)] text-center">Scans</th>
                                    <th className="px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)] text-center">Tokens Used</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {analytics.members.map((member) => (
                                    <tr key={member._id} className="border-b border-[var(--border-dark)] last:border-none hover:bg-[var(--bg-hover)]/30">
                                      <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{member.name}</td>
                                      <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{member.email}</td>
                                      <td className="px-3 py-2 text-xs text-[var(--text-secondary)] text-center">{member.totalScans}</td>
                                      <td className="px-3 py-2 text-xs text-[var(--text-secondary)] text-center">{member.totalTokens.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--text-muted)]">No member data available</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-[var(--text-muted)]">
                        <p className="text-sm">No scan data available yet.</p>
                        <p className="text-[10px] mt-1">Start scanning repositories to see usage analytics.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <p className="text-sm">Failed to load analytics.</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== BRANDING ===== */}
            {activeTab === "Branding" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Custom Branding</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">Customize the look and feel of your workspace</p>
                  </div>
                  {workspace?.branding && (
                    <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">Active</span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Workspace Logo</label>
                    <div className="flex items-center gap-4">
                      {branding.logo && (
                        <div className="h-16 w-16 rounded-lg border border-[var(--border-light)] overflow-hidden">
                          <img src={branding.logo} alt="Logo preview" className="h-full w-full object-contain" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="text-xs text-[var(--text-muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--accent)] hover:file:bg-[var(--accent-soft)]/80"
                      />
                      {branding.logo && (
                        <button onClick={() => setBranding({ ...branding, logo: "" })} className="text-[9px] text-red-400 hover:text-red-300 transition">
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[9px] text-[var(--text-muted)]">Recommended: square image, PNG or JPG, max 200KB</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Brand Name</label>
                    <input
                      type="text"
                      value={branding.brandName}
                      onChange={(e) => setBranding({ ...branding, brandName: e.target.value })}
                      className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                      placeholder="CodeVerity"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border-light)] bg-transparent"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                        placeholder="#22d3ee"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border-light)] bg-transparent"
                      />
                      <input
                        type="text"
                        value={branding.secondaryColor}
                        onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                        className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                        placeholder="#0e7490"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] mt-2">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">Preview</h3>
                    <div className="flex items-center gap-3">
                      {branding.logo && (
                        <div className="h-8 w-8 rounded border border-[var(--border-light)] overflow-hidden">
                          <img src={branding.logo} alt="Preview" className="h-full w-full object-contain" />
                        </div>
                      )}
                      <span className="text-sm font-bold" style={{ color: branding.primaryColor }}>
                        {branding.brandName || "CodeVerity"}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-block px-3 py-1 rounded text-xs text-white" style={{ backgroundColor: branding.primaryColor }}>Primary</span>
                      <span className="inline-block px-3 py-1 rounded text-xs text-white" style={{ backgroundColor: branding.secondaryColor }}>Secondary</span>
                    </div>
                  </div>

                  <button
                    onClick={updateBrandingHandler}
                    disabled={brandingSubmitting}
                    className={`rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}
                  >
                    {brandingSubmitting ? "Saving…" : "Save Branding"}
                  </button>
                </div>
              </div>
            )}

            {/* ===== SCHEDULES ===== */}
            {activeTab === "Schedules" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Scheduled Scans</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">Automatically scan repositories on a schedule</p>
                  </div>
                  <button
                    onClick={() => setShowScheduleForm(true)}
                    className={`flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] ${compactClasses.buttonPadding}`}
                  >
                    <Plus size={14} /> Add Schedule
                  </button>
                </div>

                {schedulesLoading ? (
                  <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" /></div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <p className="text-sm">No scheduled scans yet.</p>
                    <p className="text-[10px] mt-1">Set up a schedule to automatically scan repositories.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-dark)]">
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Repository</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Frequency</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Time</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Last Run</th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] text-right`}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((schedule) => (
                          <tr key={schedule._id} className="border-b border-[var(--border-dark)] last:border-none hover:bg-[var(--bg-hover)]/30">
                            <td className={`${compactClasses.tableCell} font-medium text-[var(--text-primary)]`}>{schedule.repoUrl.replace("https://github.com/", "")}</td>
                            <td className={`${compactClasses.tableCell} text-[var(--text-secondary)] capitalize`}>{schedule.frequency}</td>
                            <td className={`${compactClasses.tableCell} text-[var(--text-secondary)]`}>{schedule.time}</td>
                            <td className={`${compactClasses.tableCell} text-[var(--text-secondary)] text-[9px]`}>{schedule.lastRun ? new Date(schedule.lastRun).toLocaleDateString() : "Never"}</td>
                            <td className={`${compactClasses.tableCell} text-right`}>
                              <button onClick={() => deleteScheduleHandler(schedule._id)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] text-red-400 transition hover:bg-red-500/20">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {showScheduleForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 ${compact ? "p-4" : "p-6"}`}>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Create Scheduled Scan</h3>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Set up automatic scans for a repository.</p>
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Repository URL</label>
                          <input type="text" value={newSchedule.repoUrl} onChange={(e) => setNewSchedule({ ...newSchedule, repoUrl: e.target.value })} className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`} placeholder="https://github.com/username/repo" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Frequency</label>
                          <select value={newSchedule.frequency} onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })} className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly (Monday)</option>
                            <option value="monthly">Monthly (1st)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Time (24h)</label>
                          <input type="time" value={newSchedule.time} onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })} className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`} />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4 pt-2">
                        <button onClick={createScheduleHandler} disabled={submitting || !newSchedule.repoUrl || !newSchedule.time} className={`flex-1 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}>
                          {submitting ? "Creating…" : "Create Schedule"}
                        </button>
                        <button onClick={() => { setShowScheduleForm(false); setNewSchedule({ repoUrl: "", frequency: "daily", time: "09:00" }); }} className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] ${compactClasses.buttonPadding}`}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== WEBHOOKS ===== */}
            {activeTab === "Webhooks" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Webhooks</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">Send scan completion events to external services</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Webhook URL</label>
                    <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`} placeholder="https://your-service.com/webhook" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Secret (optional)</label>
                    <input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`} placeholder="Your secret for verifying webhook requests" />
                    <p className="mt-1 text-[9px] text-[var(--text-muted)]">This secret will be sent as <code className="bg-[var(--bg-primary)] px-1 rounded">X-Webhook-Secret</code> header.</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={updateWebhookHandler} disabled={submitting} className={`rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}>
                      {submitting ? "Saving…" : "Save Webhook"}
                    </button>
                    <button onClick={testWebhookHandler} disabled={webhookTesting || !webhookUrl} className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50 ${compactClasses.buttonPadding}`}>
                      {webhookTesting ? "Testing…" : "Test Webhook"}
                    </button>
                  </div>

                  {webhookTestResult && (
                    <div className={`p-3 rounded-lg border text-xs ${webhookTestResult.success ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
                      <div className="flex items-center gap-2">
                        <span>{webhookTestResult.success ? "✅" : "❌"}</span>
                        <span>Status: {webhookTestResult.status}</span>
                      </div>
                      {webhookTestResult.response && (
                        <div className="mt-1 text-[9px] text-[var(--text-muted)] break-all">Response: {webhookTestResult.response}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== TRENDS ===== */}
            {activeTab === "Trends" && (
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Quality Trends</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">Code quality scores over the last 3 months</p>
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">{trends.length} weeks</span>
                </div>

                {trendsLoading ? (
                  <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" /></div>
                ) : trends.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <p className="text-sm">No trend data available yet.</p>
                    <p className="text-[10px] mt-1">Start scanning repositories to see quality trends.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis dataKey="period" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-primary)" }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey="codeQuality" stroke="#22d3ee" name="Code Quality" strokeWidth={2} />
                        <Line type="monotone" dataKey="security" stroke="#f472b6" name="Security" strokeWidth={2} />
                        <Line type="monotone" dataKey="performance" stroke="#fbbf24" name="Performance" strokeWidth={2} />
                        <Line type="monotone" dataKey="maintainability" stroke="#a78bfa" name="Maintainability" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {trends.length > 0 && (() => {
                        const latest = trends[trends.length - 1];
                        const first = trends[0];
                        const change = (score, key) => {
                          const latestVal = score || 0;
                          const firstVal = first[key] || 0;
                          return latestVal - firstVal;
                        };
                        const changeColor = (val) => val > 0 ? "text-green-400" : val < 0 ? "text-red-400" : "text-[var(--text-muted)]";
                        return (
                          <>
                            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                              <p className="text-xs font-medium text-[var(--text-muted)]">Code Quality</p>
                              <p className="text-xl font-bold text-[var(--text-primary)]">{latest.codeQuality || 0}%</p>
                              <p className={`text-[9px] ${changeColor(change(latest.codeQuality, 'codeQuality'))}`}>{change(latest.codeQuality, 'codeQuality') > 0 ? '↑' : '↓'} {Math.abs(change(latest.codeQuality, 'codeQuality'))}%</p>
                            </div>
                            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                              <p className="text-xs font-medium text-[var(--text-muted)]">Security</p>
                              <p className="text-xl font-bold text-[var(--text-primary)]">{latest.security || 0}%</p>
                              <p className={`text-[9px] ${changeColor(change(latest.security, 'security'))}`}>{change(latest.security, 'security') > 0 ? '↑' : '↓'} {Math.abs(change(latest.security, 'security'))}%</p>
                            </div>
                            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                              <p className="text-xs font-medium text-[var(--text-muted)]">Performance</p>
                              <p className="text-xl font-bold text-[var(--text-primary)]">{latest.performance || 0}%</p>
                              <p className={`text-[9px] ${changeColor(change(latest.performance, 'performance'))}`}>{change(latest.performance, 'performance') > 0 ? '↑' : '↓'} {Math.abs(change(latest.performance, 'performance'))}%</p>
                            </div>
                            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                              <p className="text-xs font-medium text-[var(--text-muted)]">Maintainability</p>
                              <p className="text-xl font-bold text-[var(--text-primary)]">{latest.maintainability || 0}%</p>
                              <p className={`text-[9px] ${changeColor(change(latest.maintainability, 'maintainability'))}`}>{change(latest.maintainability, 'maintainability') > 0 ? '↑' : '↓'} {Math.abs(change(latest.maintainability, 'maintainability'))}%</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}