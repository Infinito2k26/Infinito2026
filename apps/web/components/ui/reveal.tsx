"use client";

import { useInView } from "@/lib/use-in-view";
import styles from "./reveal.module.css";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger index — multiplied into a CSS transition-delay. */
  index?: number;
}

/** Fades and rises an element in once it scrolls into view. Plays once. */
export default function Reveal({ children, className = "", index = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${inView ? styles.visible : ""} ${className}`}
      style={{ transitionDelay: inView ? `${Math.min(index, 8) * 70}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
