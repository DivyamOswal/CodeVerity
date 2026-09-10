// frontend/src/pages/WorkspaceSettings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";
import {
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Plus,
  Settings,
  Users,
  Key,
  CreditCard,
  List,
  BarChart3,
  Palette,
  Clock,
  Webhook,
  TrendingUp,
} from "lucide-react";
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

import InviteMemberModal from "../components/Workspace/InviteMemberModal";
import PendingInvites from "../components/Workspace/PendingInvites";
import TransferOwnership from "../components/Workspace/TransferOwnership";
import DeleteWorkspace from "../components/Workspace/DeleteWorkspace";
import MemberActivity from "../components/Workspace/MemberActivity";

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

import { useToast } from "../hooks/useToast";

// ─── Tabs ──────────────────────────────────
const TABS = [
  { id: "General", label: "General", icon: Settings },
  { id: "Integrations", label: "Integrations", icon: Webhook },
  { id: "API Keys", label: "API Keys", icon: Key },
  { id: "Members", label: "Members", icon: Users },
  { id: "Billing", label: "Billing", icon: CreditCard },
  { id: "Audit Log", label: "Audit Log", icon: List },
  { id: "Repositories", label: "Repositories", icon: BarChart3 },
  { id: "Analytics", label: "Analytics", icon: TrendingUp },
  { id: "Branding", label: "Branding", icon: Palette },
  { id: "Schedules", label: "Schedules", icon: Clock },
  { id: "Webhooks", label: "Webhooks", icon: Webhook },
  { id: "Trends", label: "Trends", icon: TrendingUp },
  { id: "Activity", label: "Activity", icon: TrendingUp },
];

export default function WorkspaceSettings() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { compact } = usePreferences();
  const { success, error: toastError } = useToast();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [branding, setBranding] = useState({
    logo: "",
    primaryColor: "#22d3ee",
    secondaryColor: "#0e7490",
    brandName: "CodeVerity",
  });
  const [brandingSubmitting, setBrandingSubmitting] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    repoUrl: "",
    frequency: "daily",
    time: "09:00",
  });

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  const [trends, setTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [editingName, setEditingName] = useState(false);

  const [integrations, setIntegrations] = useState({
    slack: { enabled: false, webhookUrl: "", channel: "" },
    jira: { enabled: false, url: "", apiToken: "", projectKey: "" },
  });

  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState(null);

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
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      setReposLoading(true);
      const res = await getRepositories();
      setRepositories(res.data.repositories || []);
    } catch (err) {
      console.error("Failed to fetch repositories", err);
      toastError(err.response?.data?.error || "Failed to load repositories");
    } finally {
      setReposLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await getWorkspaceAnalytics();
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      toastError(err.response?.data?.error || "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const res = await getSchedules();
      setSchedules(res.data.schedules || []);
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to load schedules");
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      setTrendsLoading(true);
      const res = await getQualityTrends();
      setTrends(res.data.trends || []);
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to load trends");
    } finally {
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Repositories") fetchRepositories();
    if (activeTab === "Analytics") fetchAnalytics();
    if (activeTab === "Schedules") fetchSchedules();
    if (activeTab === "Trends") fetchTrends();
  }, [activeTab]);

  const updateWorkspaceName = async () => {
    if (!workspaceName.trim()) return;
    try {
      setSubmitting(true);
      await updateWorkspace({ name: workspaceName.trim() });
      setEditingName(false);
      success("Workspace name updated");
    } catch (err) {
      toastError(err.response?.data?.error || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const updateIntegrationsSettings = async () => {
    try {
      setSubmitting(true);
      await updateIntegrations(integrations);
      success("Integrations saved");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to save integrations");
    } finally {
      setSubmitting(false);
    }
  };

  const createApiKeyHandler = async () => {
    if (!newKeyName.trim()) return;
    try {
      setSubmitting(true);
      const res = await createApiKey({ name: newKeyName.trim() });
      setApiKeys([...apiKeys, res.data.apiKey]);
      setNewKeyValue(res.data.apiKey.key);
      setNewKeyName("");
      setShowNewKey(false);
      success("API key created");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteApiKeyHandler = async (keyId) => {
    if (!window.confirm("Delete this API key? This cannot be undone.")) return;
    try {
      await deleteApiKey(keyId);
      setApiKeys(apiKeys.filter((k) => k._id !== keyId));
      success("API key deleted");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to delete API key");
    }
  };

  const removeMemberHandler = async (userId) => {
    if (!window.confirm("Remove this member from the workspace?")) return;
    try {
      await removeMember(userId);
      setMembers(members.filter((m) => m.userId._id !== userId));
      success("Member removed");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to remove member");
    }
  };

  const updateRoleHandler = async (userId, role) => {
    try {
      await updateMemberRole(userId, role);
      setMembers(
        members.map((m) => {
          if (m.userId._id === userId) return { ...m, role };
          return m;
        }),
      );
      success("Role updated");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to update role");
    }
  };

  const leaveWorkspaceHandler = async () => {
    if (!window.confirm("Are you sure you want to leave this workspace?"))
      return;
    try {
      await leaveWorkspace();
      navigate("/dashboard");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to leave workspace");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    success("Copied to clipboard");
  };

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
      success("Branding updated");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to update branding");
    } finally {
      setBrandingSubmitting(false);
    }
  };

  const createScheduleHandler = async () => {
    try {
      setSubmitting(true);
      await createSchedule(newSchedule);
      setShowScheduleForm(false);
      setNewSchedule({ repoUrl: "", frequency: "daily", time: "09:00" });
      await fetchSchedules();
      success("Schedule created");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to create schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteScheduleHandler = async (id) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      await deleteSchedule(id);
      await fetchSchedules();
      success("Schedule deleted");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to delete schedule");
    }
  };

  const updateWebhookHandler = async () => {
    try {
      setSubmitting(true);
      await updateWebhook({ webhookUrl, webhookSecret });
      success("Webhook updated");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to update webhook");
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

  const renderTabIcon = (tabId) => {
    const found = TABS.find((t) => t.id === tabId);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-4 w-4" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--border-light)] border-t-[var(--accent)]" />
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] animate-pulse">
            Loading workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] shadow-lg shadow-[var(--accent-soft-strong)]">
              <span className="text-lg font-bold text-[var(--accent-contrast)]">
                ⌘
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                {workspace?.name || "Workspace"}
              </h1>
              <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                Manage workspace settings, members, integrations, and API keys.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="mb-8 overflow-x-auto border-b border-[var(--border-dark)] pb-px">
          <div className="flex gap-1 min-w-max">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:py-2.5 sm:text-sm
                    ${
                      isActive
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  {renderTabIcon(tab.id)}
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--accent)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="space-y-6">
          {/* ===== GENERAL ===== */}
          {activeTab === "General" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                General Settings
              </h2>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)]">
                    Workspace Name
                  </label>
                  {editingName ? (
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                        autoFocus
                      />
                      <div className="flex gap-2 sm:flex-none">
                        <button
                          onClick={updateWorkspaceName}
                          disabled={submitting || !workspaceName.trim()}
                          className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50 sm:flex-none"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingName(false);
                            setWorkspaceName(workspace?.name || "");
                          }}
                          className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] sm:flex-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-3">
                      <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">
                        {workspace?.name}
                      </span>
                      <button
                        onClick={() => setEditingName(true)}
                        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  <StatCard label="Members" value={members.length} icon={Users} />
                  <StatCard label="Total Scans" value={workspace?.totalScans || 0} icon={BarChart3} />
                  <StatCard label="API Keys" value={apiKeys.length} icon={Key} />
                  <StatCard label="Plan" value={workspace?.plan || "Starter"} icon={CreditCard} />
                </div>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
                  <button
                    onClick={leaveWorkspaceHandler}
                    className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                  >
                    Leave Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== INTEGRATIONS ===== */}
          {activeTab === "Integrations" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
              <div className="mt-6 space-y-6">
                {/* Slack */}
                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                  <div className="flex items-start justify-between gap-3 sm:items-center">
                    <div className="min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)]">Slack</h3>
                      <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                        Send scan notifications to Slack
                      </p>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={integrations.slack.enabled}
                        onChange={(e) =>
                          setIntegrations({
                            ...integrations,
                            slack: { ...integrations.slack, enabled: e.target.checked },
                          })
                        }
                        className="peer sr-only"
                      />
                      <div className="h-5 w-9 rounded-full bg-[var(--border-light)] peer peer-checked:bg-[var(--accent)] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                  {integrations.slack.enabled && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)]">Webhook URL</label>
                        <input
                          type="url"
                          value={integrations.slack.webhookUrl}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              slack: { ...integrations.slack, webhookUrl: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)]">Channel (optional)</label>
                        <input
                          type="text"
                          value={integrations.slack.channel}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              slack: { ...integrations.slack, channel: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                          placeholder="#general"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Jira */}
                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                  <div className="flex items-start justify-between gap-3 sm:items-center">
                    <div className="min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)]">Jira</h3>
                      <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                        Create tickets from scan findings
                      </p>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={integrations.jira.enabled}
                        onChange={(e) =>
                          setIntegrations({
                            ...integrations,
                            jira: { ...integrations.jira, enabled: e.target.checked },
                          })
                        }
                        className="peer sr-only"
                      />
                      <div className="h-5 w-9 rounded-full bg-[var(--border-light)] peer peer-checked:bg-[var(--accent)] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                  {integrations.jira.enabled && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)]">Jira URL</label>
                        <input
                          type="url"
                          value={integrations.jira.url}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              jira: { ...integrations.jira, url: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                          placeholder="https://your-domain.atlassian.net"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)]">Project Key</label>
                        <input
                          type="text"
                          value={integrations.jira.projectKey}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              jira: { ...integrations.jira, projectKey: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                          placeholder="PROJ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)]">API Token</label>
                        <input
                          type="password"
                          value={integrations.jira.apiToken}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              jira: { ...integrations.jira, apiToken: e.target.value },
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                          placeholder="ATCTT..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={updateIntegrationsSettings}
                  disabled={submitting}
                  className="w-full rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50 sm:w-auto"
                >
                  {submitting ? "Saving…" : "Save Integrations"}
                </button>
              </div>
            </div>
          )}

          {/* ===== API KEYS ===== */}
          {activeTab === "API Keys" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">API Keys</h2>
                  <p className="text-sm text-[var(--text-muted)]">Use these keys for CI/CD integration</p>
                </div>
                <button
                  onClick={() => setShowNewKey(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
                >
                  <Plus className="h-4 w-4" /> New Key
                </button>
              </div>

              {newKeyValue && (
                <div className="mt-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Your new API key (copy it now):
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-[var(--bg-primary)] px-4 py-2 text-xs font-mono text-[var(--accent)] sm:text-sm">
                      {newKeyValue}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newKeyValue)}
                      className="shrink-0 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    This key will not be shown again. Store it securely.
                  </p>
                </div>
              )}

              {apiKeys.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] p-8 text-center sm:p-12">
                  <Key className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
                  <p className="mt-2 text-sm text-[var(--text-muted)]">No API keys created yet.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {apiKeys.map((key) => (
                    <div
                      key={key._id}
                      className="flex flex-col gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--text-primary)]">{key.name}</p>
                        <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                          <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                          <span>
                            Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-shrink-0">
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-2 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteApiKeyHandler(key._id)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showNewKey && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create API Key</h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Name this key to identify it later.
                    </p>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-[var(--text-muted)]">Key Name</label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                        placeholder="CI/CD Pipeline"
                        autoFocus
                      />
                    </div>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={createApiKeyHandler}
                        disabled={submitting || !newKeyName.trim()}
                        className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      >
                        {submitting ? "Creating…" : "Create"}
                      </button>
                      <button
                        onClick={() => {
                          setShowNewKey(false);
                          setNewKeyName("");
                        }}
                        className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
                      >
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
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Members</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {members.length} members in this workspace
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
                >
                  <Plus className="h-4 w-4" /> Invite Member
                </button>
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border-light)]">
                <table className="w-full text-left min-w-[640px]">
                  <thead className="bg-[var(--bg-hover)]">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Name
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Email
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Role
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Joined
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-dark)]">
                    {members.map((member) => {
                      const isMe = member.userId._id === user?.id;
                      const isOwner = member.role === "owner";
                      const canEdit = !isMe || (isMe && isOwner);
                      return (
                        <tr key={member.userId._id} className="hover:bg-[var(--bg-hover)]/30">
                          <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                            {member.userId.name || member.userId.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                            {member.userId.email}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={member.role}
                              onChange={(e) => updateRoleHandler(member.userId._id, e.target.value)}
                              disabled={!canEdit || isOwner}
                              className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none transition focus:border-[var(--accent)] disabled:opacity-60"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!isMe && (
                              <button
                                onClick={() => removeMemberHandler(member.userId._id)}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/20"
                              >
                                Remove
                              </button>
                            )}
                            {isMe && (
                              <button
                                onClick={leaveWorkspaceHandler}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/20"
                              >
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

              <PendingInvites />
              <TransferOwnership members={members} currentUserId={user?.id} />
              <DeleteWorkspace />
            </div>
          )}

          {/* ===== BILLING ===== */}
          {activeTab === "Billing" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Billing & Subscription
              </h2>
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Current Plan</p>
                    <p className="text-sm text-[var(--text-muted)]">{workspace?.plan || "Starter"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {workspace?.plan === "starter" ? "Free" : "Paid"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {workspace?.subscriptionStatus === "active" ? "✅ Active" : "❌ Inactive"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {workspace?.scansLimit || 5}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Scans / month</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {workspace?.tokensLimit || 50000}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Tokens / month</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
                >
                  {workspace?.plan === "starter" ? "Upgrade Plan" : "Change Plan"}
                </button>
              </div>
            </div>
          )}

          {/* ===== AUDIT LOG ===== */}
          {activeTab === "Audit Log" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Audit Log</h2>
              {auditLogs.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] p-8 text-center sm:p-12">
                  <List className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    No audit logs available yet.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-start gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 sm:p-4"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            log.action === "scan"
                              ? "bg-blue-500/10 text-blue-400"
                              : log.action === "invite"
                                ? "bg-green-500/10 text-green-400"
                                : log.action === "delete"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-[var(--border-light)] text-[var(--text-muted)]"
                          }`}
                        >
                          {log.action}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="break-words text-sm text-[var(--text-secondary)]">
                          {log.message}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {log.user?.name || "Unknown"} •{" "}
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== REPOSITORIES ===== */}
          {activeTab === "Repositories" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Repositories</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    All repositories scanned in this workspace
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--accent)]">
                  {repositories.length} repos
                </span>
              </div>

              {reposLoading ? (
                <div className="mt-6 flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
                </div>
              ) : repositories.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] p-8 text-center sm:p-12">
                  <BarChart3 className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    No repositories scanned yet.
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Scan a repository from the dashboard to see it here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border-light)]">
                  <table className="w-full text-left min-w-[640px]">
                    <thead className="bg-[var(--bg-hover)]">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Repository
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Last Scan
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Grade
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Score
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Scans
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-dark)]">
                      {repositories.map((repo) => {
                        const grade = repo.latestGrade || "N/A";
                        const gradeColor =
                          {
                            A: "text-[var(--color-success)]",
                            B: "text-[var(--color-info)]",
                            C: "text-[var(--color-warning)]",
                            D: "text-[var(--color-caution)]",
                            F: "text-[var(--color-danger)]",
                          }[grade[0]] || "text-[var(--text-muted)]";
                        return (
                          <tr key={repo.repoUrl} className="hover:bg-[var(--bg-hover)]/30">
                            <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                              <span
                                className="inline-block max-w-[200px] truncate"
                                title={repo.repoUrl}
                              >
                                {repo.repoUrl.replace("https://github.com/", "")}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--text-secondary)]">
                              {repo.lastScannedAt
                                ? new Date(repo.lastScannedAt).toLocaleDateString()
                                : "Never"}
                            </td>
                            <td className={`px-4 py-3 text-sm font-bold ${gradeColor}`}>
                              {grade}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                              {repo.overallAvg || 0}%
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                              {repo.totalScans}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              <button
                                onClick={() =>
                                  navigate(`/dashboard?repo=${encodeURIComponent(repo.repoUrl)}`)
                                }
                                className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                              >
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
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Usage Analytics</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Token consumption and scan activity across your workspace
                  </p>
                </div>
                {analytics?.lastUpdated && (
                  <span className="w-fit rounded-full bg-[var(--bg-primary)] px-3 py-1 text-xs text-[var(--text-muted)]">
                    Updated: {new Date(analytics.lastUpdated).toLocaleDateString()}
                  </span>
                )}
              </div>

              {analyticsLoading ? (
                <div className="mt-6 flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
                </div>
              ) : analytics ? (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-center">
                      <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {analytics.totalScans}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">Total Scans</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-center">
                      <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {analytics.totalTokens.toLocaleString()}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">Total Tokens Used</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4 text-center">
                      <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {analytics.totalMembers}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">Active Members</p>
                    </div>
                  </div>

                  {analytics.dailyUsage && analytics.dailyUsage.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            Scans per Day (Last 30 Days)
                          </h3>
                          <div className="mt-3 h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analytics.dailyUsage}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                <XAxis dataKey="_id" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "var(--bg-card)",
                                    borderColor: "var(--border-light)",
                                    color: "var(--text-primary)",
                                  }}
                                />
                                <Bar dataKey="scans" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            Tokens Used per Day (Last 30 Days)
                          </h3>
                          <div className="mt-3 h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analytics.dailyUsage}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                <XAxis dataKey="_id" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "var(--bg-card)",
                                    borderColor: "var(--border-light)",
                                    color: "var(--text-primary)",
                                  }}
                                />
                                <Bar dataKey="tokens" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          Member Usage Breakdown
                        </h3>
                        {analytics.members && analytics.members.length > 0 ? (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-left min-w-[560px]">
                              <thead className="bg-[var(--bg-hover)]">
                                <tr>
                                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                                    Name
                                  </th>
                                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                                    Email
                                  </th>
                                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] text-center">
                                    Scans
                                  </th>
                                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] text-center">
                                    Tokens Used
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-dark)]">
                                {analytics.members.map((member) => (
                                  <tr key={member._id} className="hover:bg-[var(--bg-hover)]/30">
                                    <td className="px-4 py-2 text-sm text-[var(--text-primary)]">
                                      {member.name}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-[var(--text-secondary)]">
                                      {member.email}
                                    </td>
                                    <td className="px-4 py-2 text-center text-sm text-[var(--text-secondary)]">
                                      {member.totalScans}
                                    </td>
                                    <td className="px-4 py-2 text-center text-sm text-[var(--text-secondary)]">
                                      {member.totalTokens.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-[var(--text-muted)]">
                            No member data available
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] p-8 text-center">
                      <TrendingUp className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        No scan data available yet.
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Start scanning repositories to see usage analytics.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] p-8 text-center">
                  <p className="text-sm text-[var(--text-muted)]">
                    Failed to load analytics.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===== BRANDING ===== */}
          {activeTab === "Branding" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Custom Branding
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Customize the look and feel of your workspace
                  </p>
                </div>
                {workspace?.branding && (
                  <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                    Active
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)]">
                    Workspace Logo
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                    {branding.logo && (
                      <div className="h-16 w-16 overflow-hidden rounded-lg border border-[var(--border-light)]">
                        <img src={branding.logo} alt="Logo preview" className="h-full w-full object-contain" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="max-w-full text-sm text-[var(--text-muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--accent)] hover:file:bg-[var(--accent-soft)]/80"
                    />
                    {branding.logo && (
                      <button
                        onClick={() => setBranding({ ...branding, logo: "" })}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Recommended: square image, PNG or JPG, max 200KB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)]">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={branding.brandName}
                    onChange={(e) => setBranding({ ...branding, brandName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    placeholder="CodeVerity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)]">
                    Primary Color
                  </label>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
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
                      className="min-w-0 flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                      placeholder="#22d3ee"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)]">
                    Secondary Color
                  </label>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
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
                      className="min-w-0 flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                      placeholder="#0e7490"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                  <h4 className="text-sm font-medium text-[var(--text-muted)]">Preview</h4>
                  <div className="mt-3 flex items-center gap-3">
                    {branding.logo && (
                      <div className="h-8 w-8 overflow-hidden rounded border border-[var(--border-light)]">
                        <img src={branding.logo} alt="Preview" className="h-full w-full object-contain" />
                      </div>
                    )}
                    <span className="text-base font-bold" style={{ color: branding.primaryColor }}>
                      {branding.brandName || "CodeVerity"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className="inline-block rounded-lg px-3 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      Primary
                    </span>
                    <span
                      className="inline-block rounded-lg px-3 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: branding.secondaryColor }}
                    >
                      Secondary
                    </span>
                  </div>
                </div>

                <button
                  onClick={updateBrandingHandler}
                  disabled={brandingSubmitting}
                  className="w-full rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50 sm:w-auto"
                >
                  {brandingSubmitting ? "Saving…" : "Save Branding"}
                </button>
              </div>
            </div>
          )}

          {/* ===== SCHEDULES ===== */}
          {activeTab === "Schedules" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Scheduled Scans
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Automatically scan repositories on a schedule
                  </p>
                </div>
                <button
                  onClick={() => setShowScheduleForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
                >
                  <Plus className="h-4 w-4" /> Add Schedule
                </button>
              </div>

              {schedulesLoading ? (
                <div className="mt-6 flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] p-8 text-center sm:p-12">
                  <Clock className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    No scheduled scans yet.
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Set up a schedule to automatically scan repositories.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border-light)]">
                  <table className="w-full text-left min-w-[640px]">
                    <thead className="bg-[var(--bg-hover)]">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Repository
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Frequency
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Time
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          Last Run
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-dark)]">
                      {schedules.map((schedule) => (
                        <tr key={schedule._id} className="hover:bg-[var(--bg-hover)]/30">
                          <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                            <span
                              className="inline-block max-w-[200px] truncate"
                              title={schedule.repoUrl}
                            >
                              {schedule.repoUrl.replace("https://github.com/", "")}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-[var(--text-secondary)]">
                            {schedule.frequency}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--text-secondary)]">
                            {schedule.time}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--text-secondary)]">
                            {schedule.lastRun
                              ? new Date(schedule.lastRun).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              onClick={() => deleteScheduleHandler(schedule._id)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
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
                  <div className="w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Create Scheduled Scan
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Set up automatic scans for a repository.
                    </p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)]">
                          Repository URL
                        </label>
                        <input
                          type="text"
                          value={newSchedule.repoUrl}
                          onChange={(e) =>
                            setNewSchedule({ ...newSchedule, repoUrl: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                          placeholder="https://github.com/username/repo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)]">
                          Frequency
                        </label>
                        <select
                          value={newSchedule.frequency}
                          onChange={(e) =>
                            setNewSchedule({ ...newSchedule, frequency: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly (Monday)</option>
                          <option value="monthly">Monthly (1st)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)]">
                          Time (24h)
                        </label>
                        <input
                          type="time"
                          value={newSchedule.time}
                          onChange={(e) =>
                            setNewSchedule({ ...newSchedule, time: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={createScheduleHandler}
                        disabled={submitting || !newSchedule.repoUrl || !newSchedule.time}
                        className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      >
                        {submitting ? "Creating…" : "Create Schedule"}
                      </button>
                      <button
                        onClick={() => {
                          setShowScheduleForm(false);
                          setNewSchedule({ repoUrl: "", frequency: "daily", time: "09:00" });
                        }}
                        className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
                      >
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
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Webhooks</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Send scan completion events to external services
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)]">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    placeholder="https://your-service.com/webhook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)]">
                    Secret (optional)
                  </label>
                  <input
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    placeholder="Your secret for verifying webhook requests"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    This secret will be sent as{" "}
                    <code className="rounded bg-[var(--bg-primary)] px-1 font-mono">
                      X-Webhook-Secret
                    </code>{" "}
                    header.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={updateWebhookHandler}
                    disabled={submitting}
                    className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Save Webhook"}
                  </button>
                  <button
                    onClick={testWebhookHandler}
                    disabled={webhookTesting || !webhookUrl}
                    className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50"
                  >
                    {webhookTesting ? "Testing…" : "Test Webhook"}
                  </button>
                </div>

                {webhookTestResult && (
                  <div
                    className={`rounded-xl border p-4 text-sm ${webhookTestResult.success ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{webhookTestResult.success ? "✅" : "❌"}</span>
                      <span>Status: {webhookTestResult.status}</span>
                    </div>
                    {webhookTestResult.response && (
                      <div className="mt-1 break-all text-xs text-[var(--text-muted)]">
                        Response: {webhookTestResult.response}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== TRENDS ===== */}
          {activeTab === "Trends" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Quality Trends
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Code quality scores over the last 3 months
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--accent)]">
                  {trends.length} weeks
                </span>
              </div>

              {trendsLoading ? (
                <div className="mt-6 flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
                </div>
              ) : trends.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] p-8 text-center sm:p-12">
                  <TrendingUp className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    No trend data available yet.
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Start scanning repositories to see quality trends.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-card)",
                            borderColor: "var(--border-light)",
                            color: "var(--text-primary)",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="codeQuality" stroke="#22d3ee" name="Code Quality" strokeWidth={2} />
                        <Line type="monotone" dataKey="security" stroke="#f472b6" name="Security" strokeWidth={2} />
                        <Line type="monotone" dataKey="performance" stroke="#fbbf24" name="Performance" strokeWidth={2} />
                        <Line type="monotone" dataKey="maintainability" stroke="#a78bfa" name="Maintainability" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    {trends.length > 0 &&
                      (() => {
                        const latest = trends[trends.length - 1];
                        const first = trends[0];
                        const change = (score, key) => {
                          const latestVal = score || 0;
                          const firstVal = first[key] || 0;
                          return latestVal - firstVal;
                        };
                        const changeColor = (val) =>
                          val > 0
                            ? "text-green-400"
                            : val < 0
                              ? "text-red-400"
                              : "text-[var(--text-muted)]";
                        return (
                          <>
                            <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                              <p className="text-xs font-medium text-[var(--text-muted)]">
                                Code Quality
                              </p>
                              <p className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                                {latest.codeQuality || 0}%
                              </p>
                              <p className={`text-xs ${changeColor(change(latest.codeQuality, "codeQuality"))}`}>
                                {change(latest.codeQuality, "codeQuality") > 0 ? "↑" : "↓"}{" "}
                                {Math.abs(change(latest.codeQuality, "codeQuality"))}%
                              </p>
                            </div>
                            <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                              <p className="text-xs font-medium text-[var(--text-muted)]">
                                Security
                              </p>
                              <p className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                                {latest.security || 0}%
                              </p>
                              <p className={`text-xs ${changeColor(change(latest.security, "security"))}`}>
                                {change(latest.security, "security") > 0 ? "↑" : "↓"}{" "}
                                {Math.abs(change(latest.security, "security"))}%
                              </p>
                            </div>
                            <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                              <p className="text-xs font-medium text-[var(--text-muted)]">
                                Performance
                              </p>
                              <p className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                                {latest.performance || 0}%
                              </p>
                              <p className={`text-xs ${changeColor(change(latest.performance, "performance"))}`}>
                                {change(latest.performance, "performance") > 0 ? "↑" : "↓"}{" "}
                                {Math.abs(change(latest.performance, "performance"))}%
                              </p>
                            </div>
                            <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center">
                              <p className="text-xs font-medium text-[var(--text-muted)]">
                                Maintainability
                              </p>
                              <p className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                                {latest.maintainability || 0}%
                              </p>
                              <p className={`text-xs ${changeColor(change(latest.maintainability, "maintainability"))}`}>
                                {change(latest.maintainability, "maintainability") > 0 ? "↑" : "↓"}{" "}
                                {Math.abs(change(latest.maintainability, "maintainability"))}%
                              </p>
                            </div>
                          </>
                        );
                      })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== ACTIVITY ===== */}
          {activeTab === "Activity" && (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Member Activity
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Recent actions by workspace members (last 30 days)
              </p>
              <div className="mt-4">
                <MemberActivity />
              </div>
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={loadWorkspaceData}
        />
      )}
    </div>
  );
}

// ─── StatCard (reusable) ──────────────────────────────────────
function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-center sm:p-4">
      <Icon className="mx-auto h-5 w-5 text-[var(--text-muted)]" />
      <p className="mt-1 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
        {value}
      </p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}