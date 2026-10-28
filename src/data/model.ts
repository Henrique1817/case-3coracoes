/**
 * PREMISSAS DO SIMULADOR — arquivo único e editável.
 *
 * Todos os números deste arquivo são FICTÍCIOS. Foram construídos para
 * reproduzir os números do enunciado do case (custo +40%, repasse +25%,
 * volume −8%, margem bruta −4 p.p.) e NÃO representam dados reais do
 * Grupo 3corações.
 *
 * Convenções:
 * - Frações decimais: 0.25 = 25%.
 * - "p.p." (pontos percentuais) aparecem como número: 4 = 4 p.p.
 * - Valores em R$ são ilustrativos (R$ milhões/ano).
 *
 * Duas grandezas são calibradas automaticamente em src/lib/simulation.ts
 * para que o cenário "Atual" reproduza o case mesmo após edições aqui:
 * - escala de elasticidade (acerta o volume em −8%);
 * - peso do café verde no CPV (acerta a margem em −4 p.p.).
 */

export type SegmentId = "entrada" | "tradicional" | "premium" | "capsulas";
export type ChannelId = "varejo" | "foodservice" | "capsulas";
export type RegionId = "N" | "NE" | "CO" | "SE" | "S";

/* ------------------------------------------------------------------ */
/* 1. Números do enunciado (alvos de calibração do cenário "Atual")    */
/* ------------------------------------------------------------------ */

export const CASE_FACTS = {
  /** Alta do café verde em 12 meses. */
  coffeeCostIncrease: 0.4,
  /** Aumento de preço aplicado de forma uniforme ("repasse linear"). */
  uniformPriceIncrease: 0.25,
  /** Queda de volume (kg) observada no cenário atual. */
  volumeChange: -0.08,
  /** Variação da margem bruta, em p.p. */
  grossMarginChangePP: -4,
} as const;

/* ------------------------------------------------------------------ */
/* 2. Base econômica (pré-alta)                                        */
/* ------------------------------------------------------------------ */

export const BASE = {
  /** Receita líquida anual pré-alta — R$ milhões, ILUSTRATIVO. */
  netRevenue: 5000,
  /** Parcela do CPV que é fixa (depreciação, mão de obra fabril). Gera
   *  desalavancagem quando o volume cai. */
  fixedCogsShare: 0.1,
  /** Piso para custos variáveis não-café (embalagem, energia) no CPV. */
  minOtherVarShare: 0.04,
  /** Variação do volume total da categoria de café no período. */
  marketVolumeChange: -0.03,
  /** Aumento médio de preço dos concorrentes nacionais. */
  competitorPriceIncrease: 0.2,
  /** Aumento médio de preço de marcas próprias e regionais. */
  privateLabelPriceIncrease: 0.14,
  /** Pressão extra de verba promocional exigida pelo varejo nos cenários
   *  pós-alta (p.p. da receita bruta do canal Varejo). */
  retailPromoPressurePP: 1,
  /** ROI promocional médio no modelo atual (margem incremental / verba). */
  promoRoiBase: 0.85,
} as const;

/* ------------------------------------------------------------------ */
/* 3. Segmentos de marca                                               */
/* ------------------------------------------------------------------ */

export interface Segment {
  id: SegmentId;
  label: string;
  role: string;
  /** Participação na receita líquida pré-alta. */
  revenueShare: number;
  /** Índice de preço por kg (Entrada = 1). */
  pricePerKgIndex: number;
  /** CPV / receita líquida pré-alta. Margem bruta = 1 − cogsRatio. */
  cogsRatio: number;
  /** Peso relativo do café verde no CPV (antes da calibração). */
  coffeeWeight: number;
  /** Elasticidade preço-volume relativa (antes da calibração). */
  elasticity: number;
  /** Receita por canal (soma = 1). */
  channelMix: Partial<Record<ChannelId, number>>;
  /** Efeito da troca de blend (arábica → conilon) neste segmento (0 a 1). */
  blendApplicability: number;
  /** Elegível a embalagens menores / refil. */
  smallPackEligible: boolean;
}

export const SEGMENTS: Segment[] = [
  {
    id: "entrada",
    label: "Entrada",
    role: "Defende volume e share contra regionais e marcas próprias.",
    revenueShare: 0.34,
    pricePerKgIndex: 1,
    cogsRatio: 0.76,
    coffeeWeight: 1,
    elasticity: -1,
    channelMix: { varejo: 0.85, foodservice: 0.15 },
    blendApplicability: 1,
    smallPackEligible: true,
  },
  {
    id: "tradicional",
    label: "Tradicional",
    role: "Equilíbrio: repasse parcial, limitado pelo gap de preço.",
    revenueShare: 0.33,
    pricePerKgIndex: 1.35,
    cogsRatio: 0.68,
    coffeeWeight: 0.95,
    elasticity: -0.6,
    channelMix: { varejo: 0.75, foodservice: 0.25 },
    blendApplicability: 0.5,
    smallPackEligible: true,
  },
  {
    id: "premium",
    label: "Premium/Gourmet",
    role: "Carrega margem: origem, grãos especiais e valor percebido.",
    revenueShare: 0.15,
    pricePerKgIndex: 2.3,
    cogsRatio: 0.56,
    coffeeWeight: 0.85,
    elasticity: -0.32,
    channelMix: { varejo: 0.6, foodservice: 0.4 },
    blendApplicability: 0,
    smallPackEligible: false,
  },
  {
    id: "capsulas",
    label: "Cápsulas",
    role: "Margem e conveniência, preço próprio e recorrência.",
    revenueShare: 0.18,
    pricePerKgIndex: 7.5,
    cogsRatio: 0.5,
    coffeeWeight: 0.45,
    elasticity: -0.2,
    channelMix: { capsulas: 1 },
    blendApplicability: 0,
    smallPackEligible: false,
  },
];

/* ------------------------------------------------------------------ */
/* 4. Canais                                                           */
/* ------------------------------------------------------------------ */

export interface Channel {
  id: ChannelId;
  label: string;
  description: string;
  /** Verba promocional / trade (fração da receita bruta). */
  promoRate: number;
  /** Multiplicador de elasticidade do canal. */
  elasticityMultiplier: number;
  /** Ajuste de CPV do canal vs. média do segmento (p.p. da receita). */
  cogsAdjustmentPP: number;
}

export const CHANNELS: Channel[] = [
  {
    id: "varejo",
    label: "Varejo",
    description: "Supermercados e atacarejo: alta exposição a preço de gôndola.",
    promoRate: 0.08,
    elasticityMultiplier: 1.1,
    cogsAdjustmentPP: 0,
  },
  {
    id: "foodservice",
    label: "Food Service",
    description: "Cafeterias, hotéis e escritórios: contratos e serviço.",
    promoRate: 0.03,
    elasticityMultiplier: 0.75,
    cogsAdjustmentPP: 1.5,
  },
  {
    id: "capsulas",
    label: "Cápsulas",
    description: "Sistemas de cápsulas e e-commerce: recorrência e conveniência.",
    promoRate: 0.04,
    elasticityMultiplier: 1,
    cogsAdjustmentPP: 0,
  },
];

/* ------------------------------------------------------------------ */
/* 5. Regiões                                                          */
/* ------------------------------------------------------------------ */

export interface Region {
  id: RegionId;
  label: string;
  /** Participação no volume/receita da empresa. */
  revenueShare: number;
  /** Market share simulado pré-alta. */
  marketShare: number;
  /** Pressão de marcas regionais e próprias (0 = baixa, 1 = alta). */
  privateLabelPressure: number;
  note: string;
}

export const REGIONS: Region[] = [
  {
    id: "N",
    label: "Norte",
    revenueShare: 0.07,
    marketShare: 0.22,
    privateLabelPressure: 0.7,
    note: "Logística cara e torrefadoras locais fortes.",
  },
  {
    id: "NE",
    label: "Nordeste",
    revenueShare: 0.29,
    marketShare: 0.38,
    privateLabelPressure: 0.45,
    note: "Base histórica, marca forte e alta frequência de consumo.",
  },
  {
    id: "CO",
    label: "Centro-Oeste",
    revenueShare: 0.09,
    marketShare: 0.21,
    privateLabelPressure: 0.6,
    note: "Atacarejo em expansão e sensibilidade a preço.",
  },
  {
    id: "SE",
    label: "Sudeste",
    revenueShare: 0.41,
    marketShare: 0.26,
    privateLabelPressure: 0.55,
    note: "Maior mercado; disputa intensa e espaço para premium.",
  },
  {
    id: "S",
    label: "Sul",
    revenueShare: 0.14,
    marketShare: 0.15,
    privateLabelPressure: 0.8,
    note: "Marcas regionais tradicionais com alta lealdade.",
  },
];

/** Elasticidade regional = base × (intercept + slope × pressão). */
export const REGION_ELASTICITY = { intercept: 0.7, slope: 0.55 } as const;

/** Índice de risco regional = perda de share (p.p.) × scale × (0,5 + pressão). */
export const REGION_RISK_SCALE = 30;

/* ------------------------------------------------------------------ */
/* 6. Alavancas do cenário proposto                                    */
/* ------------------------------------------------------------------ */

export interface Levers {
  /** % do café projetado travado com hedge/contratos futuros. */
  hedgePct: number;
  /** % do café comprado direto de cooperativas/produtores. */
  directSourcingPct: number;
  /** p.p. de conilon adicionados ao blend das linhas de entrada. */
  blendShiftPP: number;
  /** Aumento de preço por segmento. */
  passThrough: Record<SegmentId, number>;
  /** p.p. do volume (kg) que migra para premium/cápsulas (trade-up). */
  premiumMixPP: number;
  /** % do volume de Entrada/Tradicional em embalagens menores e refis. */
  smallPackPct: number;
  /** Redução do custo de conversão (torra, embalagem, logística, energia). */
  efficiencyPct: number;
  /** Redução da verba promocional do Varejo via planos conjuntos. */
  promoOptimizationPct: number;
}

/** Cenário "Atual": repasse uniforme de 25%, sem as demais alavancas. */
export const CURRENT_LEVERS: Levers = {
  hedgePct: 0,
  directSourcingPct: 0,
  blendShiftPP: 0,
  passThrough: {
    entrada: CASE_FACTS.uniformPriceIncrease,
    tradicional: CASE_FACTS.uniformPriceIncrease,
    premium: CASE_FACTS.uniformPriceIncrease,
    capsulas: CASE_FACTS.uniformPriceIncrease,
  },
  premiumMixPP: 0,
  smallPackPct: 0,
  efficiencyPct: 0,
  promoOptimizationPct: 0,
};

/** Cenário "Proposto" padrão (valores iniciais dos sliders). */
export const PROPOSED_LEVERS: Levers = {
  hedgePct: 0.4,
  directSourcingPct: 0.2,
  blendShiftPP: 8,
  passThrough: {
    entrada: 0.1,
    tradicional: 0.21,
    premium: 0.3,
    capsulas: 0.32,
  },
  premiumMixPP: 1.5,
  smallPackPct: 0.25,
  efficiencyPct: 0.04,
  promoOptimizationPct: 0.15,
};

/** Atalhos do simulador. */
export const SCENARIO_PRESETS: { id: string; label: string; levers: Levers }[] = [
  { id: "proposto", label: "Proposto", levers: PROPOSED_LEVERS },
  {
    id: "rapidos",
    label: "Só ganhos rápidos",
    levers: {
      ...CURRENT_LEVERS,
      blendShiftPP: PROPOSED_LEVERS.blendShiftPP,
      efficiencyPct: PROPOSED_LEVERS.efficiencyPct,
      smallPackPct: PROPOSED_LEVERS.smallPackPct,
      promoOptimizationPct: PROPOSED_LEVERS.promoOptimizationPct,
    },
  },
  {
    id: "ambicioso",
    label: "Ambicioso",
    levers: {
      hedgePct: 0.6,
      directSourcingPct: 0.3,
      blendShiftPP: 10,
      passThrough: { entrada: 0.08, tradicional: 0.2, premium: 0.32, capsulas: 0.35 },
      premiumMixPP: 2.5,
      smallPackPct: 0.3,
      efficiencyPct: 0.06,
      promoOptimizationPct: 0.2,
    },
  },
  { id: "atual", label: "Repasse uniforme", levers: CURRENT_LEVERS },
];

/** Efeito parametrizado de cada alavanca. */
export const LEVER_EFFECTS = {
  /** Alta média do café no volume travado (vs. +40% no spot). */
  hedgeLockedIncrease: 0.3,
  /** Desconto do café comprado direto vs. mercado. */
  directSourcingDiscount: 0.05,
  /** Conilon vs. arábica: custo por kg menor nesta fração. */
  conilonDiscount: 0.3,
  /** Embalagens menores: preço por kg maior nesta fração. */
  smallPackPricePerKgUplift: 0.08,
  /** Embalagens menores: custo unitário maior nesta fração. */
  smallPackCostUplift: 0.03,
  /** Embalagens menores: fração da elasticidade preservada (ponto de preço). */
  smallPackElasticityFactor: 0.5,
  /** Destino do trade-up de mix (soma = 1). */
  premiumMixDestination: { premium: 0.8, capsulas: 0.2 },
  /** Origem do trade-up de mix (soma = 1). */
  premiumMixOrigin: { entrada: 0.4, tradicional: 0.6 },
  /** Ganho de ROI promocional por ponto de otimização de verba. */
  promoRoiGainPerPoint: 2,
} as const;

/** Limites dos sliders. */
export const LEVER_LIMITS = {
  hedgePct: { min: 0, max: 0.8, step: 0.05 },
  directSourcingPct: { min: 0, max: 0.4, step: 0.05 },
  blendShiftPP: { min: 0, max: 15, step: 1 },
  passThrough: { min: 0, max: 0.4, step: 0.01 },
  premiumMixPP: { min: 0, max: 4, step: 0.25 },
  smallPackPct: { min: 0, max: 0.4, step: 0.05 },
  efficiencyPct: { min: 0, max: 0.1, step: 0.005 },
  promoOptimizationPct: { min: 0, max: 0.3, step: 0.05 },
} as const;

/* ------------------------------------------------------------------ */
/* 7. Série de 24 meses                                                */
/* ------------------------------------------------------------------ */

/** Alta do café verde vs. pré-alta nos 6 meses anteriores ao mês 1. */
export const COFFEE_PATH_HISTORY = [0.2, 0.25, 0.29, 0.33, 0.37, 0.4];

/** Alta do café verde vs. pré-alta nos próximos 24 meses (volátil). */
export const COFFEE_PATH = [
  0.4, 0.42, 0.45, 0.48, 0.46, 0.43, 0.41, 0.44, 0.47, 0.45, 0.42, 0.38,
  0.36, 0.39, 0.42, 0.44, 0.41, 0.38, 0.37, 0.4, 0.43, 0.41, 0.39, 0.38,
];

/** Janelas de implantação (meses), conforme o roadmap. */
export const ROLLOUT = {
  quickWins: { start: 0, end: 6 },
  structural: { start: 6, end: 18 },
  mix: { start: 12, end: 24 },
  /** Janela da média móvel usada pela carteira de hedge. */
  hedgeWindow: 6,
} as const;

/* ------------------------------------------------------------------ */
/* 8. SKUs fictícios (tabela do dashboard)                             */
/* ------------------------------------------------------------------ */

export interface Sku {
  id: string;
  name: string;
  segment: SegmentId;
  channel: ChannelId;
  /** Participação da receita da célula segmento × canal. */
  cellShare: number;
  /** Diferença de margem vs. média da célula (p.p.). */
  marginOffsetPP: number;
}

export const SKUS: Sku[] = [
  { id: "E-500", name: "Linha Entrada 500 g", segment: "entrada", channel: "varejo", cellShare: 0.6, marginOffsetPP: -1 },
  { id: "E-250", name: "Linha Entrada 250 g (refil)", segment: "entrada", channel: "varejo", cellShare: 0.4, marginOffsetPP: 1.5 },
  { id: "E-FS", name: "Linha Entrada 1 kg (food service)", segment: "entrada", channel: "foodservice", cellShare: 1, marginOffsetPP: 0 },
  { id: "T-500", name: "Tradicional 500 g", segment: "tradicional", channel: "varejo", cellShare: 0.55, marginOffsetPP: 0 },
  { id: "T-EXT", name: "Extraforte 500 g", segment: "tradicional", channel: "varejo", cellShare: 0.45, marginOffsetPP: -0.5 },
  { id: "T-FS", name: "Tradicional 2 kg (food service)", segment: "tradicional", channel: "foodservice", cellShare: 1, marginOffsetPP: 0 },
  { id: "P-GR", name: "Gourmet grãos 1 kg", segment: "premium", channel: "varejo", cellShare: 0.5, marginOffsetPP: 2 },
  { id: "P-ORI", name: "Origem especial 250 g", segment: "premium", channel: "varejo", cellShare: 0.5, marginOffsetPP: 3 },
  { id: "P-FS", name: "Espresso premium 1 kg (food service)", segment: "premium", channel: "foodservice", cellShare: 1, marginOffsetPP: -1 },
  { id: "C-10", name: "Cápsula espresso 10 un.", segment: "capsulas", channel: "capsulas", cellShare: 0.65, marginOffsetPP: 0 },
  { id: "C-LUN", name: "Cápsula lungo 10 un.", segment: "capsulas", channel: "capsulas", cellShare: 0.35, marginOffsetPP: 1 },
];
