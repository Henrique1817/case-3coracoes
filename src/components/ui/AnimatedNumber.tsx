"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  format: (v: number) => string;
  duration?: number;
  /** Anima de 0 até o valor na primeira vez que entra na tela. */
  fromZero?: boolean;
  className?: string;
}

/**
 * O texto inicial é renderizado uma única vez; as atualizações seguintes são
 * escritas direto no nó, para não re-renderizar a árvore a cada frame.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 0.6,
  fromZero = false,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [initialText] = useState(() => format(fromZero ? 0 : value));
  const last = useRef(fromZero ? 0 : value);

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduce) {
      node.textContent = format(value);
      last.current = value;
      return;
    }
    const controls = animate(last.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = format(v);
        last.current = v;
      },
    });
    return () => controls.stop();
  }, [value, inView, reduce, duration, format]);

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {initialText}
    </span>
  );
}
