// src/components/Settings/Field.jsx
export default function Field({ label, children, compact = false, labelClass = "" }) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <label className={`block text-[var(--text-secondary)] ${labelClass}`}>
        {label}
      </label>
      {children}
    </div>
  );
}