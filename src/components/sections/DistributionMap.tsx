"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Reveal, Section } from "@/components/ui/Section";
import { Segmented } from "@/components/ui/Segmented";
import { StatusPill, type StatusLevel } from "@/components/ui/Status";
import { MAP_VIEWBOX, REGION_LABEL_POS, STATE_SHAPES } from "@/data/brazil-map";
import { REGIONS, type RegionId } from "@/data/model";
import { regionKpis, type RegionKpis } from "@/lib/simulation";
import { fmtBRL, fmtNumber, fmtPP, fmtPct } from "@/lib/format";

type Metric = "volume" | "share" | "risk";
type Scenario = "current" | "proposed";

const METRICS: Record<Metric, { label: string; value: (k: RegionKpis) => number; fmt: (v: number) => string; range: [number, number]; legend: [string, string] }> = {
  volume: { label: "Perda de volume", value: (k) => -k.volumeChange * 100, fmt: (v) => `${fmtNumber(-v, 1, true)}%`, range: [0, 12], legend: ["0%", "−12%"] },
  share: { label: "Market share", value: (k) => k.marketShare * 100, fmt: (v) => `${fmtNumber(v, 1)}%`, range: [10, 40], legend: ["10%", "40%"] },
  risk: { label: "Risco de perda para regionais", value: (k) => k.riskIndex, fmt: (v) => `${fmtNumber(v, 0)}/100`, range: [0, 60], legend: ["Baixo", "Alto"] },
};

const STOPS = [
  [246, 239, 230],
  [198, 139, 89],
  [122, 31, 43],
];

function colorFor(t: number) {
  const x = Math.max(0, Math.min(1, t)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const c = STOPS[i].map((v, k) => Math.round(v + (STOPS[i + 1][k] - v) * f));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

const riskLevel = (risk: number): StatusLevel => (risk < 20 ? "ok" : risk < 35 ? "warn" : "bad");

export function DistributionMap() {
  const { current, proposed } = useScenario();
  const [metric, setMetric] = useState<Metric>("risk");
  const [scenario, setScenario] = useState<Scenario>("current");
  const [selected, setSelected] = useState<RegionId>("NE");
  const [hover, setHover] = useState<{ id: RegionId; x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const kpis = useMemo(() => {
    const out = {} as Record<Scenario, Record<RegionId, RegionKpis>>;
    for (const [key, res] of [["current", current], ["proposed", proposed]] as const) {
      out[key] = Object.fromEntries(REGIONS.map((r) => [r.id, regionKpis(res, r.id)])) as Record<RegionId, RegionKpis>;
    }
    return out;
  }, [current, proposed]);

  const m = METRICS[metric];
  const fill = (id: RegionId) => {
    const v = m.value(kpis[scenario][id]);
    return colorFor((v - m.range[0]) / (m.range[1] - m.range[0]));
  };

  const onMove = (id: RegionId, e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ id, x: Math.min(e.clientX - rect.left + 14, rect.width - 200), y: e.clientY - rect.top + 14 });
  };

  const region = REGIONS.find((r) => r.id === selected)!;
  const a = kpis.current[selected];
  const p = kpis.proposed[selected];

  return (
    <Section
      id="mapa"
      eyebrow="Mapa de distribuição"
      title="Onde o repasse uniforme mais expõe o share"
      lead="Volume, market share e risco de perda para marcas regionais e próprias, por região. Clique em uma região para abrir os KPIs do cenário."
      tone="cream"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          label="Indicador do mapa"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "risk", label: "Risco" },
            { value: "volume", label: "Volume" },
            { value: "share", label: "Share" },
          ]}
        />
        <Segmented
          label="Cenário do mapa"
          value={scenario}
          onChange={setScenario}
          options={[
            { value: "current", label: "Atual" },
            { value: "proposed", label: "Proposto" },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <Reveal>
          <div ref={wrapRef} className="card relative p-4 sm:p-6">
            <svg viewBox={MAP_VIEWBOX} className="mx-auto h-auto w-full max-w-[560px]" role="group" aria-label={`Mapa do Brasil por região: ${m.label}`}>
              {REGIONS.map((r) => {
                const states = STATE_SHAPES.filter((s) => s.region === r.id);
                const isSel = r.id === selected;
                const k = kpis[scenario][r.id];
                return (
                  <g
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSel}
                    aria-label={`${r.label}: ${m.label} ${m.fmt(m.value(k))}`}
                    onClick={() => setSelected(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(r.id);
                      }
                    }}
                    onPointerMove={(e) => onMove(r.id, e)}
                    onPointerLeave={() => setHover(null)}
                    className="cursor-pointer outline-none [&:focus-visible_path]:stroke-wine-800 [&:focus-visible_path]:stroke-[2.5]"
                  >
                    {states.map((s) => (
                      <motion.path
                        key={s.uf}
                        d={s.d}
                        initial={false}
                        animate={{ fill: fill(r.id) }}
                        transition={{ duration: 0.5 }}
                        stroke={isSel ? "#3E2723" : "#FDFBF8"}
                        strokeWidth={isSel ? 1.6 : 0.8}
                        strokeLinejoin="round"
                        className="transition-[stroke-width] hover:brightness-95"
                      />
                    ))}
                  </g>
                );
              })}
              {REGIONS.map((r) => {
                const pos = REGION_LABEL_POS[r.id];
                const v = m.value(kpis[scenario][r.id]);
                const dark = (v - m.range[0]) / (m.range[1] - m.range[0]) > 0.55;
                return (
                  <g key={`l-${r.id}`} pointerEvents="none">
                    <text x={pos.x} y={pos.y - 6} textAnchor="middle" fontSize={14} fontWeight={700} fill={dark ? "#FDFBF8" : "#3E2723"}>
                      {r.id}
                    </text>
                    <text x={pos.x} y={pos.y + 12} textAnchor="middle" fontSize={13} fontWeight={600} fill={dark ? "#FDFBF8" : "#3E2723"} className="tabular">
                      {m.fmt(v)}
                    </text>
                  </g>
                );
              })}
            </svg>

            <AnimatePresence>
              {hover && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="pointer-events-none absolute z-10 w-48 rounded-xl border border-coffee-100 bg-cream-50/95 p-3 text-xs shadow-lift backdrop-blur"
                  style={{ left: hover.x, top: hover.y }}
                >
                  <p className="font-semibold text-coffee-800">{REGIONS.find((r) => r.id === hover.id)!.label}</p>
                  <dl className="mt-1 space-y-0.5 tabular">
                    <Row k="Volume" v={fmtPct(kpis[scenario][hover.id].volumeChange, 1, true)} />
                    <Row k="Share" v={fmtPct(kpis[scenario][hover.id].marketShare, 1)} />
                    <Row k="Risco" v={`${fmtNumber(kpis[scenario][hover.id].riskIndex, 0)}/100`} />
                  </dl>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex items-center gap-3 text-xs text-coffee-600">
              <span>{m.legend[0]}</span>
              <span aria-hidden className="h-2.5 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${colorFor(0)}, ${colorFor(0.5)}, ${colorFor(1)})` }} />
              <span>{m.legend[1]}</span>
            </div>
            <p className="mt-2 text-[11px] text-coffee-500">
              {m.label} · cenário {scenario === "current" ? "Atual" : "Proposto"} · dados simulados por região.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <AnimatePresence mode="wait">
            <motion.article
              key={selected}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="card h-full p-6"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Região selecionada</p>
                  <h3 className="mt-1 text-2xl">{region.label}</h3>
                  <p className="mt-1 text-sm text-coffee-500">{region.note}</p>
                </div>
                <StatusPill level={riskLevel(p.riskIndex)} label={`Risco ${fmtNumber(p.riskIndex, 0)}/100`} />
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-coffee-100">
                <table className="w-full text-sm">
                  <caption className="sr-only">KPIs simulados da região {region.label}</caption>
                  <thead className="bg-coffee-50 text-xs text-coffee-500">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-semibold">KPI</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold">Atual</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold text-wine-600">Proposto</th>
                    </tr>
                  </thead>
                  <tbody className="tabular divide-y divide-coffee-100">
                    <KpiRow label="Volume vs. pré-alta" a={fmtPct(a.volumeChange, 1, true)} p={fmtPct(p.volumeChange, 1, true)} />
                    <KpiRow label="Market share" a={fmtPct(a.marketShare, 1)} p={fmtPct(p.marketShare, 1)} hint={`Pré-alta ${fmtPct(a.marketShare0, 1)}`} />
                    <KpiRow label="Perda de share" a={fmtPP(-a.shareLossPP, 2)} p={fmtPP(-p.shareLossPP, 2)} />
                    <KpiRow label="Margem bruta" a={fmtPct(a.grossMargin, 1)} p={fmtPct(p.grossMargin, 1)} />
                    <KpiRow label="Lucro bruto" a={fmtBRL(a.grossProfit)} p={fmtBRL(p.grossProfit)} />
                    <KpiRow label="Risco (0–100)" a={fmtNumber(a.riskIndex, 0)} p={fmtNumber(p.riskIndex, 0)} />
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-coffee-500">
                Pressão de marcas regionais/próprias simulada: {fmtPct(region.privateLabelPressure, 0)}. Risco combina a perda
                de share com essa pressão.
              </p>

              <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Selecionar região">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={r.id === selected}
                    onClick={() => setSelected(r.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      r.id === selected ? "bg-coffee-800 text-cream-50" : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </motion.article>
          </AnimatePresence>
        </Reveal>
      </div>
    </Section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-coffee-500">{k}</dt>
      <dd className="font-semibold text-coffee-800">{v}</dd>
    </div>
  );
}

function KpiRow({ label, a, p, hint }: { label: string; a: string; p: string; hint?: string }) {
  return (
    <tr>
      <th scope="row" className="px-3 py-2 text-left font-medium text-coffee-700">
        {label}
        {hint && <span className="block text-[11px] font-normal text-coffee-500">{hint}</span>}
      </th>
      <td className="px-3 py-2 text-right text-coffee-600">{a}</td>
      <td className="px-3 py-2 text-right font-semibold text-wine-600">{p}</td>
    </tr>
  );
}
