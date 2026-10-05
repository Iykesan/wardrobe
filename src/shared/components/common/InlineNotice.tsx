import type { ReactNode } from "react";

type InlineNoticeProps = {
  variant?: "success" | "error" | "info";
  children: ReactNode;
  onDismiss?: () => void;
};

const variantStyles: Record<NonNullable<InlineNoticeProps["variant"]>, string> = {
  success: "border-emerald-300/60 bg-emerald-50 text-emerald-900",
  error: "border-danger/40 bg-danger/10 text-danger",
  info: "border-border bg-white/80 text-muted",
};

export default function InlineNotice({
  variant = "info",
  children,
  onDismiss,
}: InlineNoticeProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-[var(--radius-card)] border px-4 py-3 text-sm ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>{children}</div>
        {onDismiss && (
          <button
            className="text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink"
            onClick={onDismiss}
            type="button"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
