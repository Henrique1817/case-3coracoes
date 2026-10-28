"use client";

import {
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PROPOSED_LEVERS, type Levers } from "@/data/model";
import {
  marginBridge,
  simulate,
  simulateCurrent,
  simulateTimeline,
  type Bridge,
  type ScenarioResult,
  type TimelinePoint,
} from "@/lib/simulation";

interface ScenarioState {
  levers: Levers;
  setLevers: (updater: (prev: Levers) => Levers) => void;
  resetLevers: () => void;
  current: ScenarioResult;
  proposed: ScenarioResult;
  bridge: Bridge;
  timeline: TimelinePoint[];
  isDirty: boolean;
}

const ScenarioContext = createContext<ScenarioState | null>(null);

const CURRENT = simulateCurrent();

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [levers, setLeversState] = useState<Levers>(PROPOSED_LEVERS);
  const deferred = useDeferredValue(levers);

  const proposed = useMemo(() => simulate(levers), [levers]);
  const bridge = useMemo(() => marginBridge(levers), [levers]);
  const timeline = useMemo(() => simulateTimeline(deferred), [deferred]);

  const setLevers = useCallback(
    (updater: (prev: Levers) => Levers) => setLeversState(updater),
    [],
  );
  const resetLevers = useCallback(() => setLeversState(PROPOSED_LEVERS), []);

  const value = useMemo<ScenarioState>(
    () => ({
      levers,
      setLevers,
      resetLevers,
      current: CURRENT,
      proposed,
      bridge,
      timeline,
      isDirty: JSON.stringify(levers) !== JSON.stringify(PROPOSED_LEVERS),
    }),
    [levers, setLevers, resetLevers, proposed, bridge, timeline],
  );

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error("useScenario deve ser usado dentro de ScenarioProvider");
  return ctx;
}
