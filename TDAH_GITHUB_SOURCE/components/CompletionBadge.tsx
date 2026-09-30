type Variant = "pill" | "banner";

const VARIANT_CLASSES: Record<Variant, string> = {
  pill: "inline-flex items-center gap-1.5 rounded-full bg-[var(--success)]/10 px-3 py-1 text-sm font-semibold text-[var(--success)]",
  banner: "rounded-xl bg-[var(--success)]/10 px-4 py-3 text-sm font-medium text-[var(--success)]",
};

export function CompletionBadge({
  message,
  xpAmount,
  variant = "pill",
}: {
  message: string;
  xpAmount?: number;
  variant?: Variant;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`feedback-pop mt-2 ${VARIANT_CLASSES[variant]}`}
    >
      {variant === "pill" && <span aria-hidden="true">✓</span>}
      {xpAmount ? `+${xpAmount} XP. ${message}` : message}
    </p>
  );
}
