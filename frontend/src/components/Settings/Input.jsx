// src/components/Settings/Input.jsx
export default function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  padding = "px-4 py-2.5 text-sm",
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={`w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 ${padding}`}
    />
  );
}