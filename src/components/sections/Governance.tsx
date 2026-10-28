"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { Reveal, Section } from "@/components/ui/Section";
import { fmtPct } from "@/lib/format";

const AREAS = [
  { id: "compras", label: "Compras", role: "Custo e risco (cobertura)", angle: -90 },
  { id: "comercial", label: "Comercial", role: "Volume com margem, não volume a qualquer preço", angle: 0 },
  { id: "marketing", label: "Marketing", role: "Mix e valor da marca", angle: 90 },
  { id: "financas", label: "Finanças", role: "Margem de contribuição e cenários", angle: 180 },
];

const CYCLE = [
  { n: 1, title: "Cenário de custo", detail: "Curva do café, posição de hedge e cobertura.", lead: "compras" },
  { n: 2, title: "Leitura dos KPIs", detail: "Margem por SKU, canal e cliente; share e gap de preço.", lead: "financas" },
  { n: 3, title: "Decisão de preço, mix e promoção", detail: "Repasse por segmento, formatos e verba do ciclo.", lead: "comercial" },
  { n: 4, title: "Execução e acompanhamento", detail: "Plano com as redes, sortimento e ROI por ação.", lead: "marketing" },
];

export function Governance() {
  const { levers } = useScenario();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => setStep((s) => (s + 1) % CYCLE.length), 2600);
    return () => clearInterval(t);
  }, [paused, reduce]);

  const active = CYCLE[step];
  const R = 144;

  const rules = [
    {
      segment: "Entrada",
      rule: "Repasse mínimo ou escalonado; priorizar blend e embalagem.",
      value: levers.passThrough.entrada,
    },
    {
      segment: "Tradicional",
      rule: "Repasse parcial, limitado pelo gap de preço vs. concorrentes.",
      value: levers.passThrough.tradicional,
    },
    {
      segment: "Premium / Cápsulas",
      rule: "Repasse maior, sustentado por valor percebido e recorrência.",
      value: Math.max(levers.passThrough.premium, levers.passThrough.capsulas),
      min: Math.min(levers.passThrough.premium, levers.passThrough.capsulas),
    },
  ];

  return (
    <Section
      id="governanca"
      eyebrow="Pilar 03 · Governança"
      title="Uma só agenda de margem, com ritmo e regras claras"
      lead="Rito mensal no estilo S&OP. Decisão integrada evita que cada área resolva a margem às custas da outra."
      tone="dark"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
        <Reveal>
          <div
            className="relative mx-auto aspect-square w-full max-w-[440px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <svg viewBox="-200 -200 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
              <circle r={R} fill="none" stroke="rgba(246,239,230,0.15)" strokeWidth={2} strokeDasharray="4 6" />
              <motion.circle
                r={R}
                fill="none"
                stroke="#C68B59"
                strokeWidth={3}
                strokeLinecap="round"
                pathLength={1}
                initial={false}
                animate={{ pathLength: (step + 1) / CYCLE.length }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                transform="rotate(-90)"
              />
            </svg>

            <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-wine-600 p-3 text-center shadow-lift sm:h-32 sm:w-32">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-caramel-200">Comitê mensal</p>
                <p className="mt-1 font-serif text-lg leading-tight text-cream-50">de margem</p>
              </div>
            </div>

            {AREAS.map((a) => {
              const rad = (a.angle * Math.PI) / 180;
              const x = 50 + (Math.cos(rad) * R * 100) / 400;
              const y = 50 + (Math.sin(rad) * R * 100) / 400;
              const isLead = a.id === active.lead;
              return (
                <motion.div
                  key={a.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  animate={{ scale: isLead ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                >
                  <div
                    className={`w-28 rounded-2xl border px-2.5 py-2 text-center transition-colors sm:w-32 ${
                      isLead ? "border-caramel-400 bg-cream-50 text-coffee-800" : "border-cream-200/20 bg-coffee-700 text-cream-100"
                    }`}
                  >
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className={`mt-0.5 text-[10px] leading-tight ${isLead ? "text-coffee-600" : "text-cream-200/70"}`}>{a.role}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Reveal>

        <div>
          <ol className="space-y-3" aria-label="Ciclo mensal do comitê">
            {CYCLE.map((c, i) => {
              const isActive = i === step;
              return (
                <li key={c.n}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(i);
                      setPaused(true);
                    }}
                    aria-current={isActive ? "step" : undefined}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors ${
                      isActive ? "border-caramel-400 bg-coffee-700" : "border-cream-200/10 hover:bg-coffee-700/60"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                        isActive ? "bg-caramel-400 text-coffee-900" : "bg-coffee-600 text-cream-100"
                      }`}
                    >
                      {c.n}
                    </span>
                    <span>
                      <span className="block font-semibold text-cream-50">{c.title}</span>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.span
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="block overflow-hidden text-sm text-cream-200/80"
                          >
                            {c.detail}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-cream-200/60">
            Gatilhos de revisão (faixas de variação de custo, gap de preço, perda de share) são definidos e calibrados pelo
            próprio comitê.
          </p>
        </div>
      </div>

      <Reveal delay={0.1}>
        <div className="mt-14">
          <h3 className="text-xl text-cream-50">Regras de repasse por segmento</h3>
          <p className="mt-1 text-sm text-cream-200/70">Definidas antes da crise. Os percentuais refletem o cenário em simulação.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {rules.map((r) => (
              <div key={r.segment} className="rounded-2xl border border-cream-200/15 bg-coffee-700/60 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-cream-50">{r.segment}</p>
                  <p className="tabular text-2xl font-semibold text-caramel-200">
                    {r.min !== undefined && r.min !== r.value ? `${fmtPct(r.min, 0, true)} a ${fmtPct(r.value, 0, true)}` : fmtPct(r.value, 0, true)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-cream-200/80">{r.rule}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
