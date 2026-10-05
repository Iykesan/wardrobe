import type { InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export default function InputField({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: InputFieldProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [props["aria-describedby"], error ? errorId : hintId].filter(Boolean).join(" ") || undefined;

  return (
    <label className="flex flex-col gap-1 text-sm text-muted" htmlFor={inputId}>
      <span className="font-medium text-ink">{label}</span>
      <input
        {...props}
        id={inputId}
        className={`rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${className ?? ""}`}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={describedBy}
      />
      {hint && !error && (
        <span id={hintId} className="text-xs text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
