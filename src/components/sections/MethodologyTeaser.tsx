import Link from "next/link";
import { Reveal, Section } from "@/components/ui/Section";
import { CASE_FACTS } from "@/data/model";
import { CALIBRATION, simulateCurrent } from "@/lib/simulation";
import { fmtNumber, fmtPP, fmtPct } from "@/lib/format";

export function MethodologyTeaser() {
  const t = simulateCurrent().totals;
  const items = [
    {
      title: "Dados 100% simulados",
      text: "Nenhum número é dado real da empresa. Tudo deriva das premissas do enunciado e de hipóteses explícitas.",
    },
    {
      title: "Atual = case",
      text: `Calibração automática: volume ${fmtPct(t.volumeChange, 1, true)} (alvo ${fmtPct(CASE_FACTS.volumeChange, 0, true)}) e margem ${fmtPP(t.grossMarginChangePP)} (alvo ${fmtPP(CASE_FACTS.grossMarginChangePP, 0)}). Escala de elasticidade ${fmtNumber(CALIBRATION.elasticityScale, 2)}.`,
    },
    {
      title: "Premissas editáveis",
      text: "Um único arquivo concentra receita-base, segmentos, canais, regiões e o efeito de cada alavanca.",
    },
  ];
  return (
    <Section
      id="metodologia"
      eyebrow="Metodologia e premissas"
      title="Transparência sobre cada número"
      lead="O simulador é um modelo de decisão, não uma previsão. Cada hipótese e fórmula está documentada."
      tone="cream"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 0.06}>
            <div className="card h-full p-6">
              <h3 className="text-lg">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-coffee-600">{it.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Link
        href="/metodologia"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-wine-600 px-5 py-2.5 text-sm font-semibold text-wine-600 transition hover:bg-wine-600 hover:text-cream-50"
      >
        Ver metodologia completa <span aria-hidden>→</span>
      </Link>
    </Section>
  );
}
