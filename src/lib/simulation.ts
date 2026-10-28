/**
 * Motor de simulação — funções puras, sem dependência de UI.
 * Premissas em src/data/model.ts. Fórmulas documentadas em
 * src/lib/methodology.ts e na página "Metodologia e premissas".
 */
import {
  BASE,
  CASE_FACTS,
  CHANNELS,
  COFFEE_PATH,
  COFFEE_PATH_HISTORY,
  CURRENT_LEVERS,
  LEVER_EFFECTS,
  REGION_ELASTICITY,
  REGION_RISK_SCALE,
  REGIONS,
  ROLLOUT,
  SEGMENTS,
  SKUS,
  type ChannelId,
  type Levers,
  type RegionId,
  type SegmentId,
} from "@/data/model";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export interface Calibration {
  /** Multiplica todas as elasticidades relativas. */
  elasticityScale: number;
  /** Multiplica o peso relativo do café verde no CPV. */
  coffeeShareScale: number;
}

interface BaseCell {
  segment: SegmentId;
  channel: ChannelId;
  region: RegionId;
  netRevenue0: number;
  kg0: number;
  grossPricePerKg0: number;
  promoRate0: number;
  coffeeCost0: number;
  otherVarCost0: number;
  fixedCost0: number;
  rawElasticity: number;
}

export interface CellResult {
  segment: SegmentId;
  channel: ChannelId;
  region: RegionId;
  kg0: number;
  netRevenue0: number;
  grossProfit0: number;
  kg: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  promoSpend: number;
  /** Aumento médio de preço por kg percebido pelo consumidor. */
  priceChange: number;
  /** Alta efetiva do custo do café por kg nesta célula. */
  coffeeCostChange: number;
  coffeeCost: number;
}

export interface Totals {
  kg0: number;
  kg: number;
  netRevenue0: number;
  netRevenue: number;
  grossProfit0: number;
  grossProfit: number;
  /** Margem bruta (fração). */
  grossMargin0: number;
  grossMargin: number;
  /** Variação de margem vs. pré-alta, em p.p. */
  grossMarginChangePP: number;
  volumeChange: number;
  revenueChange: number;
  grossProfitChange: number;
  priceChange: number;
  promoSpend: number;
  coffeeCostChange: number;
}

export interface ScenarioOptions {
  /** Alta do café verde no mercado spot (default: +40% do case). */
  coffeeIncrease?: number;
  /** Alta média do café na carteira de hedge (default: premissa fixa). */
  hedgedIncrease?: number;
  calibration?: Calibration;
}

export interface ScenarioResult {
  levers: Levers;
  coffeeIncrease: number;
  cells: CellResult[];
  totals: Totals;
}

export interface CellFilter {
  segment?: SegmentId | "all";
  channel?: ChannelId | "all";
  region?: RegionId | "all";
}

/* ------------------------------------------------------------------ */
/* Base pré-alta                                                       */
/* ------------------------------------------------------------------ */

const regionElasticity = (pressure: number) =>
  REGION_ELASTICITY.intercept + REGION_ELASTICITY.slope * pressure;

/** Monta as células segmento × canal × região na situação pré-alta. */
export function buildBaseCells(coffeeShareScale: number): BaseCell[] {
  const cells: BaseCell[] = [];
  for (const seg of SEGMENTS) {
    const coffeeShare = Math.min(
      1 - BASE.fixedCogsShare - BASE.minOtherVarShare,
      seg.coffeeWeight * coffeeShareScale,
    );
    for (const ch of CHANNELS) {
      const mix = seg.channelMix[ch.id] ?? 0;
      if (mix <= 0) continue;
      for (const reg of REGIONS) {
        const netRevenue0 =
          BASE.netRevenue * seg.revenueShare * mix * reg.revenueShare;
        const grossRevenue0 = netRevenue0 / (1 - ch.promoRate);
        const cogs0 = netRevenue0 * (seg.cogsRatio + ch.cogsAdjustmentPP / 100);
        const coffeeCost0 = cogs0 * coffeeShare;
        const fixedCost0 = cogs0 * BASE.fixedCogsShare;
        cells.push({
          segment: seg.id,
          channel: ch.id,
          region: reg.id,
          netRevenue0,
          kg0: grossRevenue0 / seg.pricePerKgIndex,
          grossPricePerKg0: seg.pricePerKgIndex,
          promoRate0: ch.promoRate,
          coffeeCost0,
          fixedCost0,
          otherVarCost0: cogs0 - coffeeCost0 - fixedCost0,
          rawElasticity:
            seg.elasticity *
            ch.elasticityMultiplier *
            regionElasticity(reg.privateLabelPressure),
        });
      }
    }
  }
  return cells;
}

/* ------------------------------------------------------------------ */
/* Simulação de um cenário                                             */
/* ------------------------------------------------------------------ */

const segmentById = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]));

function runScenario(
  levers: Levers,
  calibration: Calibration,
  coffeeIncrease: number,
  hedgedIncrease: number,
): ScenarioResult {
  const base = buildBaseCells(calibration.coffeeShareScale);
  const E = LEVER_EFFECTS;

  // 1) Mix: migração de kg (trade-up) entre segmentos.
  const segKg0: Record<string, number> = {};
  let totalKg0 = 0;
  for (const c of base) {
    segKg0[c.segment] = (segKg0[c.segment] ?? 0) + c.kg0;
    totalKg0 += c.kg0;
  }
  const migratedKg = (levers.premiumMixPP / 100) * totalKg0;
  const segKgFactor: Record<string, number> = {};
  for (const seg of SEGMENTS) {
    const out = (E.premiumMixOrigin as Record<string, number>)[seg.id] ?? 0;
    const inn = (E.premiumMixDestination as Record<string, number>)[seg.id] ?? 0;
    segKgFactor[seg.id] = 1 + (migratedKg * (inn - out)) / segKg0[seg.id];
  }

  // 2) Custo do café efetivo (hedge + compra direta).
  const h = levers.hedgePct;
  const effectiveIncrease = (1 - h) * coffeeIncrease + h * hedgedIncrease;
  const directFactor =
    1 - levers.directSourcingPct * E.directSourcingDiscount;

  // 3) Preço, volume e receita por célula.
  const partial = base.map((c) => {
    const seg = segmentById[c.segment];
    const dp = levers.passThrough[c.segment];
    const eps = c.rawElasticity * calibration.elasticityScale;
    const startKg = c.kg0 * segKgFactor[c.segment];

    const small = seg.smallPackEligible ? levers.smallPackPct : 0;
    const smallPriceFactor = (1 + dp) * (1 + E.smallPackPricePerKgUplift);
    const kgRegular = startKg * (1 - small) * Math.pow(1 + dp, eps);
    const kgSmall =
      startKg *
      small *
      Math.pow(smallPriceFactor, eps * E.smallPackElasticityFactor);
    const kg = kgRegular + kgSmall;

    const grossRevenue =
      c.grossPricePerKg0 * (kgRegular * (1 + dp) + kgSmall * smallPriceFactor);
    let promoRate =
      c.promoRate0 + (c.channel === "varejo" ? BASE.retailPromoPressurePP / 100 : 0);
    if (c.channel === "varejo") promoRate *= 1 - levers.promoOptimizationPct;
    const promoSpend = grossRevenue * promoRate;
    const netRevenue = grossRevenue - promoSpend;

    const blendFactor =
      1 -
      (levers.blendShiftPP / 100) * E.conilonDiscount * seg.blendApplicability;
    const coffeeFactor = (1 + effectiveIncrease) * directFactor * blendFactor;
    const coffeePerKg0 = c.coffeeCost0 / c.kg0;
    const otherPerKg0 = c.otherVarCost0 / c.kg0;
    const coffeeCost = coffeePerKg0 * kg * coffeeFactor;
    const otherCost =
      otherPerKg0 * kg * (1 - levers.efficiencyPct) +
      (coffeePerKg0 + otherPerKg0) * kgSmall * E.smallPackCostUplift;

    const avgPrice =
      (kgRegular * (1 + dp) + kgSmall * smallPriceFactor) / Math.max(kg, 1e-9);

    return {
      c,
      kg,
      netRevenue,
      promoSpend,
      coffeeCost,
      otherCost,
      priceChange: avgPrice - 1,
      coffeeCostChange: coffeeFactor - 1,
      fixedWeight: c.fixedCost0 * (kg / c.kg0),
    };
  });

  // 4) Custo fixo total constante, rateado pelo volume (desalavancagem).
  const totalFixed = base.reduce((a, c) => a + c.fixedCost0, 0);
  const totalWeight = partial.reduce((a, p) => a + p.fixedWeight, 0);

  const cells: CellResult[] = partial.map((p) => {
    const fixed =
      totalFixed * (p.fixedWeight / totalWeight) * (1 - levers.efficiencyPct);
    const cogs = p.coffeeCost + p.otherCost + fixed;
    const cogs0 = p.c.coffeeCost0 + p.c.otherVarCost0 + p.c.fixedCost0;
    return {
      segment: p.c.segment,
      channel: p.c.channel,
      region: p.c.region,
      kg0: p.c.kg0,
      netRevenue0: p.c.netRevenue0,
      grossProfit0: p.c.netRevenue0 - cogs0,
      kg: p.kg,
      netRevenue: p.netRevenue,
      cogs,
      grossProfit: p.netRevenue - cogs,
      promoSpend: p.promoSpend,
      priceChange: p.priceChange,
      coffeeCostChange: p.coffeeCostChange,
      coffeeCost: p.coffeeCost,
    };
  });

  return { levers, coffeeIncrease, cells, totals: aggregate(cells) };
}

/* ------------------------------------------------------------------ */
/* Agregação                                                           */
/* ------------------------------------------------------------------ */

export function matchesFilter(c: CellResult, f: CellFilter = {}): boolean {
  return (
    (!f.segment || f.segment === "all" || c.segment === f.segment) &&
    (!f.channel || f.channel === "all" || c.channel === f.channel) &&
    (!f.region || f.region === "all" || c.region === f.region)
  );
}

export function aggregate(cells: CellResult[], filter?: CellFilter): Totals {
  const list = filter ? cells.filter((c) => matchesFilter(c, filter)) : cells;
  let kg0 = 0,
    kg = 0,
    rev0 = 0,
    rev = 0,
    gp0 = 0,
    gp = 0,
    priceW = 0,
    promo = 0,
    coffee = 0,
    coffeeBase = 0;
  for (const c of list) {
    kg0 += c.kg0;
    kg += c.kg;
    rev0 += c.netRevenue0;
    rev += c.netRevenue;
    gp0 += c.grossProfit0;
    gp += c.grossProfit;
    priceW += c.priceChange * c.kg;
    promo += c.promoSpend;
    coffee += c.coffeeCost;
    coffeeBase += c.coffeeCost / (1 + c.coffeeCostChange);
  }
  const gm0 = rev0 ? gp0 / rev0 : 0;
  const gm = rev ? gp / rev : 0;
  return {
    kg0,
    kg,
    netRevenue0: rev0,
    netRevenue: rev,
    grossProfit0: gp0,
    grossProfit: gp,
    grossMargin0: gm0,
    grossMargin: gm,
    grossMarginChangePP: (gm - gm0) * 100,
    volumeChange: kg0 ? kg / kg0 - 1 : 0,
    revenueChange: rev0 ? rev / rev0 - 1 : 0,
    grossProfitChange: gp0 ? gp / gp0 - 1 : 0,
    priceChange: kg ? priceW / kg : 0,
    promoSpend: promo,
    coffeeCostChange: coffeeBase ? coffee / coffeeBase - 1 : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Calibração: "Atual" reproduz o case                                 */
/* ------------------------------------------------------------------ */

function bisect(f: (x: number) => number, lo: number, hi: number): number {
  let flo = f(lo);
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Resolve as duas incógnitas do modelo:
 * 1. escala de elasticidade → volume do "Atual" = CASE_FACTS.volumeChange
 *    (o volume não depende do peso do café, então resolve-se primeiro);
 * 2. peso do café no CPV → margem do "Atual" = CASE_FACTS.grossMarginChangePP.
 */
export function calibrate(): Calibration {
  const c = CASE_FACTS.coffeeCostIncrease;
  const h = LEVER_EFFECTS.hedgeLockedIncrease;
  const elasticityScale = bisect(
    (k) =>
      runScenario(CURRENT_LEVERS, { elasticityScale: k, coffeeShareScale: 0.5 }, c, h)
        .totals.volumeChange - CASE_FACTS.volumeChange,
    0.01,
    5,
  );
  const coffeeShareScale = bisect(
    (g) =>
      runScenario(CURRENT_LEVERS, { elasticityScale, coffeeShareScale: g }, c, h)
        .totals.grossMarginChangePP - CASE_FACTS.grossMarginChangePP,
    0.01,
    1.2,
  );
  return { elasticityScale, coffeeShareScale };
}

export const CALIBRATION: Calibration = calibrate();

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */

export function simulate(levers: Levers, opts: ScenarioOptions = {}): ScenarioResult {
  const coffeeIncrease = opts.coffeeIncrease ?? CASE_FACTS.coffeeCostIncrease;
  const hedgedIncrease =
    opts.hedgedIncrease ??
    LEVER_EFFECTS.hedgeLockedIncrease *
      (coffeeIncrease / CASE_FACTS.coffeeCostIncrease);
  return runScenario(
    levers,
    opts.calibration ?? CALIBRATION,
    coffeeIncrease,
    hedgedIncrease,
  );
}

export const simulateCurrent = (opts?: ScenarioOptions) =>
  simulate(CURRENT_LEVERS, opts);

/* ------------------------------------------------------------------ */
/* Ponte de margem (waterfall)                                         */
/* ------------------------------------------------------------------ */

export type BridgeStepId = "custo" | "mix" | "preco" | "execucao";

export interface BridgeStep {
  id: BridgeStepId;
  label: string;
  description: string;
  /** Contribuição em p.p. de margem bruta. */
  marginPP: number;
  /** Contribuição em lucro bruto (R$ mi ilustrativos). */
  grossProfit: number;
  /** Contribuição em p.p. de volume. */
  volumePP: number;
}

export interface Bridge {
  current: Totals;
  proposed: Totals;
  steps: BridgeStep[];
}

/**
 * Decompõe Atual → Proposto ligando as alavancas em sequência
 * (Custo → Mix → Preço → Execução). A ordem afeta a atribuição de
 * interações, mas a soma dos passos é sempre exata.
 */
export function marginBridge(target: Levers, opts?: ScenarioOptions): Bridge {
  const L0 = CURRENT_LEVERS;
  const stages: { id: BridgeStepId; label: string; description: string; levers: Levers }[] = [];

  const custo: Levers = {
    ...L0,
    hedgePct: target.hedgePct,
    directSourcingPct: target.directSourcingPct,
    blendShiftPP: target.blendShiftPP,
    efficiencyPct: target.efficiencyPct,
  };
  stages.push({ id: "custo", label: "Custo", description: "Hedge, compra direta, blend e eficiência", levers: custo });

  const mix: Levers = {
    ...custo,
    premiumMixPP: target.premiumMixPP,
    smallPackPct: target.smallPackPct,
  };
  stages.push({ id: "mix", label: "Mix", description: "Trade-up premium e embalagens menores", levers: mix });

  const preco: Levers = { ...mix, passThrough: { ...target.passThrough } };
  stages.push({ id: "preco", label: "Preço", description: "Repasse segmentado por marca", levers: preco });

  const execucao: Levers = { ...preco, promoOptimizationPct: target.promoOptimizationPct };
  stages.push({ id: "execucao", label: "Execução", description: "Verba promocional com plano conjunto", levers: execucao });

  const current = simulate(L0, opts).totals;
  let prev = current;
  const steps: BridgeStep[] = stages.map((s) => {
    const t = simulate(s.levers, opts).totals;
    const step: BridgeStep = {
      id: s.id,
      label: s.label,
      description: s.description,
      marginPP: (t.grossMargin - prev.grossMargin) * 100,
      grossProfit: t.grossProfit - prev.grossProfit,
      volumePP: (t.volumeChange - prev.volumeChange) * 100,
    };
    prev = t;
    return step;
  });
  return { current, proposed: prev, steps };
}

/* ------------------------------------------------------------------ */
/* Série de 24 meses                                                   */
/* ------------------------------------------------------------------ */

const ramp = (t: number, w: { start: number; end: number }) =>
  Math.min(1, Math.max(0, (t - w.start) / (w.end - w.start)));

const lerp = (a: number, b: number, r: number) => a + (b - a) * r;

export interface TimelinePoint {
  month: number;
  coffeeIncrease: number;
  current: ScenarioResult;
  proposed: ScenarioResult;
}

/**
 * Cada mês é tratado como um equilíbrio anualizado (run-rate):
 * - Atual: repasse linear contínuo, proporcional ao custo do mês
 *   (25% × alta do mês / 40%), sem hedge.
 * - Proposto: alavancas entram conforme o roadmap (ganhos rápidos 0–6,
 *   estruturais 6–18, mix 12–24). A carteira de hedge suaviza o custo
 *   pela média móvel de ROLLOUT.hedgeWindow meses.
 */
export function simulateTimeline(target: Levers): TimelinePoint[] {
  const full = [...COFFEE_PATH_HISTORY, ...COFFEE_PATH];
  const offset = COFFEE_PATH_HISTORY.length;
  const ratio = LEVER_EFFECTS.hedgeLockedIncrease / CASE_FACTS.coffeeCostIncrease;
  const passRatio = CASE_FACTS.uniformPriceIncrease / CASE_FACTS.coffeeCostIncrease;

  return COFFEE_PATH.map((coffee, i) => {
    const month = i + 1;
    const window = full.slice(Math.max(0, i + offset - ROLLOUT.hedgeWindow + 1), i + offset + 1);
    const movingAvg = window.reduce((a, b) => a + b, 0) / window.length;
    const hedgedIncrease = movingAvg * ratio;
    const uniform = passRatio * coffee;

    const currentLevers: Levers = {
      ...CURRENT_LEVERS,
      passThrough: { entrada: uniform, tradicional: uniform, premium: uniform, capsulas: uniform },
    };

    const q = ramp(month, ROLLOUT.quickWins);
    const s = ramp(month, ROLLOUT.structural);
    const m = ramp(month, ROLLOUT.mix);
    const proposedLevers: Levers = {
      hedgePct: target.hedgePct * s,
      directSourcingPct: target.directSourcingPct * s,
      blendShiftPP: target.blendShiftPP * q,
      efficiencyPct: target.efficiencyPct * q,
      smallPackPct: target.smallPackPct * q,
      promoOptimizationPct: target.promoOptimizationPct * q,
      premiumMixPP: target.premiumMixPP * m,
      passThrough: {
        entrada: lerp(uniform, target.passThrough.entrada, s),
        tradicional: lerp(uniform, target.passThrough.tradicional, s),
        premium: lerp(uniform, target.passThrough.premium, s),
        capsulas: lerp(uniform, target.passThrough.capsulas, s),
      },
    };

    return {
      month,
      coffeeIncrease: coffee,
      current: simulate(currentLevers, { coffeeIncrease: coffee, hedgedIncrease }),
      proposed: simulate(proposedLevers, { coffeeIncrease: coffee, hedgedIncrease }),
    };
  });
}

/* ------------------------------------------------------------------ */
/* KPIs derivados                                                      */
/* ------------------------------------------------------------------ */

export interface RegionKpis {
  region: RegionId;
  volumeChange: number;
  marketShare0: number;
  marketShare: number;
  /** Perda de share em p.p. (positivo = perda). */
  shareLossPP: number;
  grossMargin: number;
  grossProfit: number;
  netRevenue: number;
  /** Índice 0–100 combinando perda de share e pressão de marcas próprias. */
  riskIndex: number;
}

export function regionKpis(result: ScenarioResult, region: RegionId): RegionKpis {
  const reg = REGIONS.find((r) => r.id === region)!;
  const t = aggregate(result.cells, { region });
  const marketShare =
    (reg.marketShare * (1 + t.volumeChange)) / (1 + BASE.marketVolumeChange);
  const shareLossPP = (reg.marketShare - marketShare) * 100;
  const riskIndex = Math.max(
    0,
    Math.min(100, shareLossPP * REGION_RISK_SCALE * (0.5 + reg.privateLabelPressure)),
  );
  return {
    region,
    volumeChange: t.volumeChange,
    marketShare0: reg.marketShare,
    marketShare,
    shareLossPP,
    grossMargin: t.grossMargin,
    grossProfit: t.grossProfit,
    netRevenue: t.netRevenue,
    riskIndex,
  };
}

/** Market share ponderado (pela receita-base) das regiões filtradas. */
export function marketShareFor(result: ScenarioResult, filter: CellFilter = {}) {
  const regions = REGIONS.filter(
    (r) => !filter.region || filter.region === "all" || r.id === filter.region,
  );
  let w = 0,
    s0 = 0,
    s = 0;
  for (const r of regions) {
    const t = aggregate(result.cells, { ...filter, region: r.id });
    const share = (r.marketShare * (1 + t.volumeChange)) / (1 + BASE.marketVolumeChange);
    w += r.revenueShare;
    s0 += r.marketShare * r.revenueShare;
    s += share * r.revenueShare;
  }
  return { share0: s0 / w, share: s / w };
}

/** Gap de preço vs. concorrentes nacionais e marcas próprias (fração). */
export function priceGap(t: Totals) {
  return {
    vsCompetitors: (1 + t.priceChange) / (1 + BASE.competitorPriceIncrease) - 1,
    vsPrivateLabel: (1 + t.priceChange) / (1 + BASE.privateLabelPriceIncrease) - 1,
  };
}

/** Custo médio do café vs. referência de mercado (fração; negativo = melhor). */
export function coffeeCostVsMarket(t: Totals, coffeeIncrease: number = CASE_FACTS.coffeeCostIncrease) {
  return (1 + t.coffeeCostChange) / (1 + coffeeIncrease) - 1;
}

/** ROI promocional (margem incremental / verba) — heurística documentada. */
export function promoRoi(levers: Levers) {
  return (
    BASE.promoRoiBase *
    (1 + levers.promoOptimizationPct * LEVER_EFFECTS.promoRoiGainPerPoint)
  );
}

export interface SkuRow {
  id: string;
  name: string;
  segment: SegmentId;
  channel: ChannelId;
  netRevenue: number;
  grossMargin0: number;
  grossMarginCurrent: number;
  grossMarginProposed: number;
  volumeChangeCurrent: number;
  volumeChangeProposed: number;
}

export function skuTable(
  current: ScenarioResult,
  proposed: ScenarioResult,
  filter: CellFilter = {},
): SkuRow[] {
  return SKUS.filter(
    (s) =>
      (!filter.segment || filter.segment === "all" || s.segment === filter.segment) &&
      (!filter.channel || filter.channel === "all" || s.channel === filter.channel),
  ).map((sku) => {
    const f = { segment: sku.segment, channel: sku.channel, region: filter.region };
    const a = aggregate(current.cells, f);
    const p = aggregate(proposed.cells, f);
    const off = sku.marginOffsetPP / 100;
    return {
      id: sku.id,
      name: sku.name,
      segment: sku.segment,
      channel: sku.channel,
      netRevenue: p.netRevenue * sku.cellShare,
      grossMargin0: a.grossMargin0 + off,
      grossMarginCurrent: a.grossMargin + off,
      grossMarginProposed: p.grossMargin + off,
      volumeChangeCurrent: a.volumeChange,
      volumeChangeProposed: p.volumeChange,
    };
  });
}
