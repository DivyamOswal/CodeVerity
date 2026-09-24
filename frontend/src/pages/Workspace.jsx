// frontend/src/pages/WorkspaceSettings.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";
import {
  Copy, Check, RefreshCw, Trash2, Plus, Settings, Users, Key,
  CreditCard, List, BarChart3, Palette, Clock, Webhook, TrendingUp,
  Building2, Plug, Activity, CheckCircle2, XCircle, Sparkles,
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

// ─── Tabs grouped for the sidebar nav ─────────────────────────
const TAB_GROUPS = [
  {
    label: "Workspace",
    tabs: [
      { id: "General", label: "General", icon: Settings },
      { id: "Billing", label: "Billing", icon: CreditCard },
    ],
  },
  {
    label: "Access",
    tabs: [
      { id: "Members", label: "Members", icon: Users },
      { id: "API Keys", label: "API Keys", icon: Key },
    ],
  },
  {
    label: "Connections",
    tabs: [
      { id: "Integrations", label: "Integrations", icon: Plug },
      { id: "Webhooks", label: "Webhooks", icon: Webhook },
      { id: "Schedules", label: "Schedules", icon: Clock },
    ],
  },
  {
    label: "Insights",
    tabs: [
      { id: "Repositories", label: "Repositories", icon: BarChart3 },
      { id: "Analytics", label: "Analytics", icon: BarChart3 },
      { id: "Trends", label: "Trends", icon: TrendingUp },
      { id: "Activity", label: "Activity", icon: Activity },
      { id: "Audit Log", label: "Audit Log", icon: List },
    ],
  },
  {
    label: "Customize",
    tabs: [{ id: "Branding", label: "Branding", icon: Palette }],
  },
];

const TABS = TAB_GROUPS.flatMap((g) => g.tabs);

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

  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

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

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

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
      const [wsRes, membersRes, keysRes] = await Promise.all([
        getWorkspace(),
        getMembers(),
        getApiKeys(),
      ]);
      setWorkspace(wsRes.data.workspace);
      setWorkspaceName(wsRes.data.workspace?.name || "");
      setMembers(membersRes.data.members || []);
      setApiKeys(keysRes.data.apiKeys || []);

      await fetchAuditLogs(1);

      if (wsRes.data.workspace?.settings?.integrations) {
        setIntegrations(wsRes.data.workspace.settings.integrations);
      }
      if (wsRes.data.workspace?.webhookUrl) {
        setWebhookUrl(wsRes.data.workspace.webhookUrl);
      }
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    try {
      setAuditLoading(true);
      const res = await getAuditLogs(page, 20);
      setAuditLogs(res.data.logs || []);
      setAuditPagination(res.data.pagination || null);
      setAuditPage(page);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
      toastError(err.response?.data?.error || "Failed to load audit logs");
    } finally {
      setAuditLoading(false);
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
      await updateWebhook({
        webhookUrl,
        ...(webhookSecret.trim()
          ? { webhookSecret: webhookSecret.trim() }
          : {}),
      });
      success("Webhook updated");
      setWebhookSecret("");
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

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;

    const name = (m.userId?.name || "").toLowerCase();
    const email = (m.userId?.email || "").toLowerCase();

    return name.includes(q) || email.includes(q);
  });

  if (loading) {
    return (
      <div className="ws-loading">
        <div className="ws-loading-inner">
          <div className="ws-spinner" />
          <p className="ws-loading-text">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-page">
      <div className="ws-container">
        {/* ─── Header ────────────────────────────────────────────── */}
        <header className="ws-header">
          <div className="ws-header-main">
            <div className="ws-header-icon">
              <Building2 size={22} strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="ws-header-text">
              <p className="ws-header-eyebrow">Workspace settings</p>
              <h1 className="ws-header-title">
                {workspace?.name || "Workspace"}
              </h1>
              <p className="ws-header-desc">
                Manage workspace settings, members, integrations, and API keys.
              </p>
            </div>
          </div>

          <div className="ws-header-meta">
            <span className="ws-status-pill">
              <span className="ws-status-dot" aria-hidden="true" />
              Active
            </span>
            <span className="ws-meta-sep" aria-hidden="true">·</span>
            <span className="ws-meta-item">
              {members.length} member{members.length === 1 ? "" : "s"}
            </span>
            <span className="ws-meta-sep" aria-hidden="true">·</span>
            <span className="ws-meta-item">
              {workspace?.plan || "Starter"} plan
            </span>
          </div>
        </header>

        {/* ─── Layout: sidebar + content ─────────────────────────── */}
        <div className="ws-layout">
          <nav className="ws-nav" aria-label="Workspace settings sections">
            {/* Mobile: horizontal scroll */}
            <div className="ws-nav-mobile">
              <div className="ws-nav-mobile-track">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`ws-nav-mobile-item ${isActive ? "is-active" : ""}`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop: grouped sidebar */}
            <div className="ws-nav-desktop">
              {TAB_GROUPS.map((group) => (
                <div key={group.label} className="ws-nav-group">
                  <p className="ws-nav-group-label">{group.label}</p>
                  <div className="ws-nav-group-items">
                    {group.tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`ws-nav-item ${isActive ? "is-active" : ""}`}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <Icon size={15} aria-hidden="true" />
                          <span className="ws-nav-item-label">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* ─── Content ─────────────────────────────────────────── */}
          <div className="ws-content">
            {/* ===== GENERAL ===== */}
            {activeTab === "General" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <Settings size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="ws-card-title">General settings</h2>
                    <p className="ws-card-desc">
                      Identity and status for this workspace
                    </p>
                  </div>
                </div>

                <div className="ws-card-body">
                  {/* Workspace name */}
                  <div className="ws-field">
                    <label className="ws-label">Workspace name</label>
                    {editingName ? (
                      <div className="ws-field-row">
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          className="ws-input"
                          autoFocus
                        />
                        <div className="ws-field-actions">
                          <button
                            type="button"
                            onClick={updateWorkspaceName}
                            disabled={submitting || !workspaceName.trim()}
                            className="ws-btn ws-btn-primary"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingName(false);
                              setWorkspaceName(workspace?.name || "");
                            }}
                            className="ws-btn ws-btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ws-readonly-row">
                        <span className="ws-readonly-value">
                          {workspace?.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingName(true)}
                          className="ws-btn ws-btn-ghost"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="ws-stats-grid">
                    <StatCard label="Members" value={members.length} icon={Users} />
                    <StatCard
                      label="Total scans"
                      value={workspace?.totalScans || 0}
                      icon={BarChart3}
                    />
                    <StatCard label="API keys" value={apiKeys.length} icon={Key} />
                    <StatCard
                      label="Plan"
                      value={workspace?.plan || "Starter"}
                      icon={CreditCard}
                    />
                  </div>

                  {/* Leave workspace — soft danger */}
                  <div className="ws-soft-danger">
                    <div className="ws-soft-danger-text">
                      <p className="ws-soft-danger-title">Leave this workspace</p>
                      <p className="ws-soft-danger-desc">
                        You'll lose access to all reports, scans, and members.
                        An admin can re-invite you later.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={leaveWorkspaceHandler}
                      className="ws-btn ws-btn-danger"
                    >
                      Leave workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== INTEGRATIONS ===== */}
            {activeTab === "Integrations" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <Plug size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="ws-card-title">Integrations</h2>
                    <p className="ws-card-desc">
                      Connect external services to receive scan events
                    </p>
                  </div>
                </div>

                <div className="ws-card-body">
                  {/* Slack */}
                  <div className="ws-integration-card">
                    <div className="ws-integration-head">
                      <div className="ws-integration-info">
                        <h3 className="ws-integration-name">Slack</h3>
                        <p className="ws-integration-desc">
                          Send scan notifications to Slack
                        </p>
                      </div>
                      <Toggle
                        checked={integrations.slack.enabled}
                        onChange={(checked) =>
                          setIntegrations({
                            ...integrations,
                            slack: { ...integrations.slack, enabled: checked },
                          })
                        }
                        label="Enable Slack integration"
                      />
                    </div>
                    {integrations.slack.enabled && (
                      <div className="ws-integration-fields">
                        <div className="ws-field">
                          <label className="ws-label">Webhook URL</label>
                          <input
                            type="url"
                            value={integrations.slack.webhookUrl}
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                slack: {
                                  ...integrations.slack,
                                  webhookUrl: e.target.value,
                                },
                              })
                            }
                            className="ws-input"
                            placeholder="https://hooks.slack.com/services/..."
                          />
                        </div>
                        <div className="ws-field">
                          <label className="ws-label">Channel (optional)</label>
                          <input
                            type="text"
                            value={integrations.slack.channel}
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                slack: {
                                  ...integrations.slack,
                                  channel: e.target.value,
                                },
                              })
                            }
                            className="ws-input"
                            placeholder="#general"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Jira */}
                  <div className="ws-integration-card">
                    <div className="ws-integration-head">
                      <div className="ws-integration-info">
                        <h3 className="ws-integration-name">Jira</h3>
                        <p className="ws-integration-desc">
                          Create tickets from scan findings
                        </p>
                      </div>
                      <Toggle
                        checked={integrations.jira.enabled}
                        onChange={(checked) =>
                          setIntegrations({
                            ...integrations,
                            jira: { ...integrations.jira, enabled: checked },
                          })
                        }
                        label="Enable Jira integration"
                      />
                    </div>
                    {integrations.jira.enabled && (
                      <div className="ws-integration-fields">
                        <div className="ws-field">
                          <label className="ws-label">Jira URL</label>
                          <input
                            type="url"
                            value={integrations.jira.url}
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                jira: {
                                  ...integrations.jira,
                                  url: e.target.value,
                                },
                              })
                            }
                            className="ws-input"
                            placeholder="https://your-domain.atlassian.net"
                          />
                        </div>
                        <div className="ws-field">
                          <label className="ws-label">Project key</label>
                          <input
                            type="text"
                            value={integrations.jira.projectKey}
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                jira: {
                                  ...integrations.jira,
                                  projectKey: e.target.value,
                                },
                              })
                            }
                            className="ws-input"
                            placeholder="PROJ"
                          />
                        </div>
                        <div className="ws-field">
                          <label className="ws-label">API token</label>
                          <input
                            type="password"
                            value={integrations.jira.apiToken}
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                jira: {
                                  ...integrations.jira,
                                  apiToken: e.target.value,
                                },
                              })
                            }
                            className="ws-input"
                            placeholder="ATCTT..."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ws-form-actions">
                    <button
                      type="button"
                      onClick={updateIntegrationsSettings}
                      disabled={submitting}
                      className="ws-btn ws-btn-primary"
                    >
                      {submitting ? "Saving…" : "Save integrations"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== API KEYS ===== */}
            {activeTab === "API Keys" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <Key size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="ws-card-heading-row">
                    <div>
                      <h2 className="ws-card-title">API keys</h2>
                      <p className="ws-card-desc">
                        Use these keys for CI/CD integration
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewKey(true)}
                      className="ws-btn ws-btn-primary"
                    >
                      <Plus size={14} aria-hidden="true" />
                      New key
                    </button>
                  </div>
                </div>

                <div className="ws-card-body">
                  {newKeyValue && (
                    <div className="ws-key-reveal">
                      <div className="ws-key-reveal-head">
                        <Sparkles size={13} aria-hidden="true" />
                        <span>Your new API key — copy it now</span>
                      </div>
                      <div className="ws-key-reveal-row">
                        <code className="ws-key-reveal-code">{newKeyValue}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(newKeyValue)}
                          className="ws-btn ws-btn-icon"
                          aria-label="Copy API key"
                        >
                          <Copy size={14} aria-hidden="true" />
                        </button>
                      </div>
                      <p className="ws-key-reveal-note">
                        This key will not be shown again. Store it securely.
                      </p>
                    </div>
                  )}

                  {apiKeys.length === 0 ? (
                    <div className="ws-empty">
                      <span className="ws-empty-icon">
                        <Key size={20} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                      <p className="ws-empty-title">No API keys yet</p>
                      <p className="ws-empty-desc">
                        Create a key to start integrating CodeVerity with your
                        pipeline.
                      </p>
                    </div>
                  ) : (
                    <div className="ws-list">
                      {apiKeys.map((key) => (
                        <div key={key._id} className="ws-row">
                          <div className="ws-row-main">
                            <p className="ws-row-title">{key.name}</p>
                            <div className="ws-row-meta">
                              <span>
                                Created{" "}
                                {new Date(key.createdAt).toLocaleDateString()}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>
                                Last used{" "}
                                {key.lastUsed
                                  ? new Date(key.lastUsed).toLocaleDateString()
                                  : "never"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteApiKeyHandler(key._id)}
                            className="ws-btn ws-btn-icon-danger"
                            aria-label={`Delete API key ${key.name}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showNewKey && (
                  <Modal
                    open={showNewKey}
                    onClose={() => {
                      setShowNewKey(false);
                      setNewKeyName("");
                    }}
                    title="Create API key"
                    description="Give this key a name so you can recognize it later."
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewKey(false);
                            setNewKeyName("");
                          }}
                          className="ws-btn ws-btn-secondary ws-btn-flex"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={createApiKeyHandler}
                          disabled={submitting || !newKeyName.trim()}
                          className="ws-btn ws-btn-primary ws-btn-flex"
                        >
                          {submitting ? "Creating…" : "Create key"}
                        </button>
                      </>
                    }
                  >
                    <div className="ws-field">
                      <label className="ws-label">Key name</label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="ws-input"
                        placeholder="CI/CD Pipeline"
                        autoFocus
                      />
                    </div>
                  </Modal>
                )}
              </div>
            )}

            {/* ===== MEMBERS ===== */}
            {activeTab === "Members" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <Users size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="ws-card-heading-row">
                    <div>
                      <h2 className="ws-card-title">Members</h2>
                      <p className="ws-card-desc">
                        {filteredMembers.length} of {members.length} member
                        {members.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="ws-btn ws-btn-primary"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Invite member
                    </button>
                  </div>
                </div>

                <div className="ws-card-body">
                  <div className="ws-field">
                    <input
                      type="search"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search by name or email…"
                      className="ws-input ws-input-search"
                    />
                  </div>

                  <div className="ws-table-wrap">
                    <table className="ws-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th className="ws-table-th-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((member) => {
                          const isMe = member.userId._id === user?.id;
                          const isOwner = member.role === "owner";
                          const canEdit = !isMe || (isMe && isOwner);
                          return (
                            <tr key={member.userId._id} className="ws-table-row">
                              <td className="ws-table-cell-primary">
                                {member.userId.name || member.userId.email}
                              </td>
                              <td>{member.userId.email}</td>
                              <td>
                                <select
                                  value={member.role}
                                  onChange={(e) =>
                                    updateRoleHandler(
                                      member.userId._id,
                                      e.target.value,
                                    )
                                  }
                                  disabled={!canEdit || isOwner}
                                  className="ws-select"
                                >
                                  <option value="owner">Owner</option>
                                  <option value="admin">Admin</option>
                                  <option value="member">Member</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                              </td>
                              <td className="ws-table-cell-muted">
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </td>
                              <td className="ws-table-cell-right">
                                {!isMe ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeMemberHandler(member.userId._id)
                                    }
                                    className="ws-btn ws-btn-sm ws-btn-danger-outline"
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={leaveWorkspaceHandler}
                                    className="ws-btn ws-btn-sm ws-btn-danger-outline"
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

                  <div className="ws-members-extras">
                    <PendingInvites />
                    <TransferOwnership members={members} currentUserId={user?.id} />
                    <DeleteWorkspace />
                  </div>
                </div>
              </div>
            )}

            {/* ===== BILLING ===== */}
            {activeTab === "Billing" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <CreditCard size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="ws-card-title">Billing & subscription</h2>
                    <p className="ws-card-desc">
                      Your current plan, usage limits, and renewal status
                    </p>
                  </div>
                </div>

                <div className="ws-card-body">
                  <div className="ws-plan-row">
                    <div>
                      <p className="ws-plan-label">Current plan</p>
                      <p className="ws-plan-value">
                        {workspace?.plan || "Starter"}
                      </p>
                    </div>
                    <div className="ws-plan-right">
                      <p className="ws-plan-price">
                        {workspace?.plan === "starter" ? "Free" : "Paid"}
                      </p>
                      <p className="ws-plan-status">
                        {workspace?.subscriptionStatus === "active" ? (
                          <>
                            <CheckCircle2
                              size={12}
                              strokeWidth={2.4}
                              aria-hidden="true"
                            />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle
                              size={12}
                              strokeWidth={2.4}
                              aria-hidden="true"
                            />
                            Inactive
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="ws-stats-grid ws-stats-grid-2">
                    <div className="ws-stat">
                      <p className="ws-stat-value">
                        {workspace?.scansLimit || 5}
                      </p>
                      <p className="ws-stat-label">Scans / month</p>
                    </div>
                    <div className="ws-stat">
                      <p className="ws-stat-value">
                        {workspace?.tokensLimit || 50000}
                      </p>
                      <p className="ws-stat-label">Tokens / month</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/pricing")}
                    className="ws-btn ws-btn-primary ws-btn-block"
                  >
                    {workspace?.plan === "starter"
                      ? "Upgrade plan"
                      : "Change plan"}
                  </button>
                </div>
              </div>
            )}

            {/* ===== AUDIT LOG ===== */}
            {activeTab === "Audit Log" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <List size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="ws-card-heading-row">
                    <div>
                      <h2 className="ws-card-title">Audit log</h2>
                      <p className="ws-card-desc">
                        Every action taken in this workspace
                      </p>
                    </div>
                    {auditPagination && (
                      <span className="ws-pill">
                        {auditPagination.total} entries
                      </span>
                    )}
                  </div>
                </div>

                <div className="ws-card-body">
                  {auditLoading ? (
                    <div className="ws-loading-inline">
                      <div className="ws-spinner" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="ws-empty">
                      <span className="ws-empty-icon">
                        <List size={20} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                      <p className="ws-empty-title">No audit entries</p>
                      <p className="ws-empty-desc">
                        Actions taken in this workspace will appear here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="ws-list">
                        {auditLogs.map((log) => (
                          <div key={log._id} className="ws-audit-row">
                            <span
                              className={`ws-audit-chip ${auditChipClass(log.action)}`}
                            >
                              {log.action}
                            </span>
                            <div className="ws-audit-body">
                              <p className="ws-audit-message">{log.message}</p>
                              <p className="ws-audit-meta">
                                {log.user?.name || "Unknown"} ·{" "}
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {auditPagination && auditPagination.totalPages > 1 && (
                        <div className="ws-pagination">
                          <p className="ws-pagination-label">
                            Page {auditPagination.page} of{" "}
                            {auditPagination.totalPages}
                          </p>
                          <div className="ws-pagination-actions">
                            <button
                              type="button"
                              onClick={() => fetchAuditLogs(auditPage - 1)}
                              disabled={!auditPagination.hasPrev || auditLoading}
                              className="ws-btn ws-btn-secondary ws-btn-sm"
                            >
                              ← Previous
                            </button>
                            <button
                              type="button"
                              onClick={() => fetchAuditLogs(auditPage + 1)}
                              disabled={!auditPagination.hasNext || auditLoading}
                              className="ws-btn ws-btn-secondary ws-btn-sm"
                            >
                              Next →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ===== REPOSITORIES ===== */}
            {activeTab === "Repositories" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <BarChart3 size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="ws-card-heading-row">
                    <div>
                      <h2 className="ws-card-title">Repositories</h2>
                      <p className="ws-card-desc">
                        Every repository scanned in this workspace
                      </p>
                    </div>
                    <span className="ws-pill ws-pill-accent">
                      {repositories.length} repos
                    </span>
                  </div>
                </div>

                <div className="ws-card-body">
                  {reposLoading ? (
                    <div className="ws-loading-inline">
                      <div className="ws-spinner" />
                    </div>
                  ) : repositories.length === 0 ? (
                    <div className="ws-empty">
                      <span className="ws-empty-icon">
                        <BarChart3 size={20} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                      <p className="ws-empty-title">No repos scanned yet</p>
                      <p className="ws-empty-desc">
                        Scan a repository from the dashboard to see it here.
                      </p>
                    </div>
                  ) : (
                    <div className="ws-table-wrap">
                      <table className="ws-table">
                        <thead>
                          <tr>
                            <th>Repository</th>
                            <th>Last scan</th>
                            <th>Grade</th>
                            <th>Score</th>
                            <th>Scans</th>
                            <th className="ws-table-th-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repositories.map((repo) => {
                            const grade = repo.latestGrade || "N/A";
                            const gradeColor =
                              {
                                A: "ws-grade-a",
                                B: "ws-grade-b",
                                C: "ws-grade-c",
                                D: "ws-grade-d",
                                F: "ws-grade-f",
                              }[grade[0]] || "ws-grade-none";
                            return (
                              <tr
                                key={repo.repoUrl}
                                className="ws-table-row"
                              >
                                <td className="ws-table-cell-primary">
                                  <span
                                    className="ws-truncate"
                                    title={repo.repoUrl}
                                  >
                                    {repo.repoUrl.replace(
                                      "https://github.com/",
                                      "",
                                    )}
                                  </span>
                                </td>
                                <td className="ws-table-cell-muted">
                                  {repo.lastScannedAt
                                    ? new Date(
                                        repo.lastScannedAt,
                                      ).toLocaleDateString()
                                    : "Never"}
                                </td>
                                <td>
                                  <span
                                    className={`ws-grade ${gradeColor}`}
                                  >
                                    {grade}
                                  </span>
                                </td>
                                <td>{repo.overallAvg || 0}%</td>
                                <td>{repo.totalScans}</td>
                                <td className="ws-table-cell-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/dashboard?repo=${encodeURIComponent(
                                          repo.repoUrl,
                                        )}`,
                                      )
                                    }
                                    className="ws-btn ws-btn-sm ws-btn-secondary"
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
              </div>
            )}

            {/* ===== ANALYTICS ===== */}
            {activeTab === "Analytics" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <BarChart3 size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="ws-card-heading-row">
                    <div>
                      <h2 className="ws-card-title">Usage analytics</h2>
                      <p className="ws-card-desc">
                        Token consumption and scan activity across your
                        workspace
                      </p>
                    </div>
                    {analytics?.lastUpdated && (
                      <span className="ws-pill">
                        Updated{" "}
                        {new Date(analytics.lastUpdated).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ws-card-body">
                  {analyticsLoading ? (
                    <div className="ws-loading-inline">
                      <div className="ws-spinner" />
                    </div>
                  ) : analytics ? (
                    <div className="ws-analytics">
                      <div className="ws-stats-grid ws-stats-grid-3">
                        <div className="ws-stat">
                          <p className="ws-stat-value">
                            {analytics.totalScans}
                          </p>
                          <p className="ws-stat-label">Total scans</p>
                        </div>
                        <div className="ws-stat">
                          <p className="ws-stat-value">
                            {analytics.totalTokens.toLocaleString()}
                          </p>
                          <p className="ws-stat-label">Total tokens</p>
                        </div>
                        <div className="ws-stat">
                          <p className="ws-stat-value">
                            {analytics.totalMembers}
                          </p>
                          <p className="ws-stat-label">Active members</p>
                        </div>
                      </div>

                      {analytics.dailyUsage &&
                      analytics.dailyUsage.length > 0 ? (
                        <>
                          <div className="ws-chart-grid">
                            <div className="ws-chart-card">
                              <p className="ws-chart-title">
                                Scans per day — last 30 days
                              </p>
                              <div className="ws-chart-canvas">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={analytics.dailyUsage}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="var(--border-light)"
                                    />
                                    <XAxis
                                      dataKey="_id"
                                      tick={{
                                        fontSize: 9,
                                        fill: "var(--text-muted)",
                                      }}
                                    />
                                    <YAxis
                                      tick={{
                                        fontSize: 9,
                                        fill: "var(--text-muted)",
                                      }}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "var(--bg-card)",
                                        borderColor: "var(--border-light)",
                                        color: "var(--text-primary)",
                                      }}
                                    />
                                    <Bar
                                      dataKey="scans"
                                      fill="var(--accent)"
                                      radius={[4, 4, 0, 0]}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div className="ws-chart-card">
                              <p className="ws-chart-title">
                                Tokens per day — last 30 days
                              </p>
                              <div className="ws-chart-canvas">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={analytics.dailyUsage}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="var(--border-light)"
                                    />
                                    <XAxis
                                      dataKey="_id"
                                      tick={{
                                        fontSize: 9,
                                        fill: "var(--text-muted)",
                                      }}
                                    />
                                    <YAxis
                                      tick={{
                                        fontSize: 9,
                                        fill: "var(--text-muted)",
                                      }}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "var(--bg-card)",
                                        borderColor: "var(--border-light)",
                                        color: "var(--text-primary)",
                                      }}
                                    />
                                    <Bar
                                      dataKey="tokens"
                                      fill="var(--accent-secondary)"
                                      radius={[4, 4, 0, 0]}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          <div className="ws-chart-card">
                            <p className="ws-chart-title">
                              Member usage breakdown
                            </p>
                            {analytics.members &&
                            analytics.members.length > 0 ? (
                              <div className="ws-table-wrap ws-mt-3">
                                <table className="ws-table">
                                  <thead>
                                    <tr>
                                      <th>Name</th>
                                      <th>Email</th>
                                      <th className="ws-table-th-center">
                                        Scans
                                      </th>
                                      <th className="ws-table-th-center">
                                        Tokens
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {analytics.members.map((member) => (
                                      <tr
                                        key={member._id}
                                        className="ws-table-row"
                                      >
                                        <td className="ws-table-cell-primary">
                                          {member.name}
                                        </td>
                                        <td>{member.email}</td>
                                        <td className="ws-table-cell-center">
                                          {member.totalScans}
                                        </td>
                                        <td className="ws-table-cell-center">
                                          {member.totalTokens.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="ws-muted-p">
                                No member data available.
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="ws-empty">
                          <span className="ws-empty-icon">
                            <TrendingUp
                              size={20}
                              strokeWidth={1.6}
                              aria-hidden="true"
                            />
                          </span>
                          <p className="ws-empty-title">No scan data yet</p>
                          <p className="ws-empty-desc">
                            Start scanning repositories to see usage analytics.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ws-empty">
                      <p className="ws-empty-title">
                        Failed to load analytics.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== BRANDING ===== */}
            {activeTab === "Branding" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <Palette size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="ws-card-heading-row">
                    <div>
                      <h2 className="ws-card-title">Custom branding</h2>
                      <p className="ws-card-desc">
                        Customize the look and feel of your workspace
                      </p>
                    </div>
                    {workspace?.branding && (
                      <span className="ws-pill ws-pill-success">Active</span>
                    )}
                  </div>
                </div>

                <div className="ws-card-body">
                  <div className="ws-field">
                    <label className="ws-label">Workspace logo</label>
                    <div className="ws-logo-row">
                      {branding.logo && (
                        <div className="ws-logo-preview">
                          <img
                            src={branding.logo}
                            alt="Logo preview"
                            className="ws-logo-img"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="ws-file-input"
                      />
                      {branding.logo && (
                        <button
                          type="button"
                          onClick={() =>
                            setBranding({ ...branding, logo: "" })
                          }
                          className="ws-btn ws-btn-ghost"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="ws-hint">
                      Recommended: square image, PNG or JPG, max 200KB
                    </p>
                  </div>

                  <div className="ws-field">
                    <label className="ws-label">Brand name</label>
                    <input
                      type="text"
                      value={branding.brandName}
                      onChange={(e) =>
                        setBranding({ ...branding, brandName: e.target.value })
                      }
                      className="ws-input"
                      placeholder="CodeVerity"
                    />
                  </div>

                  <div className="ws-color-field">
                    <label className="ws-label">Primary color</label>
                    <div className="ws-color-row">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            primaryColor: e.target.value,
                          })
                        }
                        className="ws-color-swatch"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            primaryColor: e.target.value,
                          })
                        }
                        className="ws-input"
                        placeholder="#22d3ee"
                      />
                    </div>
                  </div>

                  <div className="ws-color-field">
                    <label className="ws-label">Secondary color</label>
                    <div className="ws-color-row">
                      <input
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            secondaryColor: e.target.value,
                          })
                        }
                        className="ws-color-swatch"
                      />
                      <input
                        type="text"
                        value={branding.secondaryColor}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            secondaryColor: e.target.value,
                          })
                        }
                        className="ws-input"
                        placeholder="#0e7490"
                      />
                    </div>
                  </div>

                  <div className="ws-preview-card">
                    <p className="ws-preview-label">Preview</p>
                    <div className="ws-preview-row">
                      {branding.logo && (
                        <div className="ws-preview-logo">
                          <img
                            src={branding.logo}
                            alt="Preview"
                            className="ws-logo-img"
                          />
                        </div>
                      )}
                      <span
                        className="ws-preview-name"
                        style={{ color: branding.primaryColor }}
                      >
                        {branding.brandName || "CodeVerity"}
                      </span>
                    </div>
                    <div className="ws-preview-chips">
                      <span
                        className="ws-preview-chip"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                        Primary
                      </span>
                      <span
                        className="ws-preview-chip"
                        style={{ backgroundColor: branding.secondaryColor }}
                      >
                        Secondary
                      </span>
                    </div>
                  </div>

                  <div className="ws-form-actions">
                    <button
                      type="button"
                      onClick={updateBrandingHandler}
                      disabled={brandingSubmitting}
                      className="ws-btn ws-btn-primary"
                    >
                      {brandingSubmitting ? "Saving…" : "Save branding"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== SCHEDULES ===== */}
            {activeTab === "Schedules" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <Clock size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="ws-card-heading-row">
                    <div>
                      <h2 className="ws-card-title">Scheduled scans</h2>
                      <p className="ws-card-desc">
                        Automatically scan repositories on a schedule
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(true)}
                      className="ws-btn ws-btn-primary"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Add schedule
                    </button>
                  </div>
                </div>

                <div className="ws-card-body">
                  {schedulesLoading ? (
                    <div className="ws-loading-inline">
                      <div className="ws-spinner" />
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="ws-empty">
                      <span className="ws-empty-icon">
                        <Clock size={20} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                      <p className="ws-empty-title">No scheduled scans</p>
                      <p className="ws-empty-desc">
                        Set up a schedule to scan repos automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="ws-table-wrap">
                      <table className="ws-table">
                        <thead>
                          <tr>
                            <th>Repository</th>
                            <th>Frequency</th>
                            <th>Time</th>
                            <th>Last run</th>
                            <th className="ws-table-th-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedules.map((schedule) => (
                            <tr
                              key={schedule._id}
                              className="ws-table-row"
                            >
                              <td className="ws-table-cell-primary">
                                <span
                                  className="ws-truncate"
                                  title={schedule.repoUrl}
                                >
                                  {schedule.repoUrl.replace(
                                    "https://github.com/",
                                    "",
                                  )}
                                </span>
                              </td>
                              <td className="ws-table-cell-cap">
                                {schedule.frequency}
                              </td>
                              <td>{schedule.time}</td>
                              <td className="ws-table-cell-muted">
                                {schedule.lastRun
                                  ? new Date(
                                      schedule.lastRun,
                                    ).toLocaleDateString()
                                  : "Never"}
                              </td>
                              <td className="ws-table-cell-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteScheduleHandler(schedule._id)
                                  }
                                  className="ws-btn ws-btn-icon-danger"
                                  aria-label="Delete schedule"
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {showScheduleForm && (
                  <Modal
                    open={showScheduleForm}
                    onClose={() => {
                      setShowScheduleForm(false);
                      setNewSchedule({
                        repoUrl: "",
                        frequency: "daily",
                        time: "09:00",
                      });
                    }}
                    title="Create scheduled scan"
                    description="Set up automatic scans for a repository."
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowScheduleForm(false);
                            setNewSchedule({
                              repoUrl: "",
                              frequency: "daily",
                              time: "09:00",
                            });
                          }}
                          className="ws-btn ws-btn-secondary ws-btn-flex"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={createScheduleHandler}
                          disabled={
                            submitting ||
                            !newSchedule.repoUrl ||
                            !newSchedule.time
                          }
                          className="ws-btn ws-btn-primary ws-btn-flex"
                        >
                          {submitting ? "Creating…" : "Create schedule"}
                        </button>
                      </>
                    }
                  >
                    <div className="ws-form-stack">
                      <div className="ws-field">
                        <label className="ws-label">Repository URL</label>
                        <input
                          type="text"
                          value={newSchedule.repoUrl}
                          onChange={(e) =>
                            setNewSchedule({
                              ...newSchedule,
                              repoUrl: e.target.value,
                            })
                          }
                          className="ws-input"
                          placeholder="https://github.com/username/repo"
                        />
                      </div>
                      <div className="ws-field">
                        <label className="ws-label">Frequency</label>
                        <select
                          value={newSchedule.frequency}
                          onChange={(e) =>
                            setNewSchedule({
                              ...newSchedule,
                              frequency: e.target.value,
                            })
                          }
                          className="ws-input ws-select-full"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly (Monday)</option>
                          <option value="monthly">Monthly (1st)</option>
                        </select>
                      </div>
                      <div className="ws-field">
                        <label className="ws-label">Time (24h)</label>
                        <input
                          type="time"
                          value={newSchedule.time}
                          onChange={(e) =>
                            setNewSchedule({
                              ...newSchedule,
                              time: e.target.value,
                            })
                          }
                          className="ws-input"
                        />
                      </div>
                    </div>
                  </Modal>
                )}
              </div>
            )}

            {/* ===== WEBHOOKS ===== */}
            {activeTab === "Webhooks" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <Webhook size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="ws-card-title">Webhooks</h2>
                    <p className="ws-card-desc">
                      Send scan completion events to external services
                    </p>
                  </div>
                </div>

                <div className="ws-card-body">
                  <div className="ws-field">
                    <label className="ws-label">Webhook URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="ws-input"
                      placeholder="https://your-service.com/webhook"
                    />
                  </div>

                  <div className="ws-field">
                    <label className="ws-label">
                      Secret{" "}
                      {workspace?.webhookUrl
                        ? "(leave blank to keep current)"
                        : "(optional)"}
                    </label>
                    <input
                      type="password"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="ws-input"
                      placeholder="Enter a new secret to rotate"
                    />
                    <p className="ws-hint">
                      Sent as the{" "}
                      <code className="ws-code">X-Webhook-Secret</code> header on
                      every webhook. Existing secrets are never sent to the
                      browser.
                    </p>
                  </div>

                  <div className="ws-form-actions ws-form-actions-row">
                    <button
                      type="button"
                      onClick={updateWebhookHandler}
                      disabled={submitting}
                      className="ws-btn ws-btn-primary"
                    >
                      {submitting ? "Saving…" : "Save webhook"}
                    </button>
                    <button
                      type="button"
                      onClick={testWebhookHandler}
                      disabled={webhookTesting || !webhookUrl}
                      className="ws-btn ws-btn-secondary"
                    >
                      <RefreshCw
                        size={13}
                        strokeWidth={2.2}
                        aria-hidden="true"
                        className={webhookTesting ? "animate-spin" : ""}
                      />
                      {webhookTesting ? "Testing…" : "Test webhook"}
                    </button>
                  </div>

                  {webhookTestResult && (
                    <div
                      className={`ws-webhook-result ${
                        webhookTestResult.success ? "is-ok" : "is-fail"
                      }`}
                    >
                      <div className="ws-webhook-result-head">
                        {webhookTestResult.success ? (
                          <CheckCircle2 size={14} aria-hidden="true" />
                        ) : (
                          <XCircle size={14} aria-hidden="true" />
                        )}
                        <span>
                          {webhookTestResult.success
                            ? "Delivered"
                            : "Delivery failed"}{" "}
                          · status {webhookTestResult.status}
                        </span>
                      </div>
                      {webhookTestResult.response && (
                        <p className="ws-webhook-result-body">
                          {webhookTestResult.response}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== TRENDS ===== */}
            {activeTab === "Trends" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <TrendingUp size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="ws-card-heading-row">
                    <div>
                      <h2 className="ws-card-title">Quality trends</h2>
                      <p className="ws-card-desc">
                        Code quality scores over the last 3 months
                      </p>
                    </div>
                    <span className="ws-pill ws-pill-accent">
                      {trends.length} weeks
                    </span>
                  </div>
                </div>

                <div className="ws-card-body">
                  {trendsLoading ? (
                    <div className="ws-loading-inline">
                      <div className="ws-spinner" />
                    </div>
                  ) : trends.length === 0 ? (
                    <div className="ws-empty">
                      <span className="ws-empty-icon">
                        <TrendingUp
                          size={20}
                          strokeWidth={1.6}
                          aria-hidden="true"
                        />
                      </span>
                      <p className="ws-empty-title">No trend data yet</p>
                      <p className="ws-empty-desc">
                        Start scanning to see quality trends over time.
                      </p>
                    </div>
                  ) : (
                    <div className="ws-trends">
                      <div className="ws-chart-card">
                        <div className="ws-chart-canvas ws-chart-canvas-lg">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-light)"
                              />
                              <XAxis
                                dataKey="period"
                                tick={{
                                  fontSize: 10,
                                  fill: "var(--text-muted)",
                                }}
                              />
                              <YAxis
                                domain={[0, 100]}
                                tick={{
                                  fontSize: 10,
                                  fill: "var(--text-muted)",
                                }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--bg-card)",
                                  borderColor: "var(--border-light)",
                                  color: "var(--text-primary)",
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Line
                                type="monotone"
                                dataKey="codeQuality"
                                stroke="var(--accent)"
                                name="Code quality"
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="security"
                                stroke="var(--color-danger)"
                                name="Security"
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="performance"
                                stroke="var(--color-warning)"
                                name="Performance"
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="maintainability"
                                stroke="var(--accent-secondary)"
                                name="Maintainability"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="ws-stats-grid ws-stats-grid-4">
                        {(() => {
                          const latest = trends[trends.length - 1];
                          const first = trends[0];
                          const change = (score, key) =>
                            (score || 0) - (first[key] || 0);
                          const delta = (val) =>
                            val > 0 ? "is-up" : val < 0 ? "is-down" : "is-flat";
                          return (
                            <>
                              <TrendStat
                                label="Code quality"
                                value={latest.codeQuality}
                                delta={change(latest.codeQuality, "codeQuality")}
                                deltaClass={delta(
                                  change(latest.codeQuality, "codeQuality"),
                                )}
                              />
                              <TrendStat
                                label="Security"
                                value={latest.security}
                                delta={change(latest.security, "security")}
                                deltaClass={delta(
                                  change(latest.security, "security"),
                                )}
                              />
                              <TrendStat
                                label="Performance"
                                value={latest.performance}
                                delta={change(latest.performance, "performance")}
                                deltaClass={delta(
                                  change(latest.performance, "performance"),
                                )}
                              />
                              <TrendStat
                                label="Maintainability"
                                value={latest.maintainability}
                                delta={change(
                                  latest.maintainability,
                                  "maintainability",
                                )}
                                deltaClass={delta(
                                  change(
                                    latest.maintainability,
                                    "maintainability",
                                  ),
                                )}
                              />
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== ACTIVITY ===== */}
            {activeTab === "Activity" && (
              <div className="ws-card">
                <div className="ws-card-header">
                  <span className="ws-card-icon">
                    <Activity size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="ws-card-title">Member activity</h2>
                    <p className="ws-card-desc">
                      Recent actions by workspace members (last 30 days)
                    </p>
                  </div>
                </div>

                <div className="ws-card-body">
                  <MemberActivity />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={loadWorkspaceData}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: WS_STYLES }} />
    </div>
  );
}

// ─── Helper: tone for audit action chips ─────────────────────
function auditChipClass(action) {
  const a = String(action || "").toLowerCase();
  if (/(delete|remove|revoke)/.test(a)) return "tone-danger";
  if (/(scan|analyze)/.test(a)) return "tone-info";
  if (/(invite|member|role|join|accept)/.test(a)) return "tone-success";
  if (/(plan|billing|payment)/.test(a)) return "tone-accent";
  return "tone-neutral";
}

// ─── StatCard ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="ws-stat">
      <span className="ws-stat-icon">
        <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <p className="ws-stat-value">{value}</p>
      <p className="ws-stat-label">{label}</p>
    </div>
  );
}

// ─── TrendStat ────────────────────────────────────────────────
function TrendStat({ label, value, delta, deltaClass }) {
  const sign = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  return (
    <div className="ws-stat">
      <p className="ws-stat-label-top">{label}</p>
      <p className="ws-stat-value">{value || 0}%</p>
      <p className={`ws-stat-delta ${deltaClass}`}>
        {sign} {Math.abs(delta)}%
      </p>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────
function Modal({ open, onClose, title, description, children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    if (panelRef.current) panelRef.current.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ws-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="ws-modal-panel"
      >
        <div className="ws-modal-header">
          <h3 className="ws-modal-title">{title}</h3>
          {description && (
            <p className="ws-modal-desc">{description}</p>
          )}
        </div>
        <div className="ws-modal-body">{children}</div>
        {footer && <div className="ws-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <label className="ws-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="ws-toggle-input"
        aria-label={label}
      />
      <span className="ws-toggle-track" aria-hidden="true" />
      <span className="ws-toggle-thumb" aria-hidden="true" />
    </label>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const WS_STYLES = `
  /* ─── Page shell ─────────────────────────────────────────── */
  .ws-page {
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
    padding-top: 64px;
  }
  .ws-container {
    max-width: 1240px;
    margin: 0 auto;
    padding: 32px 16px 64px;
  }
  @media (min-width: 640px) {
    .ws-container { padding: 40px 24px 80px; }
  }

  /* ─── Header ─────────────────────────────────────────────── */
  .ws-header {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-dark);
  }
  @media (min-width: 640px) {
    .ws-header {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
    }
  }
  .ws-header-main {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    min-width: 0;
  }
  .ws-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--accent) 22%, transparent),
      color-mix(in srgb, var(--accent) 6%, transparent)
    );
    color: var(--accent);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent),
      0 12px 28px -12px color-mix(in srgb, var(--accent) 60%, transparent);
  }
  .ws-header-text { min-width: 0; }
  .ws-header-eyebrow {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 4px;
  }
  .ws-header-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    line-height: 1.15;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (min-width: 640px) {
    .ws-header-title { font-size: 26px; }
  }
  .ws-header-desc {
    margin-top: 4px;
    font-size: 12.5px;
    color: var(--text-secondary);
  }
  .ws-header-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    font-size: 11.5px;
    color: var(--text-muted);
  }
  .ws-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-success) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
    color: var(--color-success);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ws-status-dot {
    position: relative;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--color-success);
  }
  .ws-status-dot::after {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 999px;
    background: var(--color-success);
    opacity: 0.45;
    animation: ws-pulse 1.8s ease-out infinite;
  }
  @keyframes ws-pulse {
    0%   { transform: scale(0.8); opacity: 0.6; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  .ws-meta-sep { color: var(--border-light); }

  /* ─── Layout ─────────────────────────────────────────────── */
  .ws-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  @media (min-width: 1024px) {
    .ws-layout {
      flex-direction: row;
      align-items: flex-start;
      gap: 28px;
    }
  }
  .ws-nav {
    flex-shrink: 0;
  }
  @media (min-width: 1024px) {
    .ws-nav { width: 236px; }
  }

  /* ─── Nav: mobile ────────────────────────────────────────── */
  .ws-nav-mobile {
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .ws-nav-mobile::-webkit-scrollbar { display: none; }
  .ws-nav-mobile-track {
    display: flex;
    gap: 4px;
    min-width: max-content;
    padding-bottom: 2px;
    border-bottom: 1px solid var(--border-dark);
  }
  .ws-nav-mobile-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.15s, background-color 0.15s;
  }
  .ws-nav-mobile-item:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }
  .ws-nav-mobile-item.is-active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  @media (min-width: 1024px) {
    .ws-nav-mobile { display: none; }
  }

  /* ─── Nav: desktop ───────────────────────────────────────── */
  .ws-nav-desktop {
    display: none;
  }
  @media (min-width: 1024px) {
    .ws-nav-desktop {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid var(--border-light);
      background: var(--bg-card);
      position: sticky;
      top: 88px;
      box-shadow:
        0 1px 0 0 color-mix(in srgb, var(--accent) 6%, transparent) inset,
        0 12px 32px -24px rgba(0, 0, 0, 0.6);
    }
  }
  .ws-nav-group { display: flex; flex-direction: column; gap: 6px; }
  .ws-nav-group-label {
    padding: 0 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .ws-nav-group-items { display: flex; flex-direction: column; gap: 2px; }
  .ws-nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: color 0.15s, background-color 0.15s;
  }
  .ws-nav-item:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }
  .ws-nav-item.is-active {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .ws-nav-item.is-active::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 2px;
    height: 16px;
    border-radius: 999px;
    background: var(--accent);
    transform: translateY(-50%);
    box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 70%, transparent);
  }
  .ws-nav-item-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ─── Content ────────────────────────────────────────────── */
  .ws-content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ─── Card ───────────────────────────────────────────────── */
  .ws-card {
    border-radius: 16px;
    border: 1px solid var(--border-light);
    background: var(--bg-card);
    overflow: hidden;
    box-shadow:
      0 1px 0 0 color-mix(in srgb, var(--accent) 6%, transparent) inset,
      0 16px 40px -24px rgba(0, 0, 0, 0.5);
  }
  .ws-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--accent) 5%, transparent),
        transparent
      ),
      var(--bg-hover);
    border-bottom: 1px solid var(--border-dark);
  }
  .ws-card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 9px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent) inset;
  }
  .ws-card-heading-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
  }
  .ws-card-title {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }
  .ws-card-desc {
    margin-top: 2px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .ws-card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ─── Form fields ────────────────────────────────────────── */
  .ws-field { display: flex; flex-direction: column; gap: 6px; }
  .ws-label {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .ws-hint {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.5;
  }
  .ws-code {
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--accent);
    font-size: 10.5px;
  }
  .ws-input {
    width: 100%;
    padding: 9px 12px;
    border-radius: 9px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ws-input:hover { border-color: color-mix(in srgb, var(--accent) 30%, var(--border-light)); }
  .ws-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
  }
  .ws-input::placeholder { color: var(--text-muted); opacity: 0.75; }
  .ws-input-search { max-width: 340px; }
  .ws-select-full { appearance: none; }

  .ws-field-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  @media (min-width: 640px) {
    .ws-field-row { flex-direction: row; align-items: center; }
    .ws-field-row .ws-input { flex: 1; }
    .ws-field-actions { flex-shrink: 0; display: flex; gap: 8px; }
  }

  .ws-readonly-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 9px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
  }
  .ws-readonly-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--text-primary);
  }

  /* ─── Buttons ────────────────────────────────────────────── */
  .ws-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .ws-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .ws-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  .ws-btn-primary {
    color: var(--accent-contrast);
    background: var(--accent);
    box-shadow: 0 8px 20px -10px color-mix(in srgb, var(--accent) 70%, transparent);
  }
  .ws-btn-primary:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 12px 24px -10px color-mix(in srgb, var(--accent) 80%, transparent);
  }
  .ws-btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.98); }

  .ws-btn-secondary {
    color: var(--text-secondary);
    background: var(--bg-primary);
    border-color: var(--border-light);
  }
  .ws-btn-secondary:hover:not(:disabled) {
    color: var(--text-primary);
    background: var(--bg-hover);
    border-color: color-mix(in srgb, var(--text-primary) 20%, var(--border-light));
  }

  .ws-btn-ghost {
    color: var(--accent);
    background: transparent;
    border-color: transparent;
  }
  .ws-btn-ghost:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  .ws-btn-danger {
    color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 10%, transparent);
    border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
  }
  .ws-btn-danger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-danger) 18%, transparent);
  }
  .ws-btn-danger-outline {
    color: var(--color-danger);
    background: transparent;
    border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
  }
  .ws-btn-danger-outline:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  }

  .ws-btn-icon {
    padding: 8px;
    color: var(--text-secondary);
    background: var(--bg-primary);
    border-color: var(--border-light);
  }
  .ws-btn-icon:hover:not(:disabled) {
    color: var(--text-primary);
    background: var(--bg-hover);
  }
  .ws-btn-icon-danger {
    padding: 8px;
    color: var(--color-danger);
    background: transparent;
    border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
  }
  .ws-btn-icon-danger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  }
  .ws-btn-sm { padding: 6px 11px; font-size: 11.5px; }
  .ws-btn-block { width: 100%; }
  .ws-btn-flex { flex: 1; }

  .ws-form-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .ws-form-actions-row { flex-direction: row; }

  /* ─── Stat cards ─────────────────────────────────────────── */
  .ws-stats-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 640px) {
    .ws-stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .ws-stats-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ws-stats-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .ws-stats-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  .ws-stat {
    position: relative;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
    text-align: center;
  }
  .ws-stat-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);
  }
  .ws-stat-value {
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
    line-height: 1.1;
  }
  .ws-stat-label {
    margin-top: 3px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .ws-stat-label-top {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .ws-stat-delta {
    margin-top: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
  }
  .ws-stat-delta.is-up { color: var(--color-success); }
  .ws-stat-delta.is-down { color: var(--color-danger); }
  .ws-stat-delta.is-flat { color: var(--text-muted); }

  /* ─── Soft danger ────────────────────────────────────────── */
  .ws-soft-danger {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--color-danger) 22%, transparent);
    background: color-mix(in srgb, var(--color-danger) 5%, transparent);
  }
  @media (min-width: 640px) {
    .ws-soft-danger {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  .ws-soft-danger-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .ws-soft-danger-desc {
    margin-top: 2px;
    font-size: 11.5px;
    color: var(--text-muted);
    max-width: 480px;
  }

  /* ─── Integration cards ──────────────────────────────────── */
  .ws-integration-card {
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
  }
  .ws-integration-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .ws-integration-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .ws-integration-desc {
    margin-top: 2px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .ws-integration-fields {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ─── Toggle ─────────────────────────────────────────────── */
  .ws-toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 36px;
    height: 20px;
    flex-shrink: 0;
    cursor: pointer;
  }
  .ws-toggle-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    margin: 0;
  }
  .ws-toggle-track {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: var(--border-light);
    transition: background-color 0.2s ease;
  }
  .ws-toggle-input:checked ~ .ws-toggle-track {
    background: var(--accent);
  }
  .ws-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .ws-toggle-input:checked ~ .ws-toggle-thumb {
    transform: translateX(16px);
  }
  .ws-toggle-input:focus-visible ~ .ws-toggle-track {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
  }

  /* ─── Tables ─────────────────────────────────────────────── */
  .ws-table-wrap {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
  }
  .ws-table {
    width: 100%;
    min-width: 640px;
    text-align: left;
    border-collapse: separate;
    border-spacing: 0;
  }
  .ws-table thead {
    background: color-mix(in srgb, var(--bg-hover) 70%, transparent);
  }
  .ws-table th {
    padding: 10px 16px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
    border-bottom: 1px solid var(--border-dark);
    text-align: left;
  }
  .ws-table-th-right { text-align: right; }
  .ws-table-th-center { text-align: center; }
  .ws-table tbody tr + tr td { border-top: 1px solid var(--border-dark); }
  .ws-table-row { transition: background-color 0.15s; }
  .ws-table-row:hover { background: color-mix(in srgb, var(--accent) 4%, transparent); }
  .ws-table td {
    padding: 12px 16px;
    font-size: 13px;
    color: var(--text-secondary);
    vertical-align: middle;
  }
  .ws-table-cell-primary { color: var(--text-primary); font-weight: 500; }
  .ws-table-cell-muted { color: var(--text-muted); }
  .ws-table-cell-right { text-align: right; }
  .ws-table-cell-center { text-align: center; }
  .ws-table-cell-cap { text-transform: capitalize; }
  .ws-truncate {
    display: inline-block;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ws-select {
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: 12px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .ws-select:hover { border-color: color-mix(in srgb, var(--accent) 30%, var(--border-light)); }
  .ws-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
  }
  .ws-select:disabled { opacity: 0.55; cursor: not-allowed; }

  .ws-grade {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    padding: 2px 7px;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    font-weight: 700;
  }
  .ws-grade-a { color: var(--color-success); background: color-mix(in srgb, var(--color-success) 12%, transparent); }
  .ws-grade-b { color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
  .ws-grade-c { color: var(--color-warning); background: color-mix(in srgb, var(--color-warning) 12%, transparent); }
  .ws-grade-d { color: #fb923c; background: rgba(251, 146, 60, 0.12); }
  .ws-grade-f { color: var(--color-danger); background: color-mix(in srgb, var(--color-danger) 12%, transparent); }
  .ws-grade-none { color: var(--text-muted); background: var(--bg-hover); }

  /* ─── Lists and rows ─────────────────────────────────────── */
  .ws-list { display: flex; flex-direction: column; gap: 10px; }
  .ws-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
    transition: border-color 0.15s, background-color 0.15s;
  }
  .ws-row:hover {
    border-color: color-mix(in srgb, var(--accent) 25%, var(--border-light));
    background: color-mix(in srgb, var(--accent) 3%, var(--bg-primary));
  }
  .ws-row-main { min-width: 0; }
  .ws-row-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ws-row-meta {
    margin-top: 3px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-muted);
  }

  /* ─── Key reveal ─────────────────────────────────────────── */
  .ws-key-reveal {
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--accent) 10%, transparent),
        color-mix(in srgb, var(--accent) 3%, transparent)
      ),
      var(--bg-primary);
  }
  .ws-key-reveal-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--accent);
  }
  .ws-key-reveal-row {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ws-key-reveal-code {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 10px 14px;
    border-radius: 9px;
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: var(--accent);
  }
  .ws-key-reveal-note {
    margin-top: 8px;
    font-size: 11px;
    color: var(--text-muted);
  }

  /* ─── Empty / loading ────────────────────────────────────── */
  .ws-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 20px;
    text-align: center;
    border-radius: 12px;
    border: 1px dashed var(--border-light);
    background: var(--bg-primary);
  }
  .ws-empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);
    margin-bottom: 4px;
  }
  .ws-empty-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .ws-empty-desc {
    max-width: 340px;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.55;
  }
  .ws-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary);
  }
  .ws-loading-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .ws-spinner {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 3px solid var(--border-light);
    border-top-color: var(--accent);
    animation: ws-spin 0.8s linear infinite;
  }
  @keyframes ws-spin { to { transform: rotate(360deg); } }
  .ws-loading-text {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    animation: ws-fade 1.6s ease-in-out infinite;
  }
  @keyframes ws-fade {
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 1; }
  }
  .ws-loading-inline {
    display: flex;
    justify-content: center;
    padding: 40px 0;
  }

  /* ─── Pill ───────────────────────────────────────────────── */
  .ws-pill {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 999px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
  }
  .ws-pill-accent {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border-color: color-mix(in srgb, var(--accent) 28%, transparent);
  }
  .ws-pill-success {
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 12%, transparent);
    border-color: color-mix(in srgb, var(--color-success) 28%, transparent);
  }

  /* ─── Audit ──────────────────────────────────────────────── */
  .ws-audit-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
    transition: border-color 0.15s, background-color 0.15s;
  }
  .ws-audit-row:hover {
    border-color: color-mix(in srgb, var(--accent) 25%, var(--border-light));
    background: color-mix(in srgb, var(--accent) 3%, var(--bg-primary));
  }
  .ws-audit-chip {
    flex-shrink: 0;
    padding: 3px 8px;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.03em;
    border: 1px solid transparent;
  }
  .ws-audit-chip.tone-accent {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border-color: color-mix(in srgb, var(--accent) 28%, transparent);
  }
  .ws-audit-chip.tone-info {
    color: #60a5fa;
    background: rgba(96, 165, 250, 0.12);
    border-color: rgba(96, 165, 250, 0.28);
  }
  .ws-audit-chip.tone-success {
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 12%, transparent);
    border-color: color-mix(in srgb, var(--color-success) 28%, transparent);
  }
  .ws-audit-chip.tone-danger {
    color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    border-color: color-mix(in srgb, var(--color-danger) 28%, transparent);
  }
  .ws-audit-chip.tone-neutral {
    color: var(--text-muted);
    background: var(--bg-hover);
    border-color: var(--border-light);
  }
  .ws-audit-body { flex: 1; min-width: 0; }
  .ws-audit-message {
    font-size: 13px;
    color: var(--text-secondary);
    word-break: break-word;
  }
  .ws-audit-meta {
    margin-top: 4px;
    font-size: 11px;
    color: var(--text-muted);
  }

  /* ─── Pagination ─────────────────────────────────────────── */
  .ws-pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--border-dark);
  }
  @media (min-width: 640px) {
    .ws-pagination { flex-direction: row; }
  }
  .ws-pagination-label {
    font-size: 12px;
    color: var(--text-muted);
  }
  .ws-pagination-actions { display: flex; gap: 8px; }

  /* ─── Analytics ──────────────────────────────────────────── */
  .ws-analytics { display: flex; flex-direction: column; gap: 20px; }
  .ws-chart-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .ws-chart-grid { grid-template-columns: 1fr 1fr; }
  }
  .ws-chart-card {
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
  }
  .ws-chart-title {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
  .ws-chart-canvas { height: 200px; }
  .ws-chart-canvas-lg { height: 280px; }
  .ws-mt-3 { margin-top: 12px; }
  .ws-muted-p {
    margin-top: 12px;
    font-size: 12.5px;
    color: var(--text-muted);
  }

  /* ─── Trends ─────────────────────────────────────────────── */
  .ws-trends { display: flex; flex-direction: column; gap: 20px; }

  /* ─── Branding ───────────────────────────────────────────── */
  .ws-logo-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .ws-logo-preview {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
    flex-shrink: 0;
  }
  .ws-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .ws-file-input {
    font-size: 12px;
    color: var(--text-muted);
    max-width: 100%;
  }
  .ws-file-input::file-selector-button {
    margin-right: 8px;
    padding: 8px 14px;
    border: none;
    border-radius: 9px;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  .ws-file-input::file-selector-button:hover {
    background: color-mix(in srgb, var(--accent) 20%, transparent);
  }

  .ws-color-field { display: flex; flex-direction: column; gap: 6px; }
  .ws-color-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ws-color-swatch {
    width: 48px;
    height: 40px;
    border-radius: 9px;
    border: 1px solid var(--border-light);
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
  }
  .ws-color-row .ws-input { flex: 1; }

  .ws-preview-card {
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
  }
  .ws-preview-label {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .ws-preview-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ws-preview-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border-light);
    background: var(--bg-card);
    flex-shrink: 0;
  }
  .ws-preview-name {
    font-size: 16px;
    font-weight: 700;
  }
  .ws-preview-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .ws-preview-chip {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #ffffff;
  }

  /* ─── Plan ───────────────────────────────────────────────── */
  .ws-plan-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
  }
  .ws-plan-label {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .ws-plan-value {
    margin-top: 4px;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: capitalize;
  }
  .ws-plan-right { text-align: right; }
  .ws-plan-price {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .ws-plan-status {
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    color: var(--text-muted);
  }
  .ws-plan-status svg { color: currentColor; }

  /* ─── Webhook result ─────────────────────────────────────── */
  .ws-webhook-result {
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid;
    font-size: 12.5px;
  }
  .ws-webhook-result.is-ok {
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 8%, transparent);
    border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
  }
  .ws-webhook-result.is-fail {
    color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 8%, transparent);
    border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
  }
  .ws-webhook-result-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  .ws-webhook-result-body {
    margin-top: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--text-muted);
    word-break: break-all;
  }

  /* ─── Members extras ─────────────────────────────────────── */
  .ws-members-extras {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* ─── Modal ──────────────────────────────────────────────── */
  .ws-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: ws-fade-in 0.2s ease-out;
  }
  @keyframes ws-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .ws-modal-panel {
    width: 100%;
    max-width: 440px;
    border-radius: 16px;
    border: 1px solid var(--border-light);
    background: var(--bg-card);
    box-shadow:
      0 30px 80px -30px rgba(0, 0, 0, 0.7),
      0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent),
      0 0 60px -20px color-mix(in srgb, var(--accent) 45%, transparent);
    overflow: hidden;
    animation: ws-modal-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes ws-modal-in {
    from { opacity: 0; transform: translateY(10px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ws-modal-header {
    padding: 20px 20px 12px;
  }
  .ws-modal-title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }
  .ws-modal-desc {
    margin-top: 4px;
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }
  .ws-modal-body { padding: 0 20px 8px; }
  .ws-modal-footer {
    display: flex;
    gap: 10px;
    padding: 16px 20px 20px;
  }
  .ws-form-stack { display: flex; flex-direction: column; gap: 14px; }

  /* ─── Reduced motion ─────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .ws-status-dot::after,
    .ws-spinner,
    .ws-loading-text,
    .ws-modal-backdrop,
    .ws-modal-panel {
      animation: none;
    }
    .ws-btn:hover:not(:disabled) { transform: none; }
  }
`;