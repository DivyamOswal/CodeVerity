// frontend/src/pages/Settings.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../App";
import { usePreferences } from "../context/PreferencesContext";

const TABS = ["Account", "Security", "Appearance", "Danger Zone"];

export default function Settings() {
  const navigate = useNavigate();
  const { isAuth, logout } = useAuth();
  const { theme, setTheme, compact, setCompact, showScores, setShowScores } = usePreferences();
  const [tab, setTab] = useState("Account");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/auth/me");
      const u = res.data.user ?? res.data;
      setUser(u);
      setName(u.name ?? "");
      setEmail(u.email ?? "");
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
      } else {
        showToast("Failed to load settings.", "error");
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
  }, [isAuth, fetchUser, navigate]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const saveProfile = async () => {
    if (!name.trim()) return showToast("Name cannot be empty.", "error");
    if (!email.trim()) return showToast("Email cannot be empty.", "error");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return showToast("Enter a valid email address.", "error");

    setSaving(true);
    try {
      const res = await axios.put("/auth/profile", { name: name.trim(), email: email.trim() });
      const updated = res.data.user ?? res.data;
      setUser(updated);
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(err.response?.data?.error ?? "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!oldPass || !newPass || !confPass)
      return showToast("Fill in all password fields.", "error");
    if (newPass !== confPass)
      return showToast("New passwords do not match.", "error");
    if (newPass.length < 6)
      return showToast("Password must be at least 6 characters.", "error");
    if (oldPass === newPass)
      return showToast("New password must differ from current.", "error");

    setSaving(true);
    try {
      await axios.put("/auth/password", {
        oldPassword: oldPass,
        newPassword: newPass,
      });
      setOldPass("");
      setNewPass("");
      setConfPass("");
      showToast("Password changed successfully.");
    } catch (err) {
      showToast(err.response?.data?.error ?? "Password change failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveAppearance = () => {
    showToast("Preferences saved.");
  };

  const clearHistory = async () => {
    if (!window.confirm("Delete all reports? This cannot be undone.")) return;
    try {
      await axios.delete("/report/all");
      showToast("All reports deleted.");
    } catch (err) {
      showToast(err.response?.data?.error ?? "Failed to clear history.", "error");
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
      showToast(err.response?.data?.error ?? "Delete failed.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] pt-16">
        <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const profileDirty =
    name.trim() !== (user?.name ?? "") ||
    email.trim() !== (user?.email ?? "");

  const compactClasses = compact
    ? {
        container: "px-3 py-4 sm:px-4",
        topPadding: "pt-14",
        headerMargin: "mb-4",
        heading: "text-lg sm:text-xl",
        subHeading: "text-[10px]",
        sidebarWidth: "md:w-36",
        sidebarButton: "px-3 py-2 text-xs",
        sectionPadding: "p-4",
        sectionGap: "space-y-3",
        avatarSize: "w-12 h-12 text-lg",
        avatarText: "text-sm",
        userEmail: "text-[10px]",
        fieldLabel: "text-xs",
        inputPadding: "px-3 py-2 text-xs",
        toggleText: "text-xs",
        toggleDesc: "text-[10px]",
        saveButton: "px-4 py-1.5 text-xs",
        dangerRowPadding: "p-3",
        dangerTitle: "text-xs",
        dangerDesc: "text-[10px]",
        dangerButton: "px-3 py-1 text-[10px]",
        footerMargin: "mt-4",
        footerText: "text-[7px]",
        themeButton: "py-2 text-xs",
        toastSize: "text-xs px-4 py-2",
      }
    : {
        container: "px-4 py-6 sm:px-6 lg:px-8",
        topPadding: "pt-16",
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
        footerText: "text-[9px]",
        themeButton: "py-2.5 text-sm",
        toastSize: "text-sm px-5 py-3",
      };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] ${compactClasses.topPadding}`}>
      <div className={`mx-auto w-full max-w-7xl ${compactClasses.container}`}>
        <div className={`${compact ? "space-y-4" : "space-y-6"}`}>
          {/* HEADER */}
          <div className={compactClasses.headerMargin}>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Preferences
              </span>
            </div>
            <h1 className={`mt-1 font-bold tracking-tight text-[var(--text-primary)] ${compactClasses.heading}`}>
              Settings
            </h1>
            <p className={`text-[var(--text-muted)] ${compactClasses.subHeading}`}>
              Manage your account and preferences
            </p>
          </div>

          {/* LAYOUT */}
          <div className={`flex flex-col md:flex-row ${compact ? "gap-4" : "gap-6"}`}>
            {/* SIDEBAR */}
            <nav className={`flex md:flex-col gap-1 ${compactClasses.sidebarWidth} shrink-0`} aria-label="Settings tabs">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`${compactClasses.sidebarButton} font-medium text-left transition-all rounded-xl
                    ${tab === t
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30"
                      : t === "Danger Zone"
                      ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }`}
                  aria-current={tab === t ? "page" : undefined}
                >
                  {tabIcon(t)} {t}
                </button>
              ))}
            </nav>

            {/* PANEL */}
            <div className={`flex-1 ${compact ? "space-y-4" : "space-y-5"}`}>
              {/* ACCOUNT */}
              {tab === "Account" && (
                <Section title="Public Profile" compact={compact} padding={compactClasses.sectionPadding} gap={compactClasses.sectionGap}>
                  <div className={`flex items-center ${compact ? "gap-3 mb-3" : "gap-4 mb-5"}`}>
                    <div className={`rounded-2xl bg-[var(--accent)] flex items-center justify-center font-bold text-[var(--accent-contrast)] shadow-lg shadow-[var(--accent-soft-strong)] ${compactClasses.avatarSize}`}>
                      {initials}
                    </div>
                    <div>
                      <p className={`font-medium text-[var(--text-primary)] ${compactClasses.avatarText}`}>{name || "Your Name"}</p>
                      <p className={`text-[var(--text-muted)] ${compactClasses.userEmail}`}>{email}</p>
                    </div>
                  </div>

                  <Field label="Full Name" compact={compact} labelClass={compactClasses.fieldLabel}>
                    <Input
                      value={name}
                      onChange={setName}
                      placeholder="Your full name"
                      compact={compact}
                      padding={compactClasses.inputPadding}
                    />
                  </Field>

                  <Field label="Email Address" compact={compact} labelClass={compactClasses.fieldLabel}>
                    <Input
                      value={email}
                      onChange={setEmail}
                      placeholder="you@example.com"
                      type="email"
                      compact={compact}
                      padding={compactClasses.inputPadding}
                    />
                  </Field>

                  <div className="flex items-center justify-between">
                    {profileDirty && <p className="text-xs text-[var(--color-warning)]">Unsaved changes</p>}
                    <div className="ml-auto">
                      <SaveButton
                        onClick={saveProfile}
                        loading={saving}
                        disabled={!profileDirty}
                        compact={compact}
                        buttonClass={compactClasses.saveButton}
                      />
                    </div>
                  </div>
                </Section>
              )}

              {/* SECURITY */}
              {tab === "Security" && (
                <Section title="Change Password" compact={compact} padding={compactClasses.sectionPadding} gap={compactClasses.sectionGap}>
                  <Field label="Current Password" compact={compact} labelClass={compactClasses.fieldLabel}>
                    <Input
                      value={oldPass}
                      onChange={setOldPass}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      compact={compact}
                      padding={compactClasses.inputPadding}
                    />
                  </Field>
                  <Field label="New Password" compact={compact} labelClass={compactClasses.fieldLabel}>
                    <Input
                      value={newPass}
                      onChange={setNewPass}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      compact={compact}
                      padding={compactClasses.inputPadding}
                    />
                  </Field>
                  <Field label="Confirm New Password" compact={compact} labelClass={compactClasses.fieldLabel}>
                    <Input
                      value={confPass}
                      onChange={setConfPass}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      compact={compact}
                      padding={compactClasses.inputPadding}
                    />
                    {newPass && confPass && newPass !== confPass && (
                      <p className="text-[var(--color-danger)] text-xs mt-1" role="alert">
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
                      compact={compact}
                      buttonClass={compactClasses.saveButton}
                    />
                  </div>
                </Section>
              )}

              {/* APPEARANCE */}
              {tab === "Appearance" && (
                <Section title="Display Preferences" compact={compact} padding={compactClasses.sectionPadding} gap={compactClasses.sectionGap}>
                  <Field label="Theme" compact={compact} labelClass={compactClasses.fieldLabel}>
                    <div className="flex gap-3">
                      {["dark", "light", "system"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex-1 ${compactClasses.themeButton} capitalize border rounded-xl transition
                            ${theme === t
                              ? "bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]"
                              : "bg-[var(--bg-primary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                          {t === "dark" ? "🌙" : t === "light" ? "☀️" : "💻"} {t}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Toggle
                    label="Compact View"
                    description="Show report cards in a condensed layout"
                    value={compact}
                    onChange={setCompact}
                    compact={compact}
                    textClass={compactClasses.toggleText}
                    descClass={compactClasses.toggleDesc}
                  />
                  <Toggle
                    label="Show Score Bars"
                    description="Display score progress bars on report cards"
                    value={showScores}
                    onChange={setShowScores}
                    compact={compact}
                    textClass={compactClasses.toggleText}
                    descClass={compactClasses.toggleDesc}
                  />

                  <div className="flex justify-end">
                    <SaveButton
                      onClick={saveAppearance}
                      loading={false}
                      label="Save Preferences"
                      compact={compact}
                      buttonClass={compactClasses.saveButton}
                    />
                  </div>
                </Section>
              )}

              {/* DANGER ZONE */}
              {tab === "Danger Zone" && (
                <Section title="Danger Zone" danger compact={compact} padding={compactClasses.sectionPadding} gap={compactClasses.sectionGap}>
                  <div className={`space-y-4 ${compact ? "space-y-3" : ""}`}>
                    <DangerRow
                      title="Clear Report History"
                      description="Permanently delete all your past analysis reports."
                      label="Clear History"
                      onClick={clearHistory}
                      compact={compact}
                      padding={compactClasses.dangerRowPadding}
                      titleClass={compactClasses.dangerTitle}
                      descClass={compactClasses.dangerDesc}
                      buttonClass={compactClasses.dangerButton}
                    />
                    <DangerRow
                      title="Delete Account"
                      description="Permanently delete your account, reports, and all associated data."
                      label="Delete Account"
                      onClick={deleteAccount}
                      bold
                      compact={compact}
                      padding={compactClasses.dangerRowPadding}
                      titleClass={compactClasses.dangerTitle}
                      descClass={compactClasses.dangerDesc}
                      buttonClass={compactClasses.dangerButton}
                    />
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className={`flex items-center justify-center gap-2 py-3 text-[var(--text-muted)] ${compactClasses.footerText} ${compactClasses.footerMargin}`}>
            <span>CodeVerity</span>
            <span>•</span>
            <span>AI Repository Intelligence</span>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-6 right-6 rounded-xl shadow-2xl font-medium
            transition-all duration-300 z-50
            ${compactClasses.toastSize}
            ${toast.type === "error"
              ? "bg-[var(--color-danger)]/90 text-white border border-[var(--color-danger)]/30"
              : "bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)]/30"
            }`}
        >
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}

/*  UI helpers  */

function Section({ title, children, danger, compact, padding, gap }) {
  return (
    <div
      className={`bg-[var(--bg-card)] border rounded-2xl ${padding} ${gap}
      ${danger ? "border-[var(--color-danger)]/20" : "border-[var(--border-light)]"}`}
    >
      <h2 className={`font-semibold ${danger ? "text-[var(--color-danger)]" : "text-[var(--text-primary)]"} ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children, compact, labelClass }) {
  return (
    <div className={`space-y-1.5 ${compact ? "space-y-1" : ""}`}>
      <label className={`text-[var(--text-secondary)] ${labelClass}`}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, autoComplete, compact, padding }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={`w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)] text-[var(--text-primary)]
        placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition ${padding}`}
    />
  );
}

function Toggle({ label, description, value, onChange, compact, textClass, descClass }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${compact ? "gap-3" : ""}`}>
      <div>
        <p className={`font-medium text-[var(--text-primary)] ${textClass}`}>{label}</p>
        <p className={`text-[var(--text-muted)] mt-0.5 ${descClass}`}>{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0
          ${value ? "bg-[var(--accent)]" : "bg-[var(--border-light)]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
            transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function SaveButton({ onClick, loading, label = "Save Changes", disabled = false, compact, buttonClass }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`rounded-xl font-semibold
        bg-[var(--accent)] text-[var(--accent-contrast)]
        hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed
        transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--accent-soft-strong)] ${buttonClass}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent-contrast)", borderTopColor: "transparent", opacity: 0.85 }}
          />
          Saving…
        </span>
      ) : (
        label
      )}
    </button>
  );
}

function DangerRow({ title, description, label, onClick, bold, compact, padding, titleClass, descClass, buttonClass }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/10 ${padding}`}>
      <div>
        <p className={`${bold ? "font-semibold text-[var(--color-danger)]" : "text-[var(--text-secondary)]"} ${titleClass}`}>
          {title}
        </p>
        <p className={`text-[var(--text-muted)] mt-0.5 ${descClass}`}>{description}</p>
      </div>
      <button
        onClick={onClick}
        className={`shrink-0 rounded-lg font-medium
          bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/30 transition ${buttonClass}`}
      >
        {label}
      </button>
    </div>
  );
}

// 4-tier strength scale, aligned with the app's severity tokens
// (Weak→danger, Fair→warning, Good→info, Strong→success) so this
// matches the same red/amber/blue/green vocabulary used everywhere
// else instead of running its own independent color scheme.
function PasswordStrength({ password, compact }) {
  if (!password) return null;

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "bg-[var(--color-danger)]",
    "bg-[var(--color-warning)]",
    "bg-[var(--color-info)]",
    "bg-[var(--color-success)]",
  ];
  const textColors = [
    "",
    "text-[var(--color-danger)]",
    "text-[var(--color-warning)]",
    "text-[var(--color-info)]",
    "text-[var(--color-success)]",
  ];

  const barHeight = compact ? "h-1" : "h-1.5";
  const labelSize = compact ? "text-[10px]" : "text-xs";
  const chipSize = compact ? "text-[9px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 ${barHeight} rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : "bg-[var(--border-light)]"
            }`}
          />
        ))}
      </div>
      <p className={`${textColors[score]} ${labelSize}`}>{labels[score]} password</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {[
          { key: "length", label: "8+ chars" },
          { key: "upper", label: "Uppercase" },
          { key: "number", label: "Number" },
          { key: "special", label: "Special char" },
        ].map(({ key, label }) => (
          <span
            key={key}
            className={`${chipSize} rounded-full ${
              checks[key]
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "bg-[var(--border-light)] text-[var(--text-muted)]"
            }`}
          >
            {checks[key] ? "✓" : "·"} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function tabIcon(tab) {
  const map = {
    Account: "👤",
    Security: "🔐",
    Appearance: "🎨",
    "Danger Zone": "⚠️",
  };
  return map[tab] ?? "";
}
