"use client";

interface Item {
  name?: string | number;
  value?: unknown;
  color?: string;
  dataKey?: unknown;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly Item[];
  format: (value: number, name: string) => string;
  labelFormat?: (label: string | number) => string;
}

export function ChartTooltip({ active, label, payload, format, labelFormat }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-coffee-100 bg-cream-50/95 px-3 py-2 text-xs shadow-lift backdrop-blur">
      {label !== undefined && (
        <p className="mb-1 font-semibold text-coffee-800">{labelFormat ? labelFormat(label) : label}</p>
      )}
      <ul className="space-y-0.5">
        {payload
          .filter((p) => typeof p.value === "number")
          .map((p) => (
            <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              <span className="text-coffee-600">{p.name}</span>
              <span className="tabular ml-auto font-semibold text-coffee-800">
                {format(p.value as number, String(p.name))}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}

export const CHART_COLORS = {
  base: "#D3C2B8",
  current: "#8D6E63",
  proposed: "#7A1F2B",
  caramel: "#C68B59",
  grid: "#E9DFD9",
  axis: "#6D4C41",
} as const;
