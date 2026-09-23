"use client";

import { useEffect, useRef } from "react";

/**
 * A section that knows how far it has been scrolled.
 *
 * Writes two custom properties onto its own element, every animation frame
 * the page scrolls:
 *
 *   --progress       0 → 1, linear
 *   --progress-ease  0 → 1, ease-in-out (cubic)
 *
 * CSS does the rest with calc() — a sword's rotation, a title's scale, a line
 * burning along a timeline. No per-frame React renders, and it works in every
 * browser (unlike animation-timeline, which Safari lacks).
 *
 * `mode="through"`: 0 as the top edge enters the viewport, 1 as the bottom edge
 * leaves it. `mode="exit"`: 0 while the section's top sits at the top of the
 * viewport, 1 once the section has scrolled fully out — for the hero.
 *
 * Reduced motion pins both values at 0, so every effect rests in its first
 * frame.
 */

type Mode = "through" | "exit";

type ScrollSceneProps = React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div";
  mode?: Mode;
  children: React.ReactNode;
};

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function ScrollScene({
  as: Tag = "section",
  mode = "through",
  children,
  ...rest
}: ScrollSceneProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const set = (p: number) => {
      el.style.setProperty("--progress", p.toFixed(4));
      el.style.setProperty("--progress-ease", easeInOut(p).toFixed(4));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      set(0);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = mode === "exit" ? -r.top / r.height : (vh - r.top) / (vh + r.height);
      set(Math.min(1, Math.max(0, raw)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [mode]);

  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} {...rest}>
      {children}
    </Tag>
  );
}
