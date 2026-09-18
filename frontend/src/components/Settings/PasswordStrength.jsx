// src/components/Settings/PasswordStrength.jsx
import { Check, Circle } from "lucide-react";

export default function PasswordStrength({ password, compact = false }) {
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
  const chipSize = compact ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5";

  const items = [
    { key: "length", label: "8+ chars" },
    { key: "upper", label: "Uppercase" },
    { key: "number", label: "Number" },
    { key: "special", label: "Special char" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${barHeight} ${
              i <= score ? colors[score] : "bg-[var(--border-light)]"
            }`}
          />
        ))}
      </div>
      <p className={`${textColors[score]} ${labelSize}`}>
        {labels[score]} password
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {items.map(({ key, label }) => {
          const done = checks[key];
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-1 rounded-full ${chipSize} ${
                done
                  ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                  : "bg-[var(--border-light)] text-[var(--text-muted)]"
              }`}
            >
              {done ? (
                <Check size={10} strokeWidth={3} aria-hidden="true" />
              ) : (
                <Circle size={6} strokeWidth={3} aria-hidden="true" />
              )}
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}