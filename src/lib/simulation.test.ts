import { describe, expect, it } from "vitest";
import {
  CASE_FACTS,
  CURRENT_LEVERS,
  PROPOSED_LEVERS,
  REGIONS,
} from "@/data/model";
import {
  aggregate,
  marginBridge,
  regionKpis,
  simulate,
  simulateCurrent,
  simulateTimeline,
} from "./simulation";

describe("cenário Atual reproduz o case", () => {
  const { totals } = simulateCurrent();

  it("volume cai 8%", () => {
    expect(totals.volumeChange).toBeCloseTo(CASE_FACTS.volumeChange, 4);
  });

  it("margem bruta cai 4 p.p.", () => {
    expect(totals.grossMarginChangePP).toBeCloseTo(CASE_FACTS.grossMarginChangePP, 3);
  });

  it("preço médio sobe 25% e custo do café 40%", () => {
    expect(totals.priceChange).toBeCloseTo(CASE_FACTS.uniformPriceIncrease, 6);
    expect(totals.coffeeCostChange).toBeCloseTo(CASE_FACTS.coffeeCostIncrease, 6);
  });

  it("entrada perde mais volume que cápsulas (elasticidades diferentes)", () => {
    const r = simulateCurrent();
    const entrada = aggregate(r.cells, { segment: "entrada" });
    const capsulas = aggregate(r.cells, { segment: "capsulas" });
    expect(entrada.volumeChange).toBeLessThan(capsulas.volumeChange);
  });
});

describe("cenário Proposto", () => {
  const current = simulateCurrent().totals;
  const proposed = simulate(PROPOSED_LEVERS).totals;

  it("melhora margem, volume e lucro bruto vs. Atual", () => {
    expect(proposed.grossMargin).toBeGreaterThan(current.grossMargin);
    expect(proposed.volumeChange).toBeGreaterThan(current.volumeChange);
    expect(proposed.grossProfit).toBeGreaterThan(current.grossProfit);
  });

  it("não apresenta ganho irreal acima do pré-alta", () => {
    expect(proposed.grossMarginChangePP).toBeLessThan(0.5);
  });

  it("reduz risco de share em todas as regiões", () => {
    const a = simulateCurrent();
    const p = simulate(PROPOSED_LEVERS);
    for (const r of REGIONS) {
      expect(regionKpis(p, r.id).riskIndex).toBeLessThan(regionKpis(a, r.id).riskIndex);
    }
  });
});

describe("ponte de margem", () => {
  it("a soma dos passos fecha exatamente Atual → Proposto", () => {
    const b = marginBridge(PROPOSED_LEVERS);
    const sumPP = b.steps.reduce((a, s) => a + s.marginPP, 0);
    const sumGP = b.steps.reduce((a, s) => a + s.grossProfit, 0);
    expect(sumPP).toBeCloseTo((b.proposed.grossMargin - b.current.grossMargin) * 100, 8);
    expect(sumGP).toBeCloseTo(b.proposed.grossProfit - b.current.grossProfit, 6);
  });

  it("alavancas neutras não alteram o Atual", () => {
    const b = marginBridge(CURRENT_LEVERS);
    for (const s of b.steps) expect(Math.abs(s.marginPP)).toBeLessThan(1e-9);
  });
});

describe("sensibilidades", () => {
  it("mais hedge reduz custo do café e eleva a margem", () => {
    const low = simulate({ ...PROPOSED_LEVERS, hedgePct: 0.1 }).totals;
    const high = simulate({ ...PROPOSED_LEVERS, hedgePct: 0.7 }).totals;
    expect(high.coffeeCostChange).toBeLessThan(low.coffeeCostChange);
    expect(high.grossMargin).toBeGreaterThan(low.grossMargin);
  });

  it("repasse menor na entrada preserva volume", () => {
    const pt = PROPOSED_LEVERS.passThrough;
    const a = simulate({ ...PROPOSED_LEVERS, passThrough: { ...pt, entrada: 0.25 } }).totals;
    const b = simulate({ ...PROPOSED_LEVERS, passThrough: { ...pt, entrada: 0.05 } }).totals;
    expect(b.volumeChange).toBeGreaterThan(a.volumeChange);
  });
});

describe("série de 24 meses", () => {
  const tl = simulateTimeline(PROPOSED_LEVERS);

  it("tem 24 pontos e começa próximo do Atual", () => {
    expect(tl).toHaveLength(24);
    const first = tl[0];
    expect(
      Math.abs(first.proposed.totals.grossMargin - first.current.totals.grossMargin) * 100,
    ).toBeLessThan(1.5);
  });

  it("termina com margem do Proposto acima do Atual", () => {
    const last = tl[23];
    expect(last.proposed.totals.grossMargin).toBeGreaterThan(last.current.totals.grossMargin);
  });
});
