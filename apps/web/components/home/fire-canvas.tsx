"use client";

import { useEffect, useRef } from "react";

/**
 * Flames licking up from the bottom edge of whatever contains this canvas.
 *
 * Additive particles, not video: a few hundred soft blobs rise, shrink and cool
 * from glow to ember to crimson, with bright sparks thrown above them. Sprites
 * are pre-rendered once per colour so each frame is only drawImage calls.
 *
 * Stops drawing whenever it is off-screen, caps the pixel ratio at 1.5, thins
 * out on narrow screens, and renders nothing under reduced motion.
 */

type Flame = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  seed: number;
  spark: boolean;
};

// Glow → ember → burnt orange → crimson: the colour a flame cools through.
const STAGES: [number, number, number][] = [
  [255, 222, 180],
  [240, 150, 90],
  [212, 98, 47],
  [163, 39, 42],
  [94, 15, 17],
];

function sprite(rgb: [number, number, number]) {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  const [r, gr, b] = rgb;
  grad.addColorStop(0, `rgba(${r},${gr},${b},1)`);
  grad.addColorStop(0.4, `rgba(${r},${gr},${b},0.45)`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export default function FireCanvas({
  className,
  density = 1,
}: {
  className?: string;
  /** Multiplier on the particle count. 1 ≈ 140 flames across 1440px. */
  density?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sprites = STAGES.map(sprite);
    const flames: Flame[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;

    const spawn = (f?: Flame, scatter = false): Flame => {
      const spark = Math.random() < 0.12;
      const max = spark ? 90 + Math.random() * 90 : 45 + Math.random() * 70;
      const next: Flame = f ?? ({} as Flame);
      next.x = Math.random() * w;
      next.y = h + 10;
      next.vx = (Math.random() - 0.5) * (spark ? 1.4 : 0.5);
      next.vy = -(spark ? 1.8 + Math.random() * 2.8 : 1.1 + Math.random() * 1.9);
      next.life = scatter ? Math.random() * max : 0;
      next.max = max;
      next.size = spark ? 1.5 + Math.random() * 2.5 : 10 + Math.random() * 26;
      next.seed = Math.random() * 100;
      next.spark = spark;
      return next;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.max(50, (w / 1440) * 150) * density);
      while (flames.length < target) flames.push(spawn(undefined, true));
      flames.length = target;
    };

    const draw = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);

      // The bed of the fire: a crimson-to-ember band the flames rise out of.
      const bed = ctx.createLinearGradient(0, h, 0, h * 0.55);
      bed.addColorStop(0, "rgba(212, 98, 47, 0.55)");
      bed.addColorStop(0.35, "rgba(163, 39, 42, 0.28)");
      bed.addColorStop(1, "rgba(94, 15, 17, 0)");
      ctx.fillStyle = bed;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      ctx.globalCompositeOperation = "lighter";

      for (const f of flames) {
        f.life += 1;
        const t = f.life / f.max;
        if (t >= 1) {
          spawn(f);
          continue;
        }
        f.x += f.vx + Math.sin(f.life * 0.06 + f.seed) * (f.spark ? 0.9 : 0.45);
        f.y += f.vy;

        const stage = Math.min(STAGES.length - 1, Math.floor(t * STAGES.length));
        const img = sprites[f.spark ? 0 : stage];
        if (!img) continue;
        const size = f.spark ? f.size : f.size * (1 - t * 0.7);
        // Flames are tongues, not orbs: stretch each blob upward as it rises.
        const stretch = f.spark ? 1 : 1.6 + t * 1.4;
        ctx.globalAlpha = (f.spark ? 0.95 : 0.5) * (1 - t) * Math.min(1, t * 6);
        ctx.drawImage(
          img,
          f.x - size,
          f.y - size * stretch,
          size * 2,
          size * 2 * stretch,
        );
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) =>
      entry?.isIntersecting ? start() : stop(),
    );
    io.observe(canvas);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
