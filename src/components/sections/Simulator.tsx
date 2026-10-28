"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";
import { LeverPanel } from "@/components/simulator/LeverPanel";
import { MarginWaterfall } from "@/components/simulator/MarginWaterfall";
import { MobileResultBar } from "@/components/simulator/MobileResultBar";
import { ResultCards } from "@/components/simulator/ResultCards";
import { SegmentComparison } from "@/components/simulator/SegmentComparison";
import { TimelineChart } from "@/components/simulator/TimelineChart";
import { Section } from "@/components/ui/Section";

export function Simulator() {
  const panelRef = useRef<HTMLDivElement>(null);
  const panelInView = useInView(panelRef, { margin: "-30% 0px -30% 0px" });

  return (
    <Section
      id="simulador"
      eyebrow="Simulador"
      title="Do repasse uniforme à margem segmentada"
      lead={
        <>
          Mova as alavancas e veja, em tempo real, o efeito sobre margem, volume, receita e lucro
          bruto. O cenário <strong className="font-semibold text-coffee-800">Atual</strong> é fixo e
          reproduz o case (repasse de 25%, volume −8%, margem −4 p.p.).
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
        <div
          ref={panelRef}
          className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1"
        >
          <LeverPanel />
        </div>
        <div className="min-w-0 space-y-6">
          <ResultCards />
          <MarginWaterfall />
          <SegmentComparison />
          <TimelineChart />
        </div>
      </div>
      <MobileResultBar visible={panelInView} />
    </Section>
  );
}
