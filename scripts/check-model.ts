// Uso: npx tsx scripts/check-model.ts
import { PROPOSED_LEVERS, REGIONS } from "../src/data/model";
import {
  CALIBRATION,
  aggregate,
  marginBridge,
  promoRoi,
  regionKpis,
  simulate,
  simulateCurrent,
  simulateTimeline,
} from "../src/lib/simulation";

const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
const pp = (x: number) => `${x.toFixed(2)} p.p.`;

const cur = simulateCurrent();
const prop = simulate(PROPOSED_LEVERS);
const base = cur.totals;

console.log("Calibração", CALIBRATION);
console.log("Base   margem", pct(base.grossMargin0), "receita", base.netRevenue0.toFixed(0), "lucro", base.grossProfit0.toFixed(0));
for (const [name, r] of [["Atual", cur], ["Proposto", prop]] as const) {
  const t = r.totals;
  console.log(
    name.padEnd(9),
    "margem", pct(t.grossMargin), `(${pp(t.grossMarginChangePP)})`,
    "| volume", pct(t.volumeChange),
    "| receita", t.netRevenue.toFixed(0), pct(t.revenueChange),
    "| lucro bruto", t.grossProfit.toFixed(0), pct(t.grossProfitChange),
    "| preço", pct(t.priceChange),
    "| café", pct(t.coffeeCostChange),
  );
}
for (const seg of ["entrada", "tradicional", "premium", "capsulas"] as const) {
  const a = aggregate(cur.cells, { segment: seg });
  const p = aggregate(prop.cells, { segment: seg });
  console.log(
    seg.padEnd(12),
    "base", pct(a.grossMargin0),
    "| atual", pct(a.grossMargin), pct(a.volumeChange),
    "| proposto", pct(p.grossMargin), pct(p.volumeChange),
  );
}
const b = marginBridge(PROPOSED_LEVERS);
for (const s of b.steps) console.log("ponte", s.label.padEnd(9), pp(s.marginPP), s.grossProfit.toFixed(0), pp(s.volumePP));
for (const r of REGIONS) {
  const a = regionKpis(cur, r.id);
  const p = regionKpis(prop, r.id);
  console.log(r.id.padEnd(3), "share", pct(a.marketShare0), "→ atual", pct(a.marketShare), "risco", a.riskIndex.toFixed(0), "| proposto", pct(p.marketShare), "risco", p.riskIndex.toFixed(0));
}
console.log("ROI promo", promoRoi(PROPOSED_LEVERS).toFixed(2));
const tl = simulateTimeline(PROPOSED_LEVERS);
console.log(
  tl.map((p) => `${p.month}:${(p.current.totals.grossMargin * 100).toFixed(1)}/${(p.proposed.totals.grossMargin * 100).toFixed(1)}`).join(" "),
);
