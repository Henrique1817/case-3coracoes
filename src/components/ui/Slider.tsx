"use client";

import { useId, type ReactNode } from "react";

interface SliderProps {
  label: string;
  hint?: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  /** Valor do cenário Atual, exibido como referência. */
  reference?: number;
}

export function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
  reference,
}: SliderProps) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="group">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-coffee-800">
          {label}
        </label>
        <output htmlFor={id} className="tabular text-sm font-semibold text-wine-600">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="slider mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {(hint || reference !== undefined) && (
        <p id={`${id}-hint`} className="text-xs leading-snug text-coffee-500">
          {hint}
          {reference !== undefined && (
            <span className="text-coffee-500">
              {hint ? " · " : ""}Atual: {format(reference)}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
