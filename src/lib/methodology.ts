/** Textos da página "Metodologia e premissas": hipóteses e fórmulas do motor. */
import {
  BASE,
  CASE_FACTS,
  LEVER_EFFECTS,
  REGION_ELASTICITY,
  REGION_RISK_SCALE,
  ROLLOUT,
} from "@/data/model";
import { fmtNumber, fmtPct } from "./format";

const n = (v: number, d = 2) => fmtNumber(v, d);
const p = (v: number) => fmtPct(v, 0);
const E = LEVER_EFFECTS;

export const FORMULAS: { title: string; formula: string; note: string }[] = [
  {
    title: "Células do modelo",
    formula: "célula = segmento × canal × região;  receita₀ = R₀ × share_seg × mix_canal × share_região",
    note: "Todas as métricas são somas de células; filtros do dashboard somam subconjuntos.",
  },
  {
    title: "Volume (elasticidade constante)",
    formula: `kg = kg₀ × (1 + Δp)^ε,  ε = ε_seg × m_canal × (${n(REGION_ELASTICITY.intercept)} + ${n(REGION_ELASTICITY.slope)} × pressão_região) × k`,
    note: `k é calibrado para que o cenário Atual entregue exatamente ${fmtPct(CASE_FACTS.volumeChange, 0, true)} de volume.`,
  },
  {
    title: "Receita líquida",
    formula: "receita = kg × preço_kg₀ × (1 + Δp) × (1 − verba_promocional)",
    note: `No pós-alta, o Varejo exige +${n(BASE.retailPromoPressurePP, 1)} p.p. de verba; planos conjuntos reduzem essa verba.`,
  },
  {
    title: "Custo do café",
    formula: `café = café₀/kg × kg × (1 + alta_efetiva) × (1 − d × ${p(E.directSourcingDiscount)}) × (1 − blend × ${p(E.conilonDiscount)} × aplicabilidade)`,
    note: `alta_efetiva = (1 − h) × alta_spot + h × alta_travada (${fmtPct(E.hedgeLockedIncrease, 0, true)}). h = % com hedge; d = % compra direta.`,
  },
  {
    title: "CPV total",
    formula: "CPV = café + outros_variáveis × (1 − eficiência) + fixo × (1 − eficiência)",
    note: `O custo fixo (${p(BASE.fixedCogsShare)} do CPV pré-alta) não muda com o volume e é rateado pelas células: queda de volume gera desalavancagem.`,
  },
  {
    title: "Margem e lucro bruto",
    formula: "lucro bruto = receita − CPV;  margem bruta = Σ lucro bruto / Σ receita",
    note: "A margem é sempre recalculada sobre o agregado, nunca pela média simples das células.",
  },
  {
    title: "Mix premium (trade-up)",
    formula: `kg migrado = mix_pp × kg₀ total; origem ${p(E.premiumMixOrigin.entrada)} Entrada / ${p(E.premiumMixOrigin.tradicional)} Tradicional; destino ${p(E.premiumMixDestination.premium)} Premium / ${p(E.premiumMixDestination.capsulas)} Cápsulas`,
    note: "O volume em kg é preservado; mudam a margem e a receita por kg.",
  },
  {
    title: "Embalagens menores e refil",
    formula: `fração s: preço/kg × ${n(1 + E.smallPackPricePerKgUplift)}; custo × ${n(1 + E.smallPackCostUplift)}; elasticidade × ${n(E.smallPackElasticityFactor, 1)}`,
    note: "O ponto de preço na gôndola é preservado, então a reação de volume é menor.",
  },
  {
    title: "Ponte de margem",
    formula: "Atual → +Custo → +Mix → +Preço → +Execução = Proposto",
    note: "As alavancas são ligadas em sequência; a soma dos passos fecha exatamente a diferença.",
  },
  {
    title: "Market share e risco regional",
    formula: `share = share₀ × (1 + Δvolume_região) / (1 + Δmercado);  risco = perda_pp × ${REGION_RISK_SCALE} × (0,5 + pressão)`,
    note: `Δmercado = ${fmtPct(BASE.marketVolumeChange, 0, true)} (categoria). Risco limitado ao intervalo de 0 a 100.`,
  },
  {
    title: "Gap de preço",
    formula: "gap = (1 + Δp_médio) / (1 + Δp_concorrente) − 1",
    note: `Concorrentes nacionais ${fmtPct(BASE.competitorPriceIncrease, 0, true)}; marcas próprias e regionais ${fmtPct(BASE.privateLabelPriceIncrease, 0, true)}.`,
  },
  {
    title: "Série de 24 meses",
    formula: `Atual: Δp(t) = ${p(CASE_FACTS.uniformPriceIncrease)} × alta(t) / ${p(CASE_FACTS.coffeeCostIncrease)}.  Proposto: rampas ${ROLLOUT.quickWins.start}–${ROLLOUT.quickWins.end}, ${ROLLOUT.structural.start}–${ROLLOUT.structural.end} e ${ROLLOUT.mix.start}–${ROLLOUT.mix.end} meses; hedge = média móvel de ${ROLLOUT.hedgeWindow} meses`,
    note: "Cada mês é um run-rate anualizado (equilíbrio estático), não um fluxo de caixa.",
  },
  {
    title: "ROI promocional",
    formula: `ROI = ${n(BASE.promoRoiBase)} × (1 + ${n(E.promoRoiGainPerPoint, 0)} × otimização_de_verba)`,
    note: "Heurística ilustrativa para o KPI; não entra no cálculo de margem.",
  },
];

export const LIMITATIONS = [
  "Todos os números são fictícios e servem para ilustrar a lógica de decisão, não para estimar resultados reais.",
  "Elasticidades constantes e independentes entre segmentos: o modelo não captura canibalização entre marcas nem reação dos concorrentes ao Proposto.",
  "O hedge é representado como custo travado médio; não modela margem de garantia, base nem custo de carregamento.",
  "Despesas abaixo do lucro bruto (marketing, logística de distribuição, SG&A) não estão no escopo do modelo.",
  "As metas do dashboard são exemplos; devem ser calibradas pelo comitê com dados internos de sell-out e custo.",
];
