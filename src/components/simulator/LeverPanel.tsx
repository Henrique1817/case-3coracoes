"use client";

import { CURRENT_LEVERS, LEVER_LIMITS, SCENARIO_PRESETS, SEGMENTS, type Levers, type SegmentId } from "@/data/model";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Slider } from "@/components/ui/Slider";
import { fmtNumber, fmtPct } from "@/lib/format";

type NumericLever = Exclude<keyof Levers, "passThrough">;

const pct0 = (v: number) => fmtPct(v, 0);
const pct1 = (v: number) => fmtPct(v, 1);
const pp = (v: number) => `${fmtNumber(v, v % 1 ? 2 : 0)} p.p.`;

const GROUPS: {
  title: string;
  pillar: string;
  sliders: { key: NumericLever; label: string; hint: string; format: (v: number) => string }[];
}[] = [
  {
    title: "Custo e suprimento",
    pillar: "Custo",
    sliders: [
      { key: "hedgePct", label: "Café travado com hedge", hint: "% do volume projetado com contratos futuros.", format: pct0 },
      { key: "directSourcingPct", label: "Compra direta de cooperativas", hint: "% do café originado direto, com desconto vs. mercado.", format: pct0 },
      { key: "blendShiftPP", label: "Ajuste de blend (conilon)", hint: "p.p. de conilon a mais nas linhas de entrada. Exige validação sensorial.", format: pp },
      { key: "efficiencyPct", label: "Eficiência operacional", hint: "Redução do custo de conversão: torra, embalagem, logística, energia.", format: pct1 },
    ],
  },
  {
    title: "Portfólio e mix",
    pillar: "Mix",
    sliders: [
      { key: "premiumMixPP", label: "Mix premium (trade-up)", hint: "p.p. do volume que migra para premium/gourmet e cápsulas.", format: pp },
      { key: "smallPackPct", label: "Embalagens menores e refil", hint: "% do volume de Entrada/Tradicional em formatos menores.", format: pct0 },
    ],
  },
  {
    title: "Execução comercial",
    pillar: "Execução",
    sliders: [
      { key: "promoOptimizationPct", label: "Verba promocional com plano conjunto", hint: "Redução da verba linear do Varejo, trocada por contrapartidas.", format: pct0 },
    ],
  },
];

export function LeverPanel() {
  const { levers, setLevers, resetLevers, isDirty } = useScenario();

  const setNumeric = (key: NumericLever, v: number) => setLevers((prev) => ({ ...prev, [key]: v }));
  const setPass = (seg: SegmentId, v: number) =>
    setLevers((prev) => ({ ...prev, passThrough: { ...prev.passThrough, [seg]: v } }));

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg">Alavancas do cenário proposto</h3>
        <button
          type="button"
          onClick={resetLevers}
          disabled={!isDirty}
          className="rounded-full border border-coffee-100 px-3 py-1 text-xs font-semibold text-coffee-600 transition hover:border-wine-200 hover:text-wine-600 disabled:opacity-40"
        >
          Restaurar
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Cenários prontos">
        {SCENARIO_PRESETS.map((p) => {
          const active = JSON.stringify(p.levers) === JSON.stringify(levers);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => setLevers(() => p.levers)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "bg-wine-600 text-cream-50"
                  : "bg-coffee-50 text-coffee-600 hover:bg-wine-50 hover:text-wine-700"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-7">
        {GROUPS.slice(0, 2).map((g) => (
          <Group key={g.title} title={g.title} pillar={g.pillar}>
            {g.sliders.map((s) => (
              <Slider
                key={s.key}
                label={s.label}
                hint={s.hint}
                value={levers[s.key]}
                {...LEVER_LIMITS[s.key]}
                format={s.format}
                reference={CURRENT_LEVERS[s.key]}
                onChange={(v) => setNumeric(s.key, v)}
              />
            ))}
          </Group>
        ))}

        <Group title="Repasse por segmento" pillar="Preço">
          {SEGMENTS.map((seg) => (
            <Slider
              key={seg.id}
              label={seg.label}
              value={levers.passThrough[seg.id]}
              {...LEVER_LIMITS.passThrough}
              format={(v) => fmtPct(v, 0, true)}
              reference={CURRENT_LEVERS.passThrough[seg.id]}
              onChange={(v) => setPass(seg.id, v)}
            />
          ))}
        </Group>

        {GROUPS.slice(2).map((g) => (
          <Group key={g.title} title={g.title} pillar={g.pillar}>
            {g.sliders.map((s) => (
              <Slider
                key={s.key}
                label={s.label}
                hint={s.hint}
                value={levers[s.key]}
                {...LEVER_LIMITS[s.key]}
                format={s.format}
                reference={CURRENT_LEVERS[s.key]}
                onChange={(v) => setNumeric(s.key, v)}
              />
            ))}
          </Group>
        ))}
      </div>
    </div>
  );
}

function Group({ title, pillar, children }: { title: string; pillar: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 flex w-full items-center justify-between border-b border-coffee-100 pb-2">
        <span className="text-sm font-semibold text-coffee-800">{title}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-caramel-600">{pillar}</span>
      </legend>
      {children}
    </fieldset>
  );
}
