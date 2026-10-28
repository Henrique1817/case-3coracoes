export type StatusLevel = "ok" | "warn" | "bad";

const styles: Record<StatusLevel, { dot: string; pill: string; label: string }> = {
  ok: { dot: "bg-ok-600", pill: "bg-ok-50 text-ok-700", label: "Na meta" },
  warn: { dot: "bg-warn-600", pill: "bg-warn-50 text-warn-600", label: "Atenção" },
  bad: { dot: "bg-bad-600", pill: "bg-bad-50 text-bad-700", label: "Fora da meta" },
};

export function StatusPill({ level, label }: { level: StatusLevel; label?: string }) {
  const s = styles[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.pill}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label ?? s.label}
    </span>
  );
}

export function Tag({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "wine" | "caramel" | "quick" | "structural";
}) {
  const map = {
    neutral: "bg-coffee-50 text-coffee-600 border-coffee-100",
    wine: "bg-wine-50 text-wine-700 border-wine-100",
    caramel: "bg-caramel-100 text-caramel-700 border-caramel-200",
    quick: "bg-ok-50 text-ok-700 border-ok-50",
    structural: "bg-wine-50 text-wine-700 border-wine-100",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${map[variant]}`}
    >
      {children}
    </span>
  );
}
