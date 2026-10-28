import { ScenarioProvider } from "@/components/scenario/ScenarioContext";
import { Diagnosis } from "@/components/sections/Diagnosis";
import { DistributionMap } from "@/components/sections/DistributionMap";
import { Governance } from "@/components/sections/Governance";
import { Hero } from "@/components/sections/Hero";
import { KpiDashboard } from "@/components/sections/KpiDashboard";
import { MethodologyTeaser } from "@/components/sections/MethodologyTeaser";
import { Pillars } from "@/components/sections/Pillars";
import { Roadmap } from "@/components/sections/Roadmap";
import { Simulator } from "@/components/sections/Simulator";

export default function Home() {
  return (
    <ScenarioProvider>
      <Hero />
      <Diagnosis />
      <Simulator />
      <DistributionMap />
      <Pillars />
      <KpiDashboard />
      <Governance />
      <Roadmap />
      <MethodologyTeaser />
    </ScenarioProvider>
  );
}
