// frontend/src/pages/WorkspaceSettings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";
import { Copy, Check, RefreshCw, Trash2, Plus } from "lucide-react";

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
} from "../api/workspace";

const TABS = ["General", "Integrations", "API Keys", "Members", "Billing", "Audit Log", "Repositories"];

export default function WorkspaceSettings() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { compact } = usePreferences();

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
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load workspace");
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
      setError(err.response?.data?.error || "Failed to load repositories");
    } finally {
      setReposLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Repositories") {
      fetchRepositories();
    }
  }, [activeTab]);

  // ── Update Workspace Name ──
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

  // ── Update Integrations ──
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

  // ── Create API Key ──
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

  // ── Delete API Key ──
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

  // ── Invite Member ──
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

  // ── Remove Member ──
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

  // ── Update Member Role ──
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

  // ── Leave Workspace ──
  const leaveWorkspaceHandler = async () => {
    if (!window.confirm("Are you sure you want to leave this workspace?")) return;
    try {
      await leaveWorkspace();
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to leave workspace");
    }
  };

  // ── Copy API Key ──
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(null), 2000);
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

                {/* Workspace Name */}
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
                        onClick={() => {
                          setEditingName(false);
                          setWorkspaceName(workspace?.name || "");
                        }}
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

                {/* Workspace Stats */}
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

                {/* Danger Zone */}
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
                        onChange={(e) =>
                          setIntegrations({
                            ...integrations,
                            slack: { ...integrations.slack, enabled: e.target.checked },
                          })
                        }
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
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              slack: { ...integrations.slack, webhookUrl: e.target.value },
                            })
                          }
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Channel (optional)</label>
                        <input
                          type="text"
                          value={integrations.slack.channel}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              slack: { ...integrations.slack, channel: e.target.value },
                            })
                          }
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
                        onChange={(e) =>
                          setIntegrations({
                            ...integrations,
                            jira: { ...integrations.jira, enabled: e.target.checked },
                          })
                        }
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
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              jira: { ...integrations.jira, url: e.target.value },
                            })
                          }
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="https://your-domain.atlassian.net"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Project Key</label>
                        <input
                          type="text"
                          value={integrations.jira.projectKey}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              jira: { ...integrations.jira, projectKey: e.target.value },
                            })
                          }
                          className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          placeholder="PROJ"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">API Token</label>
                        <input
                          type="password"
                          value={integrations.jira.apiToken}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              jira: { ...integrations.jira, apiToken: e.target.value },
                            })
                          }
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
                    <Plus size={14} />
                    New Key
                  </button>
                </div>

                {newKeyValue && (
                  <div className="mb-4 p-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)]">
                    <p className="text-xs font-medium text-[var(--text-primary)]">Your new API key (copy it now):</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 rounded bg-[var(--bg-primary)] text-[var(--accent)] text-xs font-mono break-all">
                        {newKeyValue}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newKeyValue)}
                        className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2 py-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                      >
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
                          <span className="text-[9px] text-[var(--text-muted)]">
                            Created: {new Date(key.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)]">
                            Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2 py-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => deleteApiKeyHandler(key._id)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-red-400 transition hover:bg-red-500/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* New Key Modal */}
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
                        <button
                          onClick={createApiKeyHandler}
                          disabled={submitting || !newKeyName.trim()}
                          className={`flex-1 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}
                        >
                          {submitting ? "Creating…" : "Create"}
                        </button>
                        <button
                          onClick={() => {
                            setShowNewKey(false);
                            setNewKeyName("");
                          }}
                          className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] ${compactClasses.buttonPadding}`}
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
              <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Members</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">{members.length} members in this workspace</p>
                  </div>
                  <button
                    onClick={() => setShowInvite(true)}
                    className={`flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] ${compactClasses.buttonPadding}`}
                  >
                    <Plus size={14} />
                    Invite
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
                            <td className={`${compactClasses.tableCell} font-medium text-[var(--text-primary)]`}>
                              {member.userId.name || member.userId.email}
                            </td>
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
                            <td className={`${compactClasses.tableCell} text-[var(--text-muted)] text-[9px]`}>
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </td>
                            <td className={`${compactClasses.tableCell} text-right`}>
                              {!isMe && (
                                <button
                                  onClick={() => removeMemberHandler(member.userId._id)}
                                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] text-red-400 transition hover:bg-red-500/20"
                                >
                                  Remove
                                </button>
                              )}
                              {isMe && (
                                <button
                                  onClick={leaveWorkspaceHandler}
                                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] text-red-400 transition hover:bg-red-500/20"
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

                {/* Invite Modal */}
                {showInvite && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 ${compact ? "p-4" : "p-6"}`}>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Invite Member</h3>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Enter the email of the user you want to invite.</p>
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Email</label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                            placeholder="colleague@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Role</label>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className={`w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                          >
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4 pt-2">
                        <button
                          onClick={inviteMemberHandler}
                          disabled={submitting || !inviteEmail.trim()}
                          className={`flex-1 rounded-lg bg-[var(--accent)] text-white font-semibold transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}
                        >
                          {submitting ? "Inviting…" : "Invite"}
                        </button>
                        <button
                          onClick={() => {
                            setShowInvite(false);
                            setInviteEmail("");
                          }}
                          className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] ${compactClasses.buttonPadding}`}
                        >
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
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {workspace?.plan === "starter" ? "Free" : "Paid"}
                      </p>
                      <p className="text-[9px] text-[var(--text-muted)]">
                        {workspace?.subscriptionStatus === "active" ? "✅ Active" : "❌ Inactive"}
                      </p>
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

                  <button
                    onClick={() => navigate("/pricing")}
                    className="w-full rounded-lg bg-[var(--accent)] text-white font-semibold py-2.5 transition hover:bg-[var(--accent-hover)]"
                  >
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
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] rounded ${
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
                        <p className="text-sm text-[var(--text-secondary)]">{log.message}</p>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                          {log.user?.name || "Unknown"} • {new Date(log.createdAt).toLocaleString()}
                        </p>
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
                    <p className="text-[10px] text-[var(--text-muted)]">
                      All repositories scanned in this workspace
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">
                    {repositories.length} repos
                  </span>
                </div>

                {reposLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
                  </div>
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
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>
                            Repository
                          </th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>
                            Last Scan
                          </th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>
                            Grade
                          </th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>
                            Score
                          </th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>
                            Scans
                          </th>
                          <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] text-right`}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
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
                            <tr key={repo.repoUrl} className="border-b border-[var(--border-dark)] last:border-none hover:bg-[var(--bg-hover)]/30">
                              <td className={`${compactClasses.tableCell} font-medium text-[var(--text-primary)]`}>
                                <span className="truncate max-w-[200px] inline-block" title={repo.repoUrl}>
                                  {repo.repoUrl.replace("https://github.com/", "")}
                                </span>
                              </td>
                              <td className={`${compactClasses.tableCell} text-[var(--text-secondary)] text-[9px]`}>
                                {repo.lastScannedAt ? new Date(repo.lastScannedAt).toLocaleDateString() : "Never"}
                              </td>
                              <td className={`${compactClasses.tableCell} font-bold ${gradeColor}`}>
                                {grade}
                              </td>
                              <td className={`${compactClasses.tableCell} text-[var(--text-secondary)]`}>
                                {repo.overallAvg || 0}%
                              </td>
                              <td className={`${compactClasses.tableCell} text-[var(--text-secondary)]`}>
                                {repo.totalScans}
                              </td>
                              <td className={`${compactClasses.tableCell} text-right`}>
                                <button
                                  onClick={() => navigate(`/dashboard?repo=${encodeURIComponent(repo.repoUrl)}`)}
                                  className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-2 py-1 text-[9px] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
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
          </div>
        </div>
      </div>
    </div>
  );
}