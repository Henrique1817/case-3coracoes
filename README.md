# Case 3corações · por Henrique Miguel

Estudo de caso e simulador interativo para a 2ª etapa do processo seletivo da **PIB The New College**.

> **Pergunta do case:** como proteger margem e resultado sem depender continuamente de aumento de preço?
>
> **Tese:** sair do repasse uniforme e gerir a margem de forma segmentada e integrada, em que
> **Margem = Custo + Mix + Preço + Execução**.

**Aviso importante:** este não é um site oficial do Grupo 3corações e não usa marcas ou logotipos
oficiais. **Todos os números são fictícios**, simulados a partir das premissas do enunciado do case
(custo do café verde +40%, repasse de +25%, volume −8%, margem bruta −4 p.p.). O site exibe o selo
permanente "Dados simulados · premissas do case" e a página `/metodologia` com cada hipótese e fórmula.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Recharts (gráficos) e Framer Motion (microinterações)
- d3-geo, usado **apenas em build** para pré-processar o mapa do Brasil em paths SVG
- Vitest para os testes do motor de cálculo

Sem backend e sem API externa em runtime: todos os cálculos rodam no navegador, e as páginas são
geradas como HTML estático.

## Como rodar

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # testes do motor de simulação
npm run check:model  # imprime calibração, Atual vs. Proposto, ponte, regiões e série de 24 meses
npm run build        # build de produção
```

## Estrutura

```
src/
  app/
    page.tsx              # home com todas as seções
    metodologia/page.tsx  # metodologia e premissas (gerada a partir do modelo)
  data/
    model.ts              # ← TODAS as premissas editáveis
    site.ts               # nome, links (LinkedIn, GitHub, YouTube) e navegação
    brazil-map.ts         # paths SVG do mapa (gerado por scripts/build-map.mjs)
  lib/
    simulation.ts         # motor de cálculo: funções puras, sem UI
    simulation.test.ts    # garante que o cenário Atual reproduz o case
    methodology.ts        # textos de fórmulas, montados a partir das constantes do modelo
    format.ts             # formatação pt-BR (%, p.p., R$ ilustrativo)
  components/
    layout/               # Header, Footer, selo de dados simulados
    scenario/             # contexto compartilhado (alavancas → resultados)
    simulator/            # painel de alavancas, cards, ponte de margem, gráficos
    sections/             # Hero, Diagnóstico, Simulador, Mapa, Pilares, KPIs, Governança, Roadmap
    ui/                   # Slider, Section, AnimatedNumber, Sparkline, Status, Icon
scripts/
  build-map.mjs           # baixa o GeoJSON dos estados e gera src/data/brazil-map.ts
  check-model.ts          # diagnóstico numérico do modelo
  check-encoding.mjs      # verifica se os fontes estão em UTF-8 válido
```

## O modelo de premissas (`src/data/model.ts`)

O modelo é uma grade de **células segmento × canal × região** (7 combinações segmento-canal × 5
regiões = 35 células). Cada célula tem receita, volume (kg), CPV (café, outros variáveis e fixo),
verba promocional e elasticidade. Todas as métricas são somas de células, então os filtros do
dashboard funcionam sobre o mesmo cálculo do simulador.

| Bloco | O que define |
| --- | --- |
| `CASE_FACTS` | Os números do enunciado: alvos de calibração do cenário Atual |
| `BASE` | Receita-base (R$ 5.000 mi **ilustrativos**), parcela fixa do CPV, preços dos concorrentes, verba |
| `SEGMENTS` | Entrada, Tradicional, Premium/Gourmet e Cápsulas: receita, preço/kg, margem, elasticidade, peso do café |
| `CHANNELS` | Varejo, Food Service e Cápsulas: verba promocional, multiplicador de elasticidade |
| `REGIONS` | N, NE, CO, SE e S: participação, market share e pressão de marcas regionais/próprias |
| `CURRENT_LEVERS` / `PROPOSED_LEVERS` | Cenário Atual (repasse uniforme de 25%) e valores iniciais dos sliders |
| `LEVER_EFFECTS` | Efeito de cada alavanca (alta travada pelo hedge, desconto do conilon, embalagens menores etc.) |
| `COFFEE_PATH`, `ROLLOUT` | Trajetória do café em 24 meses e janelas do roadmap |
| `SKUS` | SKUs fictícios da tabela de margem |

### Calibração automática

Ao carregar o módulo, `src/lib/simulation.ts` resolve por bisseção duas grandezas para que o cenário
**Atual** reproduza exatamente o case, mesmo depois de qualquer edição nas premissas:

1. **escala de elasticidade** → volume do Atual = −8%;
2. **peso do café verde no CPV** → margem do Atual = −4 p.p.

Os testes (`npm test`) falham se essa reprodução quebrar.

### Como editar

1. Altere valores em `src/data/model.ts` (por exemplo, `PROPOSED_LEVERS.passThrough.entrada` ou
   `LEVER_EFFECTS.hedgeLockedIncrease`).
2. Rode `npm run check:model` para ver o efeito em margem, volume, lucro bruto, ponte e regiões.
3. Rode `npm test` para confirmar que o Atual continua reproduzindo o case.
4. A página `/metodologia` se atualiza sozinha: as tabelas e fórmulas são lidas do próprio modelo.

Para trocar nome, links do LinkedIn/GitHub e o vídeo do YouTube, edite `src/data/site.ts`
(os valores atuais são placeholders).

## Principais fórmulas

- Volume: `kg = kg₀ × (1 + Δp)^ε`, com `ε = ε_segmento × multiplicador_canal × fator_região × k`
- Café efetivo: `(1 − hedge) × alta_spot + hedge × alta_travada`, com descontos de compra direta e blend
- CPV: `café + outros variáveis × (1 − eficiência) + fixo × (1 − eficiência)`, com fixo constante (desalavancagem)
- Margem bruta: `Σ lucro bruto / Σ receita líquida`
- Ponte de margem: alavancas ligadas em sequência (Custo → Mix → Preço → Execução); a soma fecha exatamente

A lista completa, com limitações do modelo, está em `/metodologia`.

## Deploy na Vercel

O projeto é estático e não precisa de variáveis de ambiente.

**Pelo painel:**

1. Suba o projeto para um repositório Git (GitHub, GitLab ou Bitbucket).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. A Vercel detecta Next.js automaticamente (build `next build`, sem configuração extra). Clique em **Deploy**.

**Pela CLI:**

```bash
npm i -g vercel
vercel          # primeiro deploy (preview), vincula o projeto
vercel --prod   # publica em produção
```

## Regerar o mapa

O mapa usa geometria pública dos estados brasileiros (projeto click_that_hood), projetada e
simplificada em build. Para regerar `src/data/brazil-map.ts`:

```bash
npm run build:map
```

O script baixa o GeoJSON se ele não existir em `scripts/` (o arquivo bruto não é versionado).

---

Henrique Miguel · engenheiro de software e analista de performance · PIB The New College, processo seletivo (2ª etapa)
