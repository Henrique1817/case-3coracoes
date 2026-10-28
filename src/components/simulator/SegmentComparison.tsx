"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, ChartTooltip } from "@/components/charts/ChartTooltip";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Segmented } from "@/components/ui/Segmented";
import { SEGMENTS } from "@/data/model";
import { aggregate } from "@/lib/simulation";
import { fmtNumber } from "@/lib/format";

type Metric = "margin" | "volume";

export function SegmentComparison() {
  const { current, proposed } = useScenario();
  const [metric, setMetric] = useState<Metric>("margin");

  const data = useMemo(
    () =>
      SEGMENTS.map((seg) => {
        const a = aggregate(current.cells, { segment: seg.id });
        const p = aggregate(proposed.cells, { segment: seg.id });
        return metric === "margin"
          ? { name: seg.label, "Pré-alta": a.grossMargin0 * 100, Atual: a.grossMargin * 100, Proposto: p.grossMargin * 100 }
          : { name: seg.label, Atual: a.volumeChange * 100, Proposto: p.volumeChange * 100 };
      }),
    [current, proposed, metric],
  );

  const unit = metric === "margin" ? "%" : "% vs. pré-alta";
  const fmt = (v: number) => (metric === "margin" ? `${fmtNumber(v, 1)}%` : `${fmtNumber(v, 1, true)}%`);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">Atual × Proposto por segmento</h3>
          <p className="mt-1 text-sm text-coffee-500">
            {metric === "margin" ? "Margem bruta (%)" : "Variação de volume em kg (%)"}: entrada defende volume, topo carrega margem.
          </p>
        </div>
        <Segmented
          label="Métrica por segmento"
          size="sm"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "margin", label: "Margem" },
            { value: "volume", label: "Volume" },
          ]}
        />
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={3}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <XAxis dataKey="name" tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis
              tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => `${fmtNumber(v, 0)}%`}
            />
            <Tooltip
              cursor={{ fill: "rgba(198,139,89,0.08)" }}
              content={(props) => <ChartTooltip {...props} format={(v) => fmt(v)} />}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} />
            {metric === "margin" && <Bar dataKey="Pré-alta" fill={CHART_COLORS.base} radius={[4, 4, 0, 0]} />}
            <Bar dataKey="Atual" fill={CHART_COLORS.current} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Proposto" fill={CHART_COLORS.proposed} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">Unidade: {unit}</p>
    </div>
  );
}
