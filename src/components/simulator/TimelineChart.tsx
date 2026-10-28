"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, ChartTooltip } from "@/components/charts/ChartTooltip";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Segmented } from "@/components/ui/Segmented";
import { ROLLOUT } from "@/data/model";
import { fmtBRL, fmtNumber } from "@/lib/format";

type Metric = "margin" | "volume" | "profit";

const META: Record<Metric, { title: string; fmt: (v: number) => string; axis: (v: number) => string }> = {
  margin: { title: "Margem bruta (%)", fmt: (v) => `${fmtNumber(v, 1)}%`, axis: (v) => `${fmtNumber(v, 0)}%` },
  volume: { title: "Volume vs. pré-alta (%)", fmt: (v) => `${fmtNumber(v, 1, true)}%`, axis: (v) => `${fmtNumber(v, 0)}%` },
  profit: { title: "Lucro bruto anualizado (R$ mi, ilustrativo)", fmt: (v) => fmtBRL(v), axis: (v) => fmtNumber(v, 0) },
};

export function TimelineChart() {
  const { timeline } = useScenario();
  const [metric, setMetric] = useState<Metric>("margin");
  const meta = META[metric];

  const data = useMemo(
    () =>
      timeline.map((p) => {
        const pick = (t: typeof p.current.totals) =>
          metric === "margin" ? t.grossMargin * 100 : metric === "volume" ? t.volumeChange * 100 : t.grossProfit;
        return {
          month: p.month,
          Atual: pick(p.current.totals),
          Proposto: pick(p.proposed.totals),
          "Café verde (% vs. pré-alta)": p.coffeeIncrease * 100,
        };
      }),
    [timeline, metric],
  );

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">Próximos 24 meses</h3>
          <p className="mt-1 text-sm text-coffee-500">
            {meta.title}. Atual segue repassando o custo; Proposto entra conforme o roadmap e o hedge suaviza a volatilidade.
          </p>
        </div>
        <Segmented
          label="Métrica da série"
          size="sm"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "margin", label: "Margem" },
            { value: "volume", label: "Volume" },
            { value: "profit", label: "Lucro bruto" },
          ]}
        />
      </div>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <ReferenceArea x1={1} x2={ROLLOUT.quickWins.end} yAxisId="left" fill="#C68B59" fillOpacity={0.07} label={{ value: "0–6 m", position: "insideTopLeft", fontSize: 11, fill: CHART_COLORS.axis }} />
            <ReferenceArea x1={ROLLOUT.quickWins.end} x2={ROLLOUT.structural.end} yAxisId="left" fill="#7A1F2B" fillOpacity={0.04} label={{ value: "6–18 m", position: "insideTopLeft", fontSize: 11, fill: CHART_COLORS.axis }} />
            <ReferenceArea x1={ROLLOUT.structural.end} x2={24} yAxisId="left" fill="#C68B59" fillOpacity={0.07} label={{ value: "18+ m", position: "insideTopLeft", fontSize: 11, fill: CHART_COLORS.axis }} />
            <XAxis
              dataKey="month"
              type="number"
              domain={[1, 24]}
              ticks={[1, 6, 12, 18, 24]}
              tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
              tickFormatter={(v: number) => `M${v}`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              domain={["auto", "auto"]}
              tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={metric === "profit" ? 52 : 40}
              tickFormatter={meta.axis}
            />
            <YAxis yAxisId="right" orientation="right" hide domain={[0, 120]} />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  labelFormat={(l) => `Mês ${l}`}
                  format={(v, name) => (name.startsWith("Café") ? `${fmtNumber(v, 0, true)}%` : meta.fmt(v))}
                />
              )}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="Café verde (% vs. pré-alta)"
              stroke="#C68B59"
              strokeOpacity={0.5}
              fill="#C68B59"
              fillOpacity={0.12}
              isAnimationActive={false}
            />
            <Line yAxisId="left" type="monotone" dataKey="Atual" stroke={CHART_COLORS.current} strokeWidth={2} strokeDasharray="5 4" dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="Proposto" stroke={CHART_COLORS.proposed} strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-coffee-500">
        Cada mês é um run-rate anualizado. Faixa caramelo ao fundo: alta do café verde vs. pré-alta (escala própria).
      </p>
    </div>
  );
}
