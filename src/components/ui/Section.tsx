"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "default" | "cream" | "dark";
}

const tones = {
  default: "bg-cream-100",
  cream: "bg-cream-200/70",
  dark: "bg-coffee-800 text-cream-100",
};

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className = "",
  tone = "default",
}: SectionProps) {
  const reduce = useReducedMotion();
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`${tones[tone]} py-20 sm:py-28 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.header
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-3xl"
        >
          <p className={`eyebrow ${tone === "dark" ? "text-caramel-200" : ""}`}>{eyebrow}</p>
          <h2
            id={`${id}-title`}
            className={`mt-3 text-3xl leading-tight sm:text-4xl ${tone === "dark" ? "text-cream-50" : ""}`}
          >
            {title}
          </h2>
          {lead && (
            <p
              className={`mt-4 text-lg leading-relaxed ${tone === "dark" ? "text-cream-200/85" : "text-coffee-600"}`}
            >
              {lead}
            </p>
          )}
        </motion.header>
        {children}
      </div>
    </section>
  );
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
