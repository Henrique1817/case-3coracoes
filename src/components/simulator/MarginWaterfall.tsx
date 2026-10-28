"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/components/charts/ChartTooltip";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Segmented } from "@/components/ui/Segmented";
import { fmtBRL, fmtNumber, fmtPP } from "@/lib/format";

type Metric = "margin" | "profit";

interface Row {
  name: string;
  range: [number, number];
  delta: number;
  kind: "total" | "up" | "down";
  description?: string;
}

export function MarginWaterfall() {
  const { bridge } = useScenario();
  const [metric, setMetric] = useState<Metric>("margin");

  const startValue = metric === "margin" ? bridge.current.grossMargin * 100 : bridge.current.grossProfit;
  const endValue = metric === "margin" ? bridge.proposed.grossMargin * 100 : bridge.proposed.grossProfit;

  const rows: Row[] = [{ name: "Atual", range: [0, startValue], delta: startValue, kind: "total" }];
  let acc = startValue;
  for (const s of bridge.steps) {
    const d = metric === "margin" ? s.marginPP : s.grossProfit;
    rows.push({
      name: s.label,
      range: [Math.min(acc, acc + d), Math.max(acc, acc + d)],
      delta: d,
      kind: d >= 0 ? "up" : "down",
      description: s.description,
    });
    acc += d;
  }
  rows.push({ name: "Proposto", range: [0, endValue], delta: endValue, kind: "total" });

  const lows = rows.filter((r) => r.kind !== "total").map((r) => r.range[0]);
  const highs = rows.map((r) => r.range[1]);
  const pad = metric === "margin" ? 1 : 80;
  const domainMin = Math.max(0, Math.floor((Math.min(startValue, endValue, ...lows) - pad) / pad) * pad);
  const domainMax = Math.ceil((Math.max(...highs) + pad / 2) / pad) * pad;
  const tickStep = metric === "margin" ? 1 : domainMax - domainMin > 800 ? 200 : 100;
  const ticks: number[] = [];
  for (let t = domainMin; t <= domainMax + 1e-9; t += tickStep) ticks.push(t);

  const label = (r: Row) => {
    if (r.kind === "total") return metric === "margin" ? `${fmtNumber(r.delta, 1)}%` : fmtBRL(r.delta);
    return metric === "margin" ? fmtPP(r.delta, 1) : fmtBRL(r.delta, 0, true);
  };

  const color = (r: Row) =>
    r.kind === "total" ? (r.name === "Atual" ? CHART_COLORS.current : CHART_COLORS.proposed) : r.kind === "up" ? CHART_COLORS.caramel : CHART_COLORS.base;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">Ponte de margem: Atual → Proposto</h3>
          <p className="mt-1 text-sm text-coffee-500">Contribuição de cada termo de Margem = Custo + Mix + Preço + Execução.</p>
        </div>
        <Segmented
          label="Métrica da ponte"
          size="sm"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "margin", label: "Margem (p.p.)" },
            { value: "profit", label: "Lucro bruto (R$)" },
          ]}
        />
      </div>

      <div className="mt-4 h-72" role="img" aria-label={`Ponte de margem. ${rows.map((r) => `${r.name}: ${label(r)}`).join("; ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <XAxis dataKey="name" tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[domainMin, domainMax]}
              ticks={ticks}
              allowDataOverflow
              tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={metric === "margin" ? 36 : 56}
              tickFormatter={(v: number) => (metric === "margin" ? `${fmtNumber(v, 0)}%` : fmtNumber(v, 0))}
            />
            <Tooltip
              cursor={{ fill: "rgba(198,139,89,0.08)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as Row;
                return (
                  <div className="max-w-56 rounded-xl border border-coffee-100 bg-cream-50/95 px-3 py-2 text-xs shadow-lift">
                    <p className="font-semibold text-coffee-800">{r.name}</p>
                    {r.description && <p className="text-coffee-500">{r.description}</p>}
                    <p className="tabular mt-1 font-semibold text-wine-600">{label(r)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="range" radius={[6, 6, 6, 6]} isAnimationActive animationDuration={450}>
              {rows.map((r) => (
                <Cell key={r.name} fill={color(r)} />
              ))}
              <LabelList
                dataKey="delta"
                position="top"
                content={(props) => {
                  const { x, y, width, index } = props as { x: number; y: number; width: number; index: number };
                  const r = rows[index];
                  return (
                    <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={12} fontWeight={600} fill="#3E2723" className="tabular">
                      {label(r)}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-coffee-500">
        Alavancas ligadas em sequência (Custo → Mix → Preço → Execução); interações são atribuídas ao passo em que ocorrem.
        O repasse segmentado troca margem por volume na base: {fmtPP(bridge.steps.find((s) => s.id === "preco")!.volumePP, 1)} de
        volume no passo Preço.
      </p>
    </div>
  );
}
