"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/lib/use-in-view";

interface CountUpProps {
  /** The final value, digits only — e.g. 17. Any surrounding text (like "#") stays outside. */
  value: number;
  duration?: number;
  className?: string;
}

/** Counts up from 0 to `value` once it scrolls into view. */
export default function CountUp({ value, duration = 1200, className }: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
