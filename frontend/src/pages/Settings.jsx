// src/pages/Settings.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Lock,
  Palette,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Moon,
  Sun,
  Monitor,
  AlertCircle,
} from "lucide-react";

import axios from "../api/axios";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "../hooks/useToast";

import Section from "../components/Settings/Section";
import Field from "../components/Settings/Field";
import Input from "../components/Settings/Input";
import Toggle from "../components/Settings/Toggle";
import SaveButton from "../components/Settings/SaveButton";
import DangerRow from "../components/Settings/DangerRow";
import PasswordStrength from "../components/Settings/PasswordStrength";

const TABS = [
  { id: "Account", label: "Account", icon: UserIcon },
  { id: "Security", label: "Security", icon: Lock },
  { id: "Appearance", label: "Appearance", icon: Palette },
  { id: "Integrations", label: "Integrations", icon: Link2 },
  { id: "Danger Zone", label: "Danger Zone", icon: AlertTriangle, danger: true },
];

// Same class strings the old compactClasses object produced.
function sizeFor(compact) {
  return compact
    ? {
        container: "px-3 py-4 sm:px-4",
        topPadding: "pt-20",
        headerMargin: "mb-4",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[11px]",
        sidebarWidth: "md:w-36",
        sidebarButton: "px-3 py-2 text-xs",
        sectionPadding: "p-4",
        sectionGap: "space-y-3",
        avatarSize: "w-12 h-12 text-lg",
        avatarText: "text-sm",
        userEmail: "text-[11px]",
        fieldLabel: "text-xs",
        inputPadding: "px-3 py-2 text-xs",
        toggleText: "text-xs",
        toggleDesc: "text-[11px]",
        saveButton: "px-4 py-1.5 text-xs",
        dangerRowPadding: "p-3",
        dangerTitle: "text-xs",
        dangerDesc: "text-[11px]",
        dangerButton: "px-3 py-1 text-[11px]",
        footerMargin: "mt-4",
        footerText: "text-[10px]",
        themeButton: "py-2 text-xs",
      }
    : {
        container: "px-4 py-6 sm:px-6 lg:px-8",
        topPadding: "pt-24",
        headerMargin: "mb-6",
        heading: "text-xl sm:text-2xl",
        subHeading: "text-xs",
        sidebarWidth: "md:w-44",
        sidebarButton: "px-4 py-2.5 text-sm",
        sectionPadding: "p-6",
        sectionGap: "space-y-4",
        avatarSize: "w-16 h-16 text-2xl",
        avatarText: "text-sm",
        userEmail: "text-xs",
        fieldLabel: "text-sm",
        inputPadding: "px-4 py-2.5 text-sm",
        toggleText: "text-sm",
        toggleDesc: "text-xs",
        saveButton: "px-5 py-2 text-sm",
        dangerRowPadding: "p-4",
        dangerTitle: "text-sm",
        dangerDesc: "text-xs",
        dangerButton: "px-4 py-1.5 text-xs",
        footerMargin: "mt-6",
        footerText: "text-[11px]",
        themeButton: "py-2.5 text-sm",
      };
}

export default function Settings() {
  const navigate = useNavigate();
  const { isAuth, logout } = useAuth();
  const { theme, setTheme, compact, setCompact, showScores, setShowScores } =
    usePreferences();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState("Account");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/auth/me");
      if (!res || !res.data) return;

      const u = res.data.user ?? res.data;
      if (!u) {
        logout();
        navigate("/login");
        return;
      }

      setUser(u);
      setName(u.name ?? "");
      setEmail(u.email ?? "");
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
      } else if (err.response?.status !== 304) {
        toastError("Failed to load settings.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, logout]);

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
      return;
    }
    fetchUser();
  }, [isAuth, fetchUser]);

  const saveProfile = async () => {
    if (!name.trim()) {
      toastError("Name cannot be empty.");
      return;
    }
    if (!email.trim()) {
      toastError("Email cannot be empty.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toastError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put("/auth/profile", {
        name: name.trim(),
        email: email.trim(),
      });
      const updated = res.data.user ?? res.data;
      setUser(updated);
      success("Profile updated successfully.");
    } catch (err) {
      toastError(err.response?.data?.error ?? "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!oldPass || !newPass || !confPass) {
      toastError("Fill in all password fields.");
      return;
    }
    if (newPass !== confPass) {
      toastError("New passwords do not match.");
      return;
    }
    if (newPass.length < 6) {
      toastError("Password must be at least 6 characters.");
      return;
    }
    if (oldPass === newPass) {
      toastError("New password must differ from current.");
      return;
    }

    setSaving(true);
    try {
      await axios.put("/auth/password", {
        oldPassword: oldPass,
        newPassword: newPass,
      });
      setOldPass("");
      setNewPass("");
      setConfPass("");
      success("Password changed successfully.");
    } catch (err) {
      toastError(err.response?.data?.error ?? "Password change failed.");
    } finally {
      setSaving(false);
    }
  };

  const saveAppearance = () => {
    success("Preferences saved.");
  };

  const clearHistory = async () => {
    if (!window.confirm("Delete all reports? This cannot be undone.")) return;
    try {
      await axios.delete("/report/all");
      success("All reports deleted.");
    } catch (err) {
      toastError(err.response?.data?.error ?? "Failed to clear history.");
    }
  };

  const deleteAccount = async () => {
    if (
      !window.confirm(
        "This will permanently delete your account and all reports. Are you sure?"
      )
    )
      return;
    try {
      await axios.delete("/auth/account");
      logout();
      navigate("/register");
    } catch (err) {
      toastError(err.response?.data?.error ?? "Delete failed.");
    }
  };

  const connectGitHub = () => {
    const backendUrl =
      import.meta.env.VITE_API_URL || "https://codeverity.onrender.com/api";
    const base = backendUrl.replace(/\/api$/, "");
    window.location.href = `${base}/api/auth/github?returnTo=/settings`;
  };

  const disconnectGitHub = async () => {
    if (!window.confirm("Disconnect GitHub? Auto‑Fix will no longer work."))
      return;
    try {
      await axios.delete("/auth/github");
      setUser((prev) => ({ ...prev, githubAccessToken: null }));
      success("GitHub account disconnected.");
    } catch (err) {
      toastError("Failed to disconnect.");
    }
  };

  const c = sizeFor(compact);

  if (loading) {
    return <SettingsSkeleton c={c} />;
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "?");

  const profileDirty =
    name.trim() !== (user?.name ?? "") || email.trim() !== (user?.email ?? "");

  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${c.topPadding}`}
    >
      <div className={`mx-auto w-full max-w-7xl ${c.container}`}>
        <div className={compact ? "space-y-4" : "space-y-6"}>
          {/* HEADER */}
          <div className={c.headerMargin}>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-success)]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Preferences
              </span>
            </div>
            <h1
              className={`mt-1 font-bold tracking-tight text-[var(--text-primary)] ${c.heading}`}
            >
              Settings
            </h1>
            <p className={`text-[var(--text-muted)] ${c.subHeading}`}>
              Manage your account and preferences
            </p>
          </div>

          {/* LAYOUT */}
          <div className={`flex flex-col md:flex-row ${compact ? "gap-4" : "gap-6"}`}>
            {/* SIDEBAR */}
            <nav
              className={`-mx-1 flex gap-1 overflow-x-auto px-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 ${c.sidebarWidth} shrink-0`}
              aria-label="Settings tabs"
            >
              {TABS.map((t) => {
                const active = tab === t.id;
                const isDanger = !!t.danger;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border text-left font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] ${c.sidebarButton} ${
                      active
                        ? isDanger
                          ? "border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                          : "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]"
                        : isDanger
                          ? "border-transparent text-[var(--color-danger)] hover:border-[var(--color-danger)]/20 hover:bg-[var(--color-danger-soft)]"
                          : "border-transparent text-[var(--text-secondary)] hover:border-[var(--accent)]/20 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {active && (
                      <span
                        className={`absolute left-0 top-1/2 hidden h-4 w-0.5 -translate-y-1/2 rounded-full md:block ${
                          isDanger
                            ? "bg-[var(--color-danger)]"
                            : "bg-[var(--accent)]"
                        }`}
                      />
                    )}
                    <Icon
                      size={compact ? 13 : 15}
                      strokeWidth={1.9}
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:scale-110"
                    />
                    {t.label}
                  </button>
                );
              })}
            </nav>

            {/* PANEL */}
            <div className={`min-w-0 flex-1 ${compact ? "space-y-4" : "space-y-5"}`}>
              {/* ACCOUNT */}
              {tab === "Account" && (
                <Section
                  title="Public Profile"
                  icon={UserIcon}
                  compact={compact}
                  padding={c.sectionPadding}
                  gap={c.sectionGap}
                >
                  <div
                    className={`flex items-center ${compact ? "mb-3 gap-3" : "mb-5 gap-4"}`}
                  >
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] font-bold text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] ${c.avatarSize}`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate font-medium text-[var(--text-primary)] ${c.avatarText}`}
                      >
                        {name || "Your Name"}
                      </p>
                      <p className={`truncate text-[var(--text-muted)] ${c.userEmail}`}>
                        {email}
                      </p>
                    </div>
                  </div>

                  <Field label="Full Name" compact={compact} labelClass={c.fieldLabel}>
                    <Input
                      value={name}
                      onChange={setName}
                      placeholder="Your full name"
                      padding={c.inputPadding}
                    />
                  </Field>

                  <Field label="Email Address" compact={compact} labelClass={c.fieldLabel}>
                    <Input
                      value={email}
                      onChange={setEmail}
                      placeholder="you@example.com"
                      type="email"
                      padding={c.inputPadding}
                    />
                  </Field>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {profileDirty && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-warning)]">
                        <AlertCircle size={12} aria-hidden="true" />
                        Unsaved changes
                      </p>
                    )}
                    <div className="sm:ml-auto">
                      <SaveButton
                        onClick={saveProfile}
                        loading={saving}
                        disabled={!profileDirty}
                        buttonClass={`${c.saveButton} w-full sm:w-auto`}
                      />
                    </div>
                  </div>
                </Section>
              )}

              {/* SECURITY */}
              {tab === "Security" && (
                <Section
                  title="Change Password"
                  icon={Lock}
                  compact={compact}
                  padding={c.sectionPadding}
                  gap={c.sectionGap}
                >
                  <Field
                    label="Current Password"
                    compact={compact}
                    labelClass={c.fieldLabel}
                  >
                    <Input
                      value={oldPass}
                      onChange={setOldPass}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      padding={c.inputPadding}
                    />
                  </Field>
                  <Field
                    label="New Password"
                    compact={compact}
                    labelClass={c.fieldLabel}
                  >
                    <Input
                      value={newPass}
                      onChange={setNewPass}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      padding={c.inputPadding}
                    />
                  </Field>
                  <Field
                    label="Confirm New Password"
                    compact={compact}
                    labelClass={c.fieldLabel}
                  >
                    <Input
                      value={confPass}
                      onChange={setConfPass}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      padding={c.inputPadding}
                    />
                    {newPass && confPass && newPass !== confPass && (
                      <p
                        role="alert"
                        className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--color-danger)]"
                      >
                        <AlertCircle size={12} aria-hidden="true" />
                        Passwords don't match
                      </p>
                    )}
                  </Field>

                  <PasswordStrength password={newPass} compact={compact} />

                  <div className="flex justify-end">
                    <SaveButton
                      onClick={changePassword}
                      loading={saving}
                      label="Update Password"
                      disabled={!oldPass || !newPass || !confPass}
                      buttonClass={`${c.saveButton} w-full sm:w-auto`}
                    />
                  </div>
                </Section>
              )}

              {/* APPEARANCE */}
              {tab === "Appearance" && (
                <Section
                  title="Display Preferences"
                  icon={Palette}
                  compact={compact}
                  padding={c.sectionPadding}
                  gap={c.sectionGap}
                >
                  <Field label="Theme" compact={compact} labelClass={c.fieldLabel}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      {[
                        { id: "dark", label: "Dark", Icon: Moon },
                        { id: "light", label: "Light", Icon: Sun },
                        { id: "system", label: "System", Icon: Monitor },
                      ].map(({ id, label, Icon }) => {
                        const active = theme === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setTheme(id)}
                            aria-pressed={active}
                            className={`group flex flex-1 items-center justify-center gap-2 rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] ${c.themeButton} ${
                              active
                                ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                                : "border-[var(--border-light)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)]/25 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            <Icon
                              size={compact ? 13 : 15}
                              strokeWidth={1.9}
                              aria-hidden="true"
                              className="transition-transform duration-200 group-hover:scale-110"
                            />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Toggle
                    label="Compact View"
                    description="Show report cards in a condensed layout"
                    value={compact}
                    onChange={setCompact}
                    textClass={c.toggleText}
                    descClass={c.toggleDesc}
                  />
                  <Toggle
                    label="Show Score Bars"
                    description="Display score progress bars on report cards"
                    value={showScores}
                    onChange={setShowScores}
                    textClass={c.toggleText}
                    descClass={c.toggleDesc}
                  />

                  <div className="flex justify-end">
                    <SaveButton
                      onClick={saveAppearance}
                      loading={false}
                      label="Save Preferences"
                      buttonClass={`${c.saveButton} w-full sm:w-auto`}
                    />
                  </div>
                </Section>
              )}

              {/* INTEGRATIONS */}
              {tab === "Integrations" && (
                <Section
                  title="GitHub Integration"
                  icon={Link2}
                  compact={compact}
                  padding={c.sectionPadding}
                  gap={c.sectionGap}
                >
                  <p
                    className={`text-[var(--text-muted)] ${compact ? "text-[11px]" : "text-xs"}`}
                  >
                    Connect your GitHub account to enable Auto‑Fix, which creates
                    PRs with AI‑generated fixes for detected issues.
                  </p>

                  {user?.hasGithubConnected ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] p-4 sm:flex-row sm:items-center">
                      <CheckCircle2
                        size={22}
                        strokeWidth={1.9}
                        aria-hidden="true"
                        className="shrink-0 text-[var(--color-success)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--text-primary)]">
                          GitHub connected
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Your account is linked. Auto‑Fix is ready to use.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={disconnectGitHub}
                        className="shrink-0 self-start rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-all duration-150 hover:border-[var(--color-danger)]/50 hover:bg-[var(--color-danger)]/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] sm:self-auto"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-primary)] p-5 text-center sm:p-6">
                      <Link2
                        size={34}
                        strokeWidth={1.6}
                        aria-hidden="true"
                        className="text-[var(--accent)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">
                          Connect GitHub
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Authorize CodeVerity to create branches and pull requests
                          on your behalf.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={connectGitHub}
                        className="w-full rounded-xl bg-[var(--accent)] px-6 py-2.5 font-semibold text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] sm:w-auto"
                      >
                        Connect GitHub Account
                      </button>
                    </div>
                  )}

                  <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] p-4">
                    <p
                      className={`font-medium text-[var(--text-primary)] ${compact ? "text-xs" : "text-sm"}`}
                    >
                      What Auto‑Fix can do
                    </p>
                    <ul
                      className={`mt-2 space-y-1 text-[var(--text-muted)] ${compact ? "text-[11px]" : "text-xs"}`}
                    >
                      <li>• Create a branch with the proposed fix</li>
                      <li>• Commit the fix to the branch</li>
                      <li>• Open a pull request for you to review</li>
                      <li>• You review and merge manually</li>
                    </ul>
                  </div>
                </Section>
              )}

              {/* DANGER ZONE */}
              {tab === "Danger Zone" && (
                <Section
                  title="Danger Zone"
                  icon={AlertTriangle}
                  danger
                  compact={compact}
                  padding={c.sectionPadding}
                  gap={c.sectionGap}
                >
                  <div className={compact ? "space-y-3" : "space-y-4"}>
                    <DangerRow
                      title="Clear Report History"
                      description="Permanently delete all your past analysis reports."
                      label="Clear History"
                      onClick={clearHistory}
                      padding={c.dangerRowPadding}
                      titleClass={c.dangerTitle}
                      descClass={c.dangerDesc}
                      buttonClass={c.dangerButton}
                    />
                    <DangerRow
                      title="Delete Account"
                      description="Permanently delete your account, reports, and all associated data."
                      label="Delete Account"
                      onClick={deleteAccount}
                      bold
                      padding={c.dangerRowPadding}
                      titleClass={c.dangerTitle}
                      descClass={c.dangerDesc}
                      buttonClass={c.dangerButton}
                    />
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div
            className={`flex items-center justify-center gap-2 py-3 text-[var(--text-muted)] ${c.footerText} ${c.footerMargin}`}
          >
            <span>CodeVerity</span>
            <span>•</span>
            <span>AI Repository Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton loading state ────────────────────────────────────
function SettingsSkeleton({ c }) {
  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${c.topPadding}`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={`mx-auto w-full max-w-7xl ${c.container}`}>
        <div className="space-y-6">
          {/* header skeleton */}
          <div className="space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--bg-hover)]" />
            <div className="h-6 w-40 animate-pulse rounded bg-[var(--bg-hover)]" />
            <div className="h-3 w-64 animate-pulse rounded bg-[var(--bg-hover)]" />
          </div>

          <div className="flex flex-col gap-6 md:flex-row">
            {/* sidebar skeleton */}
            <div className="flex gap-1 md:w-44 md:flex-col">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-9 flex-1 animate-pulse rounded-xl bg-[var(--bg-hover)] md:flex-none"
                />
              ))}
            </div>

            {/* panel skeleton */}
            <div className="flex-1 space-y-4">
              <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6">
                <div className="mb-5 flex items-center gap-4">
                  <div className="h-16 w-16 animate-pulse rounded-2xl bg-[var(--bg-hover)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-[var(--bg-hover)]" />
                    <div className="h-3 w-48 animate-pulse rounded bg-[var(--bg-hover)]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-hover)]" />
                  <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-hover)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}