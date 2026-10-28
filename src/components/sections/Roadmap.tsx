"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Reveal, Section } from "@/components/ui/Section";
import { fmtPP, fmtPct } from "@/lib/format";

const PHASES = [
  {
    n: 1,
    window: "0–6 meses",
    title: "Estancar e organizar",
    month: 6,
    impact: "Desaceleração da perda de margem e de volume na entrada.",
    items: [
      "Instalar o comitê mensal de margem",
      "Ganhos de eficiência operacional",
      "Revisão de blend nas linhas de entrada",
      "Primeiros ajustes de embalagem e preço",
      "Revisão de promoções e piloto de plano conjunto com redes-chave",
    ],
  },
  {
    n: 2,
    window: "6–18 meses",
    title: "Reestruturar",
    month: 18,
    impact: "Custo mais previsível e recuperação gradual de margem com volume preservado.",
    items: [
      "Política formal de hedge",
      "Contratos de longo prazo e compra direta com cooperativas",
      "Papéis de marca e regras de repasse por segmento",
      "Preço diferenciado por canal",
      "Metas compartilhadas de margem de contribuição",
    ],
  },
  {
    n: 3,
    window: "18+ meses",
    title: "Diferenciar",
    month: 24,
    impact: "Margem menos dependente de preço e mais resiliente a novos choques de custo.",
    items: [
      "Ampliar o mix de valor agregado (gourmet, origem, cápsulas)",
      "Originação direta em escala",
      "Gestão de receita contínua e baseada em dados",
      "Planos de negócio conjuntos com o varejo como padrão",
    ],
  },
];

export function Roadmap() {
  const { timeline } = useScenario();
  const reduce = useReducedMotion();

  return (
    <Section
      id="roadmap"
      eyebrow="Roadmap de implementação"
      title="Do alívio imediato à proteção estrutural"
      lead="Cada fase traz o marco simulado ao final da janela: margem bruta e volume do Proposto, e a diferença para o Atual no mesmo mês."
    >
      <div className="relative">
        <div aria-hidden className="absolute left-0 right-0 top-6 hidden h-0.5 bg-coffee-100 md:block">
          <motion.div
            className="h-full origin-left bg-wine-600"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <ol className="grid gap-6 md:grid-cols-3">
          {PHASES.map((ph, i) => {
            const pt = timeline[ph.month - 1];
            const p = pt.proposed.totals;
            const a = pt.current.totals;
            return (
              <li key={ph.n} className="relative">
                <Reveal delay={0.15 + i * 0.15}>
                  <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full border-4 border-cream-100 bg-wine-600 font-serif text-lg font-semibold text-cream-50 shadow-soft">
                    {ph.n}
                  </span>
                  <article className="card mt-5 p-6">
                    <p className="eyebrow">{ph.window}</p>
                    <h3 className="mt-2 text-2xl">{ph.title}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-coffee-700">
                      {ph.items.map((it) => (
                        <li key={it} className="flex gap-2">
                          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel-400" />
                          {it}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 rounded-xl bg-cream-200/80 p-4">
                      <p className="text-xs font-semibold text-coffee-600">Impacto esperado</p>
                      <p className="mt-1 text-sm text-coffee-700">{ph.impact}</p>
                      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-coffee-100 pt-3">
                        <div>
                          <dt className="text-[11px] text-coffee-500">Margem · mês {ph.month}</dt>
                          <dd className="tabular text-lg font-semibold text-wine-600">{fmtPct(p.grossMargin, 1)}</dd>
                          <dd className="tabular text-[11px] text-coffee-500">{fmtPP((p.grossMargin - a.grossMargin) * 100)} vs. Atual</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-coffee-500">Volume · mês {ph.month}</dt>
                          <dd className="tabular text-lg font-semibold text-wine-600">{fmtPct(p.volumeChange, 1, true)}</dd>
                          <dd className="tabular text-[11px] text-coffee-500">{fmtPP((p.volumeChange - a.volumeChange) * 100)} vs. Atual</dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-8 text-xs text-coffee-500">
        Marcos simulados com o cenário de custo volátil de 24 meses; metas reais devem ser calibradas com dados internos.
      </p>
    </Section>
  );
}
