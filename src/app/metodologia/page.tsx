import type { Metadata } from "next";
import Link from "next/link";
import {
  BASE,
  CASE_FACTS,
  CHANNELS,
  LEVER_EFFECTS,
  PROPOSED_LEVERS,
  REGIONS,
  SEGMENTS,
} from "@/data/model";
import { FORMULAS, LIMITATIONS } from "@/lib/methodology";
import { CALIBRATION, buildBaseCells, simulate, simulateCurrent } from "@/lib/simulation";
import { fmtBRL, fmtNumber, fmtPP, fmtPct } from "@/lib/format";

export const metadata: Metadata = {
  title: "Metodologia e premissas",
  description: "Hipóteses, fórmulas e calibração do simulador do case 3corações. Todos os dados são simulados.",
};

export default function MethodologyPage() {
  const current = simulateCurrent().totals;
  const proposed = simulate(PROPOSED_LEVERS).totals;
  const cells = buildBaseCells(CALIBRATION.coffeeShareScale).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
      <Link href="/" className="text-sm font-medium text-wine-600 hover:underline">
        ← Voltar ao case
      </Link>
      <p className="eyebrow mt-8">Transparência</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Metodologia e premissas</h1>
      <div className="mt-6 rounded-2xl border border-caramel-200 bg-caramel-100/50 p-5 text-coffee-800">
        <p className="font-semibold">Todos os números deste site são simulados.</p>
        <p className="mt-1 text-sm leading-relaxed text-coffee-700">
          Este é um estudo de caso e simulador de autoria de Henrique Miguel, não um site oficial do Grupo 3corações.
          Os valores foram construídos a partir das premissas do enunciado do case (também fictícias) e não devem ser
          lidos como dados reais da empresa. Valores em R$ são ilustrativos (R$ milhões/ano).
        </p>
      </div>

      <Block title="1. Calibração: o cenário Atual reproduz o case">
        <p>
          Duas grandezas são resolvidas numericamente (bisseção) sempre que as premissas mudam, para que o cenário
          Atual (repasse uniforme de {fmtPct(CASE_FACTS.uniformPriceIncrease, 0)}) entregue os números do enunciado.
        </p>
        <Table
          head={["Grandeza", "Alvo do case", "Simulado", "Parâmetro calibrado"]}
          rows={[
            ["Volume (kg)", fmtPct(CASE_FACTS.volumeChange, 1, true), fmtPct(current.volumeChange, 2, true), `escala de elasticidade k = ${fmtNumber(CALIBRATION.elasticityScale, 3)}`],
            ["Margem bruta", fmtPP(CASE_FACTS.grossMarginChangePP, 1), fmtPP(current.grossMarginChangePP, 2), `peso do café no CPV × ${fmtNumber(CALIBRATION.coffeeShareScale, 3)}`],
            ["Preço médio", fmtPct(CASE_FACTS.uniformPriceIncrease, 0, true), fmtPct(current.priceChange, 1, true), "entrada direta"],
            ["Custo do café verde", fmtPct(CASE_FACTS.coffeeCostIncrease, 0, true), fmtPct(current.coffeeCostChange, 1, true), "entrada direta"],
          ]}
        />
        <p className="text-sm text-coffee-600">
          Resultado-base: margem bruta pré-alta de {fmtPct(current.grossMargin0, 1)} → Atual {fmtPct(current.grossMargin, 1)} → Proposto
          padrão {fmtPct(proposed.grossMargin, 1)}. O modelo tem {cells} células (segmento × canal × região). A calibração implica
          que o café verde representa a maior parte do CPV nas linhas de entrada e tradicional, coerente com café torrado e moído.
        </p>
      </Block>

      <Block title="2. Base econômica">
        <Table
          head={["Premissa", "Valor"]}
          rows={[
            ["Receita líquida anual pré-alta", `${fmtBRL(BASE.netRevenue)} (ilustrativo)`],
            ["Parcela fixa do CPV", fmtPct(BASE.fixedCogsShare, 0)],
            ["Variação de volume da categoria", fmtPct(BASE.marketVolumeChange, 0, true)],
            ["Aumento de preço dos concorrentes nacionais", fmtPct(BASE.competitorPriceIncrease, 0, true)],
            ["Aumento de preço de marcas próprias e regionais", fmtPct(BASE.privateLabelPriceIncrease, 0, true)],
            ["Pressão extra de verba no Varejo (pós-alta)", fmtPP(BASE.retailPromoPressurePP, 1)],
            ["ROI promocional atual", `${fmtNumber(BASE.promoRoiBase, 2)}x`],
          ]}
        />
      </Block>

      <Block title="3. Segmentos de marca">
        <Table
          head={["Segmento", "Receita", "Preço/kg (índice)", "Margem pré-alta", "Elasticidade relativa", "Peso do café", "Papel"]}
          rows={SEGMENTS.map((s) => [
            s.label,
            fmtPct(s.revenueShare, 0),
            fmtNumber(s.pricePerKgIndex, 2),
            fmtPct(1 - s.cogsRatio, 0),
            fmtNumber(s.elasticity, 2),
            fmtNumber(s.coffeeWeight, 2),
            s.role,
          ])}
        />
      </Block>

      <Block title="4. Canais">
        <Table
          head={["Canal", "Verba promocional", "Multiplicador de elasticidade", "Ajuste de CPV", "Descrição"]}
          rows={CHANNELS.map((c) => [c.label, fmtPct(c.promoRate, 0), fmtNumber(c.elasticityMultiplier, 2), fmtPP(c.cogsAdjustmentPP, 1), c.description])}
        />
      </Block>

      <Block title="5. Regiões">
        <Table
          head={["Região", "Participação na receita", "Market share pré-alta", "Pressão de marcas próprias", "Leitura"]}
          rows={REGIONS.map((r) => [r.label, fmtPct(r.revenueShare, 0), fmtPct(r.marketShare, 0), fmtPct(r.privateLabelPressure, 0), r.note])}
        />
      </Block>

      <Block title="6. Efeito de cada alavanca">
        <Table
          head={["Alavanca", "Hipótese", "Padrão do Proposto"]}
          rows={[
            ["Hedge / contratos futuros", `Volume travado com alta média de ${fmtPct(LEVER_EFFECTS.hedgeLockedIncrease, 0, true)} (vs. ${fmtPct(CASE_FACTS.coffeeCostIncrease, 0, true)} no spot)`, fmtPct(PROPOSED_LEVERS.hedgePct, 0)],
            ["Compra direta", `${fmtPct(LEVER_EFFECTS.directSourcingDiscount, 0)} de desconto vs. mercado no volume originado direto`, fmtPct(PROPOSED_LEVERS.directSourcingPct, 0)],
            ["Blend arábica/conilon", `Conilon ${fmtPct(LEVER_EFFECTS.conilonDiscount, 0)} mais barato; efeito integral na Entrada, 50% na Tradicional`, `${fmtNumber(PROPOSED_LEVERS.blendShiftPP, 0)} p.p.`],
            ["Eficiência operacional", "Reduz custo de conversão (variável não-café e fixo)", fmtPct(PROPOSED_LEVERS.efficiencyPct, 1)],
            ["Mix premium", "Migração de kg da base para premium e cápsulas", `${fmtNumber(PROPOSED_LEVERS.premiumMixPP, 2)} p.p.`],
            ["Embalagens menores", `Preço/kg ${fmtPct(LEVER_EFFECTS.smallPackPricePerKgUplift, 0, true)}, custo ${fmtPct(LEVER_EFFECTS.smallPackCostUplift, 0, true)}, elasticidade × ${fmtNumber(LEVER_EFFECTS.smallPackElasticityFactor, 1)}`, fmtPct(PROPOSED_LEVERS.smallPackPct, 0)],
            ["Repasse por segmento", "Substitui os 25% uniformes", SEGMENTS.map((s) => `${s.label} ${fmtPct(PROPOSED_LEVERS.passThrough[s.id], 0, true)}`).join(" · ")],
            ["Verba com plano conjunto", "Reduz a verba linear do Varejo em troca de contrapartidas", fmtPct(PROPOSED_LEVERS.promoOptimizationPct, 0)],
          ]}
        />
      </Block>

      <Block title="7. Fórmulas">
        <ul className="space-y-4">
          {FORMULAS.map((f) => (
            <li key={f.title} className="card p-5">
              <p className="font-semibold text-coffee-800">{f.title}</p>
              <p className="mt-2 overflow-x-auto rounded-lg bg-coffee-50 px-3 py-2 font-mono text-[13px] text-coffee-800">{f.formula}</p>
              <p className="mt-2 text-sm text-coffee-600">{f.note}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="8. Limitações">
        <ul className="list-disc space-y-2 pl-5 text-coffee-700">
          {LIMITATIONS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Block>

      <Block title="9. Como editar">
        <p>
          Todas as premissas estão em <code className="rounded bg-coffee-50 px-1.5 py-0.5 text-sm">src/data/model.ts</code>. As
          fórmulas ficam em <code className="rounded bg-coffee-50 px-1.5 py-0.5 text-sm">src/lib/simulation.ts</code>, com testes em{" "}
          <code className="rounded bg-coffee-50 px-1.5 py-0.5 text-sm">src/lib/simulation.test.ts</code> que garantem que o cenário Atual
          continua reproduzindo o case.
        </p>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14 space-y-4 leading-relaxed text-coffee-700">
      <h2 className="text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-coffee-50 text-xs text-coffee-500">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular divide-y divide-coffee-100">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-4 py-2.5 text-left font-medium text-coffee-800">
                    {c}
                  </th>
                ) : (
                  <td key={j} className="px-4 py-2.5 text-coffee-700">
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
