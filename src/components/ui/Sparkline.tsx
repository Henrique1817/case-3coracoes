interface SparklineProps {
  values: number[];
  reference?: number[];
  width?: number;
  height?: number;
  label: string;
}

/** Sparkline em SVG puro (leve, sem eixo). */
export function Sparkline({ values, reference, width = 120, height = 36, label }: SparklineProps) {
  const all = [...values, ...(reference ?? [])];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / (arr.length - 1)) * (width - 4) + 2;
        const y = height - 3 - ((v - min) / span) * (height - 6);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("");
  const last = values[values.length - 1];
  const lx = width - 2;
  const ly = height - 3 - ((last - min) / span) * (height - 6);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="overflow-visible"
    >
      {reference && (
        <path
          d={toPath(reference)}
          fill="none"
          stroke="var(--color-coffee-200)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      )}
      <path d={toPath(values)} fill="none" stroke="var(--color-wine-600)" strokeWidth={2} />
      <circle cx={lx} cy={ly} r={2.5} fill="var(--color-wine-600)" />
    </svg>
  );
}
