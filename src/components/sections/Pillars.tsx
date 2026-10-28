"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal, Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Status";
import { promoRoi } from "@/lib/simulation";
import { fmtBRL, fmtMultiple, fmtPP, fmtPct } from "@/lib/format";

interface Pillar {
  n: string;
  title: string;
  icon: IconName;
  summary: string;
  what: string[];
  why: string;
  owner: string;
  horizon: { label: string; variant: "quick" | "structural" }[];
}

const PILLARS: Pillar[] = [
  {
    n: "01",
    title: "Custo e suprimento",
    icon: "shield",
    summary: "Reduzir e estabilizar o custo do grão.",
    what: [
      "Hedge e contratos futuros, com política formal de cobertura.",
      "Compra direta de cooperativas e contratos de longo prazo.",
      "Otimização de blend arábica/conilon nas linhas de entrada.",
      "Eficiência operacional: torra, embalagem, logística e energia.",
    ],
    why: "Se o custo do grão oscila menos e pesa menos, a pressão por repasse cai na origem. O hedge não elimina a alta, mas dá previsibilidade para planejar preço e promoções.",
    owner: "Compras e Operações, com Finanças (política de hedge)",
    horizon: [
      { label: "Ganho rápido: blend e eficiência", variant: "quick" },
      { label: "Estrutural: hedge e compra direta", variant: "structural" },
    ],
  },
  {
    n: "02",
    title: "Portfólio e preço",
    icon: "layers",
    summary: "Defender volume na entrada e capturar margem no topo.",
    what: [
      "Papel por marca: entrada defende volume; premium, gourmet e cápsulas carregam margem.",
      "Arquitetura de embalagens: pacotes menores e refil mantêm pontos de preço.",
      "Preço diferenciado por canal: varejo, food service e cápsulas.",
      "Verba promocional com plano conjunto e contrapartidas das redes.",
    ],
    why: "A elasticidade não é igual entre marcas. Concentrar o repasse onde o consumidor é menos sensível protege o volume onde ele é mais sensível.",
    owner: "Comercial e Marketing (revenue management)",
    horizon: [
      { label: "Ganho rápido: embalagens e promoções", variant: "quick" },
      { label: "Estrutural: papéis de marca e mix", variant: "structural" },
    ],
  },
  {
    n: "03",
    title: "Alinhamento",
    icon: "users",
    summary: "Uma única agenda de margem.",
    what: [
      "Comitê mensal de margem: Compras, Comercial, Marketing e Finanças.",
      "Meta compartilhada de margem de contribuição no lugar de metas isoladas.",
      "Regras de repasse por segmento, definidas antes da crise.",
    ],
    why: "Metas isoladas criam conflito: Compras otimiza custo, Comercial persegue volume, Marketing defende a marca. A margem só melhora quando as decisões são tomadas juntas.",
    owner: "Diretoria Financeira (patrocínio) e Diretoria Comercial",
    horizon: [{ label: "Ganho rápido: instalar o comitê", variant: "quick" }],
  },
  {
    n: "04",
    title: "KPIs",
    icon: "chart",
    summary: "Medir para corrigir rápido.",
    what: [
      "Margem bruta por SKU e canal.",
      "Elasticidade preço-volume por marca.",
      "Volume e market share por categoria e região.",
      "Gap de preço vs. concorrentes e marcas próprias.",
      "Custo médio do café vs. mercado e % com hedge.",
      "ROI promocional por cliente e por ação.",
    ],
    why: "Os KPIs alimentam o comitê. Sem medição por SKU, canal e região, o repasse volta a ser linear por falta de informação.",
    owner: "Finanças / FP&A e Inteligência de Mercado",
    horizon: [{ label: "Estrutural: gestão de receita contínua", variant: "structural" }],
  },
];

export function Pillars() {
  const { bridge, levers } = useScenario();
  const [open, setOpen] = useState<string | null>("01");
  const step = (id: string) => bridge.steps.find((s) => s.id === id)!;
  const mixPreco = {
    marginPP: step("mix").marginPP + step("preco").marginPP,
    volumePP: step("mix").volumePP + step("preco").volumePP,
    gp: step("mix").grossProfit + step("preco").grossProfit,
  };

  const impact: Record<string, { headline: string; unit: string; detail: string }> = {
    "01": {
      headline: fmtPP(step("custo").marginPP),
      unit: "margem bruta",
      detail: `de margem bruta e ${fmtBRL(step("custo").grossProfit, 0, true)} de lucro bruto vs. Atual. Café efetivo ${fmtPct(bridge.proposed.coffeeCostChange, 1, true)} vs. +40% no spot.`,
    },
    "02": {
      headline: fmtPP(mixPreco.volumePP),
      unit: "volume",
      detail: `de volume e ${fmtPP(mixPreco.marginPP)} de margem (mix + preço segmentado), ${fmtBRL(mixPreco.gp, 0, true)} de lucro bruto.`,
    },
    "03": {
      headline: fmtPP(step("execucao").marginPP),
      unit: "margem bruta",
      detail: `de margem via verba promocional com contrapartida (${fmtBRL(step("execucao").grossProfit, 0, true)}). Habilita a captura das demais alavancas.`,
    },
    "04": {
      headline: fmtMultiple(promoRoi(levers)),
      unit: "ROI promocional",
      detail: `de ROI promocional simulado (vs. ${fmtMultiple(promoRoi({ ...levers, promoOptimizationPct: 0 }))} hoje). Habilitador: sem efeito direto no modelo, garante correção rápida de rota.`,
    },
  };

  return (
    <Section
      id="pilares"
      eyebrow="Tese central"
      title="Quatro pilares que se reforçam"
      lead="Custo libera espaço no preço, mix compensa o repasse menor, alinhamento e KPIs garantem a execução. Os impactos abaixo acompanham as alavancas do simulador."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {PILLARS.map((p, i) => {
          const isOpen = open === p.n;
          return (
            <Reveal key={p.n} delay={i * 0.06}>
              <motion.article layout className={`card overflow-hidden transition-shadow ${isOpen ? "shadow-lift" : "hover:shadow-lift"}`}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`pilar-${p.n}`}
                    onClick={() => setOpen(isOpen ? null : p.n)}
                    className="flex w-full items-start gap-4 p-6 text-left"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-wine-600 text-cream-50">
                      <Icon name={p.icon} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-xs font-semibold tracking-widest text-caramel-600">PILAR {p.n}</span>
                      <span className="mt-0.5 block font-serif text-xl text-coffee-800">{p.title}</span>
                      <span className="mt-1 block font-sans text-sm text-coffee-600">{p.summary}</span>
                    </span>
                    <span className="text-right">
                      <span className="tabular block font-sans text-lg font-semibold text-wine-600">{impact[p.n].headline}</span>
                      <span className="block font-sans text-[11px] text-coffee-500">{impact[p.n].unit} · simulado</span>
                    </span>
                    <motion.span aria-hidden animate={{ rotate: isOpen ? 45 : 0 }} className="mt-1 font-sans text-2xl leading-none text-coffee-400">
                      +
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`pilar-${p.n}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <dl className="grid gap-5 border-t border-coffee-100 px-6 pb-6 pt-5 text-sm">
                        <div>
                          <dt className="eyebrow">O quê</dt>
                          <dd>
                            <ul className="mt-2 space-y-1.5 text-coffee-700">
                              {p.what.map((w) => (
                                <li key={w} className="flex gap-2">
                                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel-400" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                        <div>
                          <dt className="eyebrow">Por quê</dt>
                          <dd className="mt-2 leading-relaxed text-coffee-700">{p.why}</dd>
                        </div>
                        <div className="rounded-xl bg-wine-50/70 p-4">
                          <dt className="eyebrow">Impacto simulado</dt>
                          <dd className="mt-1 text-coffee-700">
                            <strong className="tabular text-wine-700">{impact[p.n].headline}</strong> {impact[p.n].detail}
                          </dd>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <dt className="eyebrow">Dono da área</dt>
                            <dd className="mt-2 text-coffee-700">{p.owner}</dd>
                          </div>
                          <div>
                            <dt className="eyebrow">Quick win ou estrutural</dt>
                            <dd className="mt-2 flex flex-wrap gap-2">
                              {p.horizon.map((h) => (
                                <Tag key={h.label} variant={h.variant}>
                                  {h.label}
                                </Tag>
                              ))}
                            </dd>
                          </div>
                        </div>
                      </dl>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
