"use client";

import { useScenario } from "@/components/scenario/ScenarioContext";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { fmtBRL, fmtPP, fmtPct } from "@/lib/format";

export function ResultCards() {
  const { current, proposed } = useScenario();
  const a = current.totals;
  const p = proposed.totals;

  const cards = [
    {
      label: "Margem bruta",
      value: p.grossMargin,
      format: (v: number) => fmtPct(v, 1),
      current: fmtPct(a.grossMargin, 1),
      delta: (p.grossMargin - a.grossMargin) * 100,
      deltaFormat: (v: number) => fmtPP(v, 1),
      sub: `${fmtPP(p.grossMarginChangePP)} vs. pré-alta`,
    },
    {
      label: "Volume (kg) vs. pré-alta",
      value: p.volumeChange,
      format: (v: number) => fmtPct(v, 1, true),
      current: fmtPct(a.volumeChange, 1, true),
      delta: (p.volumeChange - a.volumeChange) * 100,
      deltaFormat: (v: number) => fmtPP(v, 1),
      sub: "Volume preservado na base",
    },
    {
      label: "Receita líquida",
      value: p.netRevenue,
      format: (v: number) => fmtBRL(v),
      current: fmtBRL(a.netRevenue),
      delta: p.netRevenue - a.netRevenue,
      deltaFormat: (v: number) => fmtBRL(v, 0, true),
      sub: "R$ milhões/ano, ilustrativo",
    },
    {
      label: "Lucro bruto",
      value: p.grossProfit,
      format: (v: number) => fmtBRL(v),
      current: fmtBRL(a.grossProfit),
      delta: p.grossProfit - a.grossProfit,
      deltaFormat: (v: number) => fmtBRL(v, 0, true),
      sub: `${fmtPct(p.grossProfit / a.grossProfit - 1, 1, true)} vs. Atual`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-live="polite">
      {cards.map((c) => {
        const positive = c.delta >= 0;
        return (
          <div key={c.label} className="card p-4 sm:p-5">
            <p className="text-xs font-medium text-coffee-500">{c.label}</p>
            <p className="mt-1 whitespace-nowrap text-xl font-semibold tracking-tight text-coffee-800 sm:text-2xl 2xl:text-3xl">
              <AnimatedNumber value={c.value} format={c.format} duration={0.35} />
            </p>
            <p className="mt-1 text-[11px] text-coffee-500">Proposto · Atual {c.current}</p>
            <p
              className={`tabular mt-3 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                positive ? "bg-ok-50 text-ok-700" : "bg-bad-50 text-bad-700"
              }`}
            >
              {c.deltaFormat(c.delta)} vs. Atual
            </p>
            <p className="mt-2 text-[11px] text-coffee-500">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
