"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CASE_FACTS } from "@/data/model";
import { SITE } from "@/data/site";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { fmtNumber } from "@/lib/format";

const FACTS = [
  {
    value: CASE_FACTS.coffeeCostIncrease * 100,
    format: (v: number) => `${fmtNumber(v, 0, true)}%`,
    label: "Custo do café verde em 12 meses",
    tone: "text-wine-600",
  },
  {
    value: CASE_FACTS.uniformPriceIncrease * 100,
    format: (v: number) => `${fmtNumber(v, 0, true)}%`,
    label: "Repassado ao preço de venda",
    tone: "text-coffee-800",
  },
  {
    value: CASE_FACTS.volumeChange * 100,
    format: (v: number) => `${fmtNumber(v, 0, true)}%`,
    label: "Queda de volume",
    tone: "text-bad-600",
  },
  {
    value: CASE_FACTS.grossMarginChangePP,
    format: (v: number) => `${fmtNumber(v, 0, true)} p.p.`,
    label: "Margem bruta",
    tone: "text-bad-600",
  },
];

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="hero-title" className="relative -mt-16 overflow-hidden pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_-10%,rgba(198,139,89,0.28),transparent),radial-gradient(40rem_24rem_at_-10%_30%,rgba(122,31,43,0.10),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="eyebrow"
        >
          Estudo de caso e simulador · custo do café × limite de repasse
        </motion.p>
        <motion.h1
          id="hero-title"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-4xl text-4xl leading-[1.08] sm:text-6xl"
        >
          Como proteger margem e resultado{" "}
          <span className="italic text-wine-600">sem depender continuamente</span> de aumento de
          preço?
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-coffee-600"
        >
          O repasse uniforme chegou ao limite. A proposta: gerir a margem de forma segmentada e
          integrada, em que{" "}
          <strong className="font-semibold text-coffee-800">
            Margem = Custo + Mix + Preço + Execução
          </strong>
          .
        </motion.p>

        <dl className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <motion.div
              key={f.label}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="card p-5 sm:p-6"
            >
              <dt className="text-sm leading-snug text-coffee-500">{f.label}</dt>
              <dd className={`mt-2 text-4xl font-semibold tracking-tight sm:text-5xl ${f.tone}`}>
                <AnimatedNumber value={f.value} format={f.format} fromZero duration={1.4} />
              </dd>
            </motion.div>
          ))}
        </dl>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <a
            href="#simulador"
            className="inline-flex items-center gap-2 rounded-full bg-wine-600 px-6 py-3 text-base font-semibold text-cream-50 shadow-lift transition hover:bg-wine-700"
          >
            Ver simulação
            <span aria-hidden>→</span>
          </a>
          <a
            href="#diagnostico"
            className="rounded-full px-5 py-3 text-base font-medium text-coffee-700 underline-offset-4 hover:underline"
          >
            Entender o diagnóstico
          </a>
          <a
            href={SITE.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-coffee-200 px-5 py-2.5 text-base font-medium text-coffee-700 transition hover:border-wine-600 hover:text-wine-600"
          >
            <span aria-hidden>▶</span> Assistir ao vídeo
          </a>
          <p className="w-full text-xs text-coffee-500 sm:w-auto">
            Números fictícios, conforme o enunciado do case.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
