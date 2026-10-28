"use client";

import { useMemo, useState } from "react";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Reveal, Section } from "@/components/ui/Section";
import { Select } from "@/components/ui/Segmented";
import { Sparkline } from "@/components/ui/Sparkline";
import { StatusPill, type StatusLevel } from "@/components/ui/Status";
import { CHANNELS, REGIONS, SEGMENTS, type ChannelId, type RegionId, type SegmentId } from "@/data/model";
import {
  aggregate,
  coffeeCostVsMarket,
  marketShareFor,
  matchesFilter,
  priceGap,
  promoRoi,
  skuTable,
  type CellFilter,
} from "@/lib/simulation";
import { fmtBRL, fmtMultiple, fmtNumber, fmtPP, fmtPct } from "@/lib/format";

interface Kpi {
  label: string;
  value: string;
  delta: string;
  deltaGood: boolean;
  target: string;
  status: StatusLevel;
  spark: number[];
  sparkRef?: number[];
  question: string;
}

const level = (ok: boolean, warn: boolean): StatusLevel => (ok ? "ok" : warn ? "warn" : "bad");

export function KpiDashboard() {
  const { current, proposed, timeline, levers } = useScenario();
  const [segment, setSegment] = useState<SegmentId | "all">("all");
  const [channel, setChannel] = useState<ChannelId | "all">("all");
  const [region, setRegion] = useState<RegionId | "all">("all");
  const filter: CellFilter = useMemo(() => ({ segment, channel, region }), [segment, channel, region]);

  const hasData = proposed.cells.some((c) => matchesFilter(c, filter));

  const kpis = useMemo<Kpi[]>(() => {
    if (!hasData) return [];
    const a = aggregate(current.cells, filter);
    const p = aggregate(proposed.cells, filter);
    const series = (pick: (t: ReturnType<typeof aggregate>, i: number) => number, which: "proposed" | "current" = "proposed") =>
      timeline.map((pt, i) => pick(aggregate(pt[which].cells, filter), i));
    const shareA = marketShareFor(current, filter);
    const shareP = marketShareFor(proposed, filter);
    const gapA = priceGap(a);
    const gapP = priceGap(p);
    const coffeeA = coffeeCostVsMarket(a);
    const coffeeP = coffeeCostVsMarket(p);
    const roiA = promoRoi({ ...levers, promoOptimizationPct: 0 });
    const roiP = promoRoi(levers);
    const marginTarget = a.grossMargin0 - 0.015;

    return [
      {
        label: "Margem bruta",
        question: "Onde a margem está sendo ganha ou perdida",
        value: fmtPct(p.grossMargin, 1),
        delta: `${fmtPP((p.grossMargin - a.grossMargin) * 100)} vs. Atual`,
        deltaGood: p.grossMargin >= a.grossMargin,
        target: `≥ ${fmtPct(marginTarget, 1)} (pré-alta −1,5 p.p.)`,
        status: level(p.grossMargin >= marginTarget, p.grossMargin >= marginTarget - 0.01),
        spark: series((t) => t.grossMargin * 100),
        sparkRef: series((t) => t.grossMargin * 100, "current"),
      },
      {
        label: "Volume (kg)",
        question: "Se a base de consumidores está preservada",
        value: fmtPct(p.volumeChange, 1, true),
        delta: `${fmtPP((p.volumeChange - a.volumeChange) * 100)} vs. Atual`,
        deltaGood: p.volumeChange >= a.volumeChange,
        target: "≥ −5,0% vs. pré-alta",
        status: level(p.volumeChange >= -0.05, p.volumeChange >= -0.07),
        spark: series((t) => t.volumeChange * 100),
        sparkRef: series((t) => t.volumeChange * 100, "current"),
      },
      {
        label: "Lucro bruto",
        question: "Resultado em R$ (ilustrativo, anualizado)",
        value: fmtBRL(p.grossProfit),
        delta: `${fmtPct(p.grossProfit / a.grossProfit - 1, 1, true)} vs. Atual`,
        deltaGood: p.grossProfit >= a.grossProfit,
        target: "≥ +10% vs. Atual",
        status: level(p.grossProfit >= a.grossProfit * 1.1, p.grossProfit >= a.grossProfit),
        spark: series((t) => t.grossProfit),
        sparkRef: series((t) => t.grossProfit, "current"),
      },
      {
        label: "Market share",
        question: "Participação ponderada nas regiões filtradas",
        value: fmtPct(shareP.share, 1),
        delta: `${fmtPP((shareP.share - shareA.share) * 100, 2)} vs. Atual`,
        deltaGood: shareP.share >= shareA.share,
        target: `Perda ≤ 0,5 p.p. (pré-alta ${fmtPct(shareP.share0, 1)})`,
        status: level(shareP.share0 - shareP.share <= 0.005, shareP.share0 - shareP.share <= 0.01),
        spark: timeline.map((pt) => marketShareFor(pt.proposed, filter).share * 100),
        sparkRef: timeline.map((pt) => marketShareFor(pt.current, filter).share * 100),
      },
      {
        label: "Gap de preço vs. concorrentes",
        question: "Se o preço continua competitivo na gôndola",
        value: fmtPct(gapP.vsCompetitors, 1, true),
        delta: `${fmtPP((gapP.vsCompetitors - gapA.vsCompetitors) * 100)} vs. Atual`,
        deltaGood: gapP.vsCompetitors <= gapA.vsCompetitors,
        target: "≤ 0% (paridade)",
        status: level(gapP.vsCompetitors <= 0, gapP.vsCompetitors <= 0.02),
        spark: series((t) => priceGap(t).vsCompetitors * 100),
        sparkRef: series((t) => priceGap(t).vsCompetitors * 100, "current"),
      },
      {
        label: "Gap vs. marcas próprias",
        question: "Distância para regionais e marcas próprias",
        value: fmtPct(gapP.vsPrivateLabel, 1, true),
        delta: `${fmtPP((gapP.vsPrivateLabel - gapA.vsPrivateLabel) * 100)} vs. Atual`,
        deltaGood: gapP.vsPrivateLabel <= gapA.vsPrivateLabel,
        target: "≤ +5%",
        status: level(gapP.vsPrivateLabel <= 0.05, gapP.vsPrivateLabel <= 0.08),
        spark: series((t) => priceGap(t).vsPrivateLabel * 100),
        sparkRef: series((t) => priceGap(t).vsPrivateLabel * 100, "current"),
      },
      {
        label: "Custo do café vs. mercado",
        question: "Eficiência de compra (negativo = abaixo do spot)",
        value: fmtPct(coffeeP, 1, true),
        delta: `${fmtPP((coffeeP - coffeeA) * 100)} vs. Atual`,
        deltaGood: coffeeP <= coffeeA,
        target: "≤ −5%",
        status: level(coffeeP <= -0.05, coffeeP <= 0),
        spark: timeline.map((pt) => coffeeCostVsMarket(aggregate(pt.proposed.cells, filter), pt.coffeeIncrease) * 100),
        sparkRef: timeline.map((pt) => coffeeCostVsMarket(aggregate(pt.current.cells, filter), pt.coffeeIncrease) * 100),
      },
      {
        label: "% do café com hedge",
        question: "Exposição ao risco de novos choques",
        value: fmtPct(levers.hedgePct, 0),
        delta: `${fmtPP(levers.hedgePct * 100, 0)} vs. Atual`,
        deltaGood: levers.hedgePct > 0,
        target: "≥ 40% do volume projetado",
        status: level(levers.hedgePct >= 0.4, levers.hedgePct >= 0.2),
        spark: timeline.map((pt) => pt.proposed.levers.hedgePct * 100),
      },
      {
        label: "ROI promocional",
        question: "Se a verba com o varejo gera retorno",
        value: fmtMultiple(roiP),
        delta: `${fmtNumber(roiP - roiA, 2, true)}x vs. Atual`,
        deltaGood: roiP >= roiA,
        target: "≥ 1,00x",
        status: level(roiP >= 1, roiP >= 0.9),
        spark: timeline.map((pt) => promoRoi(pt.proposed.levers)),
      },
    ];
  }, [current, proposed, timeline, levers, filter, hasData]);

  const elasticities = useMemo(
    () =>
      SEGMENTS.map((seg) => {
        const t = aggregate(current.cells, { ...filter, segment: seg.id });
        const e = t.kg0 ? Math.log(1 + t.volumeChange) / Math.log(1 + t.priceChange) : 0;
        return { id: seg.id, label: seg.label, e, has: t.kg0 > 0 };
      }),
    [current, filter],
  );
  const maxE = Math.max(...elasticities.map((x) => Math.abs(x.e)), 0.01);

  const rows = useMemo(() => skuTable(current, proposed, filter), [current, proposed, filter]);

  return (
    <Section
      id="kpis"
      eyebrow="Pilar 04 · Dashboard"
      title="Indicadores para decidir e corrigir rápido"
      lead="Painel no formato que alimentaria o comitê mensal. Valores do cenário Proposto, com comparação ao Atual, meta e semáforo. Sparklines: 24 meses (linha tracejada = Atual)."
      tone="cream"
    >
      <Reveal>
        <div className="card mb-6 flex flex-wrap items-end gap-4 p-4 sm:p-5">
          <Select
            label="Canal"
            value={channel}
            onChange={setChannel}
            options={[{ value: "all", label: "Todos os canais" }, ...CHANNELS.map((c) => ({ value: c.id, label: c.label }))]}
          />
          <Select
            label="Segmento"
            value={segment}
            onChange={setSegment}
            options={[{ value: "all", label: "Todos os segmentos" }, ...SEGMENTS.map((s) => ({ value: s.id, label: s.label }))]}
          />
          <Select
            label="Região"
            value={region}
            onChange={setRegion}
            options={[{ value: "all", label: "Brasil" }, ...REGIONS.map((r) => ({ value: r.id, label: r.label }))]}
          />
          {(segment !== "all" || channel !== "all" || region !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSegment("all");
                setChannel("all");
                setRegion("all");
              }}
              className="rounded-full px-3 py-2 text-sm font-medium text-wine-600 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </Reveal>

      {!hasData ? (
        <div className="card p-10 text-center text-coffee-600">
          Sem dados para esta combinação: no modelo, o canal Cápsulas vende apenas o segmento Cápsulas.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((k, i) => (
              <Reveal key={k.label} delay={(i % 3) * 0.05}>
                <article className="card flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-sans text-sm font-semibold text-coffee-800">{k.label}</h3>
                      <p className="text-[11px] text-coffee-500">{k.question}</p>
                    </div>
                    <StatusPill level={k.status} />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="tabular text-3xl font-semibold tracking-tight text-coffee-800">{k.value}</p>
                      <p className={`tabular mt-1 text-xs font-semibold ${k.deltaGood ? "text-ok-700" : "text-bad-700"}`}>{k.delta}</p>
                    </div>
                    <Sparkline values={k.spark} reference={k.sparkRef} label={`Tendência de ${k.label} em 24 meses`} />
                  </div>
                  <p className="mt-auto pt-4 text-[11px] text-coffee-500">
                    <span className="font-semibold text-coffee-600">Meta:</span> {k.target}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_2fr] [&>*]:min-w-0">
            <Reveal>
              <article className="card h-full p-5">
                <h3 className="font-sans text-sm font-semibold text-coffee-800">Elasticidade preço-volume por marca</h3>
                <p className="text-[11px] text-coffee-500">Onde cabe repasse e onde ele destrói volume (estimada no cenário Atual)</p>
                <ul className="mt-5 space-y-4">
                  {elasticities.map((x) => (
                    <li key={x.id}>
                      <div className="flex justify-between text-sm">
                        <span className="text-coffee-700">{x.label}</span>
                        <span className="tabular font-semibold text-coffee-800">{x.has ? fmtNumber(x.e, 2) : "—"}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-coffee-100">
                        <div
                          className="h-2 rounded-full bg-wine-600 transition-[width] duration-500"
                          style={{ width: x.has ? `${(Math.abs(x.e) / maxE) * 100}%` : 0 }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[11px] leading-relaxed text-coffee-500">
                  Elasticidade = ln(1 + Δvolume) / ln(1 + Δpreço). Quanto mais longa a barra, mais o volume reage ao preço.
                </p>
              </article>
            </Reveal>

            <Reveal delay={0.05}>
              <article className="card overflow-hidden">
                <div className="p-5 pb-3">
                  <h3 className="font-sans text-sm font-semibold text-coffee-800">Margem bruta por SKU (fictício)</h3>
                  <p className="text-[11px] text-coffee-500">Receita líquida do Proposto em R$ mi ilustrativos · margens em %</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm [&_td]:whitespace-nowrap [&_thead_th]:whitespace-nowrap">
                    <caption className="sr-only">Margem bruta por SKU fictício: pré-alta, Atual e Proposto</caption>
                    <thead className="bg-coffee-50 text-xs text-coffee-500">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left font-semibold">SKU</th>
                        <th scope="col" className="px-3 py-2 text-left font-semibold">Canal</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Receita</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Pré-alta</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Atual</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold text-wine-600">Proposto</th>
                        <th scope="col" className="px-4 py-2 text-right font-semibold">Δ vs. Atual</th>
                      </tr>
                    </thead>
                    <tbody className="tabular divide-y divide-coffee-100">
                      {rows.map((r) => {
                        const d = (r.grossMarginProposed - r.grossMarginCurrent) * 100;
                        return (
                          <tr key={r.id} className="hover:bg-cream-200/50">
                            <th scope="row" className="px-4 py-2.5 text-left font-medium text-coffee-800">
                              {r.name}
                              <span className="block text-[11px] font-normal text-coffee-500">
                                {SEGMENTS.find((s) => s.id === r.segment)!.label} · {r.id}
                              </span>
                            </th>
                            <td className="px-3 py-2.5 text-coffee-600">{CHANNELS.find((c) => c.id === r.channel)!.label}</td>
                            <td className="px-3 py-2.5 text-right text-coffee-700">{fmtBRL(r.netRevenue)}</td>
                            <td className="px-3 py-2.5 text-right text-coffee-500">{fmtPct(r.grossMargin0, 1)}</td>
                            <td className="px-3 py-2.5 text-right text-coffee-600">{fmtPct(r.grossMarginCurrent, 1)}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-wine-600">{fmtPct(r.grossMarginProposed, 1)}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  d >= 0 ? "bg-ok-50 text-ok-700" : "bg-bad-50 text-bad-700"
                                }`}
                              >
                                {fmtPP(d)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="px-5 py-3 text-[11px] text-coffee-500">
                  Margens negativas vs. Atual na Entrada são intencionais: a linha de entrada abre mão de margem para defender volume e share.
                </p>
              </article>
            </Reveal>
          </div>
        </>
      )}
    </Section>
  );
}
