"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal, Section } from "@/components/ui/Section";
import { aggregate, simulateCurrent } from "@/lib/simulation";
import { fmtPct } from "@/lib/format";

const current = simulateCurrent();
const entrada = aggregate(current.cells, { segment: "entrada" });
const capsulas = aggregate(current.cells, { segment: "capsulas" });

const CARDS: { title: string; icon: IconName; pressure: string; reading: string }[] = [
  {
    title: "Varejo",
    icon: "cart",
    pressure: "Resiste a novos aumentos e exige investimento promocional.",
    reading:
      "As redes têm poder de barganha e o café é item gerador de tráfego, muito visado em preço. Cada repasse vira negociação de verba.",
  },
  {
    title: "Consumidor",
    icon: "cup",
    pressure: "Migra para marcas mais baratas, embalagens menores ou reduz o consumo.",
    reading:
      "Nas faixas de entrada, o consumidor é fiel ao hábito, não à marca: troca quando o preço na gôndola sobe.",
  },
  {
    title: "Concorrência",
    icon: "tag",
    pressure: "Marcas regionais e próprias ganham participação.",
    reading:
      "Concorrentes que repassam menos abrem gap de preço exatamente onde o volume está: nas linhas de entrada.",
  },
];

export function Diagnosis() {
  return (
    <Section
      id="diagnostico"
      eyebrow="Contexto e diagnóstico"
      title="Por que o repasse uniforme falhou"
      lead="Repassar parte do custo protegeu a margem só parcialmente e já cobra seu preço em volume. Continuar subindo preço de forma linear aprofunda o problema."
      tone="cream"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {CARDS.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.08}>
            <article className="card h-full p-6 transition-shadow hover:shadow-lift">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-wine-50 text-wine-600">
                  <Icon name={c.icon} />
                </span>
                <h3 className="text-xl">{c.title}</h3>
              </div>
              <p className="mt-4 font-medium text-coffee-800">{c.pressure}</p>
              <p className="mt-3 text-sm leading-relaxed text-coffee-600">{c.reading}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-8 grid gap-6 rounded-2xl border border-wine-100 bg-wine-50/60 p-6 sm:p-8 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="eyebrow">Leitura do problema</p>
            <p className="mt-3 font-serif text-2xl leading-snug text-coffee-800">
              O repasse linear de 25% custa volume e share nas categorias de entrada e protege a
              margem só em parte.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-cream-50 p-4">
              <dt className="text-xs text-coffee-500">Volume · Entrada (simulado)</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-bad-600">
                {fmtPct(entrada.volumeChange, 1, true)}
              </dd>
            </div>
            <div className="rounded-xl bg-cream-50 p-4">
              <dt className="text-xs text-coffee-500">Volume · Cápsulas (simulado)</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-coffee-700">
                {fmtPct(capsulas.volumeChange, 1, true)}
              </dd>
            </div>
            <p className="col-span-2 text-xs leading-relaxed text-coffee-500">
              Mesma alta de preço, reações diferentes: a elasticidade não é igual entre marcas. É
              aí que mora a oportunidade.
            </p>
          </dl>
        </div>
      </Reveal>
    </Section>
  );
}
