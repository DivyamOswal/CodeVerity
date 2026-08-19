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

  /* form states */
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
    // Preferences are auto-saved via the context, but we show a toast
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
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] pt-16">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
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

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] px-4 py-6 sm:px-6 lg:px-8 pt-16">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f0f6fc]">Settings</h1>
          <p className="text-xs text-[#6e7681]">Manage your account and preferences</p>
        </div>

        {/* LAYOUT */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* SIDEBAR */}
          <nav className="flex md:flex-col gap-1 md:w-44 shrink-0" aria-label="Settings tabs">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all
                  ${
                    tab === t
                      ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40"
                      : t === "Danger Zone"
                      ? "text-red-400 hover:bg-white/5 hover:text-red-300"
                      : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
                  }`}
                aria-current={tab === t ? "page" : undefined}
              >
                {tabIcon(t)} {t}
              </button>
            ))}
          </nav>

          {/* PANEL */}
          <div className="flex-1 space-y-5">
            {/* ACCOUNT */}
            {tab === "Account" && (
              <Section title="Public Profile">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600
                    flex items-center justify-center text-2xl font-bold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f0f6fc]">{name || "Your Name"}</p>
                    <p className="text-xs text-[#6e7681]">{email}</p>
                  </div>
                </div>

                <Field label="Full Name">
                  <Input value={name} onChange={setName} placeholder="Your full name" />
                </Field>

                <Field label="Email Address">
                  <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
                </Field>

                <div className="flex items-center justify-between">
                  {profileDirty && <p className="text-xs text-amber-400">Unsaved changes</p>}
                  <div className="ml-auto">
                    <SaveButton onClick={saveProfile} loading={saving} disabled={!profileDirty} />
                  </div>
                </div>
              </Section>
            )}

            {/* SECURITY */}
            {tab === "Security" && (
              <Section title="Change Password">
                <Field label="Current Password">
                  <Input
                    value={oldPass}
                    onChange={setOldPass}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="New Password">
                  <Input
                    value={newPass}
                    onChange={setNewPass}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm New Password">
                  <Input
                    value={confPass}
                    onChange={setConfPass}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {newPass && confPass && newPass !== confPass && (
                    <p className="text-red-400 text-xs mt-1" role="alert">
                      Passwords don't match
                    </p>
                  )}
                </Field>

                <PasswordStrength password={newPass} />

                <div className="flex justify-end">
                  <SaveButton
                    onClick={changePassword}
                    loading={saving}
                    label="Update Password"
                    disabled={!oldPass || !newPass || !confPass}
                  />
                </div>
              </Section>
            )}

            {/* APPEARANCE – USING THE CONTEXT */}
            {tab === "Appearance" && (
              <Section title="Display Preferences">
                <Field label="Theme">
                  <div className="flex gap-3">
                    {["dark", "light", "system"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`flex-1 py-2.5 rounded-xl text-sm capitalize border transition
                          ${
                            theme === t
                              ? "bg-[#238636]/20 border-[#238636]/40 text-[#3fb950]"
                              : "bg-white/5 border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
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
                />
                <Toggle
                  label="Show Score Bars"
                  description="Display score progress bars on report cards"
                  value={showScores}
                  onChange={setShowScores}
                />

                <div className="flex justify-end">
                  <SaveButton onClick={saveAppearance} loading={false} label="Save Preferences" />
                </div>
              </Section>
            )}

            {/* DANGER ZONE */}
            {tab === "Danger Zone" && (
              <Section title="Danger Zone" danger>
                <div className="space-y-4">
                  <DangerRow
                    title="Clear Report History"
                    description="Permanently delete all your past analysis reports."
                    label="Clear History"
                    onClick={clearHistory}
                  />
                  <DangerRow
                    title="Delete Account"
                    description="Permanently delete your account, reports, and all associated data."
                    label="Delete Account"
                    onClick={deleteAccount}
                    bold
                  />
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-center gap-2 py-3 text-[9px] text-[#30363d]">
          <span>CodeVerity</span>
          <span>•</span>
          <span>AI Repository Intelligence</span>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium
            transition-all duration-300 z-50
            ${
              toast.type === "error"
                ? "bg-red-500/90 text-white border border-red-400/30"
                : "bg-[#238636] text-white border border-[#3fb950]/30"
            }`}
        >
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}

/*  UI helpers  */

function Section({ title, children, danger }) {
  return (
    <div
      className={`bg-[#161b22] border rounded-2xl p-6 space-y-4
      ${danger ? "border-red-500/20" : "border-[#30363d]"}`}
    >
      <h2 className={`text-base font-semibold ${danger ? "text-red-400" : "text-[#f0f6fc]"}`}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-[#8b949e]">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, autoComplete }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-sm text-[#f0f6fc]
        placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#238636]/50 transition"
    />
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#f0f6fc]">{label}</p>
        <p className="text-xs text-[#6e7681] mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0
          ${value ? "bg-[#238636]" : "bg-[#30363d]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
            transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function SaveButton({ onClick, loading, label = "Save Changes", disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="px-5 py-2 rounded-xl text-sm font-semibold
        bg-gradient-to-r from-[#238636] to-[#2ea043]
        hover:from-[#2ea043] hover:to-[#3fb950]
        disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105
        text-white shadow-lg shadow-green-500/20"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Saving…
        </span>
      ) : (
        label
      )}
    </button>
  );
}

function DangerRow({ title, description, label, onClick, bold }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
      <div>
        <p className={`text-sm ${bold ? "font-semibold text-red-300" : "text-[#c9d1d9]"}`}>
          {title}
        </p>
        <p className="text-xs text-[#6e7681] mt-0.5">{description}</p>
      </div>
      <button
        onClick={onClick}
        className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium
          bg-red-500/20 text-red-400 hover:bg-red-500/40 transition"
      >
        {label}
      </button>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const textColors = ["", "text-red-400", "text-yellow-400", "text-blue-400", "text-green-400"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : "bg-[#30363d]"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${textColors[score]}`}>{labels[score]} password</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {[
          { key: "length", label: "8+ chars" },
          { key: "upper", label: "Uppercase" },
          { key: "number", label: "Number" },
          { key: "special", label: "Special char" },
        ].map(({ key, label }) => (
          <span
            key={key}
            className={`text-xs px-2 py-0.5 rounded-full ${
              checks[key]
                ? "bg-green-500/20 text-green-400"
                : "bg-[#30363d] text-[#484f58]"
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