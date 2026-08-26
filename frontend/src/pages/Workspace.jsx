// frontend/src/pages/Workspace.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";
import {
  getWorkspace,
  updateWorkspace,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
  leaveWorkspace,
} from "../api/workspace";

export default function Workspace() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { compact } = usePreferences();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadWorkspace();
  }, [token]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const [workspaceRes, membersRes] = await Promise.all([
        getWorkspace(),
        getMembers(),
      ]);
      setWorkspace(workspaceRes.data.workspace);
      setMembers(membersRes.data.members || []);
      setNewName(workspaceRes.data.workspace?.name || "");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  const updateWorkspaceName = async () => {
    if (!newName.trim()) return;
    try {
      setSubmitting(true);
      const res = await updateWorkspace({ name: newName.trim() });
      setWorkspace(res.data.workspace);
      setEditingName(false);
      setSuccess("Workspace name updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setSubmitting(true);
      await addMember({ email: inviteEmail.trim(), role: inviteRole });
      const membersRes = await getMembers();
      setMembers(membersRes.data.members || []);
      setShowAddMember(false);
      setInviteEmail("");
      setInviteRole("member");
      setSuccess("Member added");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the workspace?")) return;
    try {
      await removeMember(userId);
      setMembers(members.filter(m => m.userId._id !== userId));
      setSuccess("Member removed");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove member");
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      await updateMemberRole(userId, role);
      setMembers(members.map(m => {
        if (m.userId._id === userId) {
          return { ...m, role };
        }
        return m;
      }));
      setSuccess("Role updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update role");
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!window.confirm("Are you sure you want to leave this workspace?")) return;
    try {
      await leaveWorkspace();
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to leave workspace");
    }
  };

  // Compact classes (unchanged)
  const compactClasses = compact
    ? {
        container: "px-3 py-4 sm:px-4",
        topPadding: "pt-14",
        headerMargin: "mb-4",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[10px]",
        cardPadding: "p-4",
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
        tableCell: "px-3 py-3 text-xs",
        buttonPadding: "px-4 py-2 text-xs",
        inputPadding: "px-4 py-2.5 text-sm",
      };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-light)] border-t-[var(--accent)]" />
          <p className="text-xs text-[var(--text-muted)]">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">No workspace found.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-contrast)]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}>
      <div className={`mx-auto w-full max-w-5xl ${compactClasses.container}`}>
        <div className="space-y-5">

          {/* HEADER */}
          <div className={compactClasses.headerMargin}>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Workspace
              </span>
            </div>
            <h1 className={`mt-1 font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}>
              {workspace.name}
            </h1>
            <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
              Manage your workspace members and settings
            </p>
          </div>

          {/* ERROR / SUCCESS */}
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

          {/* WORKSPACE NAME */}
          <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
            <h2 className={`font-semibold text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}>
              Workspace Name
            </h2>
            {editingName ? (
              <div className={`mt-3 flex flex-col gap-2 sm:flex-row sm:items-center ${compact ? "gap-1.5" : ""}`}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                  placeholder="Enter new workspace name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={updateWorkspaceName}
                    disabled={submitting || !newName.trim()}
                    className={`rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNewName(workspace.name); }}
                    className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${compactClasses.buttonPadding}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={`mt-3 flex items-center justify-between ${compact ? "gap-2" : "gap-4"}`}>
                <p className={`text-[var(--text-secondary)] ${compact ? "text-[10px]" : "text-sm"}`}>{workspace.name}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)] ${compactClasses.buttonPadding}`}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* MEMBERS */}
          <div className={`rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] ${compactClasses.cardPadding}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className={`font-semibold text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}>
                  Members
                </h2>
                <p className={`mt-1 text-[var(--text-muted)] ${compact ? "text-[9px]" : "text-[10px]"}`}>
                  {members.length} {members.length === 1 ? "member" : "members"}
                </p>
              </div>
              <button
                onClick={() => setShowAddMember(true)}
                className={`rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] ${compactClasses.buttonPadding}`}
              >
                + Add Member
              </button>
            </div>

            <div className={`mt-4 overflow-x-auto ${compact ? "mt-3" : ""}`}>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-dark)]">
                    <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Name</th>
                    <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Email</th>
                    <th className={`${compactClasses.tableCell} font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]`}>Role</th>
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
                            onChange={(e) => handleUpdateRole(member.userId._id, e.target.value)}
                            disabled={!canEdit || isOwner}
                            className={`rounded border border-[var(--border-light)] bg-[var(--bg-input)] px-2 py-1 text-[var(--text-secondary)] outline-none transition focus:border-[var(--accent)] disabled:opacity-60 ${compact ? "text-[9px]" : "text-[10px]"}`}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className={`${compactClasses.tableCell} text-right`}>
                          {!isMe && (
                            <button
                              onClick={() => handleRemoveMember(member.userId._id)}
                              className={`rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20 ${compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[10px]"}`}
                            >
                              Remove
                            </button>
                          )}
                          {isMe && (
                            <button
                              onClick={handleLeaveWorkspace}
                              className={`rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20 ${compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[10px]"}`}
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
          </div>

          {/* ADD MEMBER MODAL */}
          {showAddMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className={`w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 ${compact ? "p-4" : "p-6"}`}>
                <h3 className={`font-semibold text-[var(--text-primary)] ${compact ? "text-sm" : "text-base"}`}>Add Member</h3>
                <p className={`mt-1 text-[var(--text-muted)] ${compact ? "text-[10px]" : "text-xs"}`}>
                  Enter the email of an existing CodeVerity user.
                </p>
                <form onSubmit={handleAddMember} className="mt-4 space-y-4">
                  <div>
                    <label className={`block font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)] ${compact ? "text-[10px]" : ""}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className={`mt-1.5 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)] ${compact ? "text-[10px]" : ""}`}>
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className={`mt-1.5 w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${compactClasses.inputPadding}`}
                    >
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-1 rounded-lg bg-[var(--accent)] font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50 ${compactClasses.buttonPadding}`}
                    >
                      {submitting ? "Adding…" : "Add Member"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddMember(false); setInviteEmail(""); }}
                      className={`flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] ${compactClasses.buttonPadding}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
