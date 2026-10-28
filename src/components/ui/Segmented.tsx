"use client";

import { motion } from "framer-motion";
import { useId } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
}: SegmentedProps<T>) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap rounded-full border border-coffee-100 bg-cream-50 p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative rounded-full font-medium transition-colors ${
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
            } ${active ? "text-cream-50" : "text-coffee-600 hover:text-coffee-800"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-wine-600"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface SelectProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function Select<T extends string>({ label, options, value, onChange }: SelectProps<T>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-coffee-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-xl border border-coffee-100 bg-cream-50 px-3 py-2 text-sm font-medium text-coffee-800 shadow-soft"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
