"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useScenario } from "@/components/scenario/ScenarioContext";
import { fmtBRL, fmtPP, fmtPct } from "@/lib/format";

/** Resumo fixo no rodapé (só mobile) enquanto o painel de alavancas está visível. */
export function MobileResultBar({ visible }: { visible: boolean }) {
  const { current, proposed } = useScenario();
  const a = current.totals;
  const p = proposed.totals;
  const items = [
    { label: "Margem", value: fmtPct(p.grossMargin, 1), delta: fmtPP((p.grossMargin - a.grossMargin) * 100) },
    { label: "Volume", value: fmtPct(p.volumeChange, 1, true), delta: fmtPP((p.volumeChange - a.volumeChange) * 100) },
    { label: "Lucro bruto", value: fmtBRL(p.grossProfit), delta: fmtBRL(p.grossProfit - a.grossProfit, 0, true) },
  ];
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-coffee-100 bg-cream-50/95 px-4 py-3 shadow-lift backdrop-blur lg:hidden"
          aria-live="polite"
        >
          <p className="sr-only">Resultado do cenário proposto vs. Atual</p>
          <dl className="grid grid-cols-3 gap-2">
            {items.map((it) => (
              <div key={it.label}>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-coffee-500">{it.label}</dt>
                <dd className="tabular whitespace-nowrap text-base font-semibold text-coffee-800">{it.value}</dd>
                <dd className="tabular whitespace-nowrap text-[10px] font-semibold text-wine-600">{it.delta} vs. Atual</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
