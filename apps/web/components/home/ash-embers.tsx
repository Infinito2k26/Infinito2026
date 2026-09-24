"use client";

import { useEffect, useRef } from "react";
import { flameSprites } from "@/components/home/flame-sprites";
import styles from "./ash-embers.module.css";

/**
 * Embers and ash drifting up over the whole landing page, as if the fire in
 * the hero were still burning somewhere below.
 *
 * One fixed, full-viewport canvas above the content and under the navbar,
 * which never takes a click. Embers rise on their own draft, sway, flicker,
 * and cool from glow through ember to crimson before they go out; ash is grey
 * flakes tumbling more slowly, some still alight at the edge. Motes sit at
 * different depths — far ones small, slow and dim, the nearest few large and
 * soft as if out of focus — and scrolling drags the near ones further than
 * the far ones, so they read as air between you and the page.
 *
 * Cheap by construction: sprites are pre-rendered (flame-sprites), a frame is
 * a few dozen drawImage calls, the pixel ratio is capped at 1.5, the count
 * scales with the viewport, and the loop stops while the tab is hidden.
 * Nothing at all under reduced motion.
 *
 * Switched on and off with ASH_EMBERS in app/page.tsx.
 */

type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  /** 0 far … 1 near */
  depth: number;
  seed: number;
  ash: boolean;
  /** Ash only: still glowing at the edge as it starts to fall. */
  alight: boolean;
};

const ASH = "rgb(128, 116, 106)";

export default function AshEmbers({
  density = 1,
}: {
  /** Multiplier on the count. 1 ≈ 70 motes on a 1440 × 900 screen. */
  density?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sprites = flameSprites();
    const motes: Mote[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let scroll = window.scrollY;

    const spawn = (m: Mote = {} as Mote, anywhere = false): Mote => {
      m.ash = Math.random() < 0.22;
      m.alight = m.ash && Math.random() < 0.5;
      // Most of the air is far away.
      m.depth = Math.random() ** 1.7;
      m.x = Math.random() * w;
      // Drifts in from below, or kindles where it is.
      m.y = anywhere || Math.random() < 0.55 ? Math.random() * h : h + 16;
      m.vx = (Math.random() - 0.5) * 10;
      m.vy = m.ash
        ? -(5 + 12 * m.depth + Math.random() * 6)
        : -(16 + 38 * m.depth + Math.random() * 18);
      m.max = m.ash ? 9 + Math.random() * 8 : 4.5 + Math.random() * 6.5;
      m.life = anywhere ? Math.random() * m.max * 0.8 : 0;
      m.size = m.ash
        ? 1.2 + 2.2 * m.depth + Math.random()
        : 1.2 + 2.6 * m.depth + Math.random() * 0.8;
      m.seed = Math.random() * 1000;
      return m;
    };

    /** Moves a mote on; false if it went out and was replaced. */
    const step = (m: Mote, dt: number, dy: number, wind: number) => {
      m.life += dt;
      const sway = Math.sin(m.life * (0.5 + (m.seed % 1) * 0.9) + m.seed) * (m.ash ? 16 : 9);
      m.x += (m.vx + wind * (0.35 + 0.65 * m.depth) + sway) * dt;
      m.y += m.vy * dt - dy * (0.08 + 0.32 * m.depth);
      if (m.life >= m.max || m.y < -24 || m.y > h + 40 || m.x < -24 || m.x > w + 24) {
        spawn(m);
        return false;
      }
      return true;
    };

    const drawEmber = (m: Mote) => {
      const t = m.life / m.max;
      const flicker = 0.7 + 0.3 * Math.sin(m.life * (8 + (m.seed % 1) * 7) + m.seed);
      const envelope = Math.min(1, m.life / 0.5) * (1 - t * t);
      const near = m.depth > 0.86;
      // The glow, in the colour it has cooled to (ember → crimson → ash-red),
      // drawn out a little along its climb so it reads as a spark, not a star.
      const glow = sprites[Math.min(sprites.length - 1, 1 + Math.floor(t * 3.4))]!;
      const r = near ? m.size * 5 : m.size * 3.4;
      const tail = near ? 1 : 1 + -m.vy / 70;
      ctx.globalAlpha = envelope * flicker * (near ? 0.34 : 0.6 + 0.4 * m.depth);
      ctx.drawImage(glow, m.x - r, m.y - r * tail, r * 2, r * 2 * tail);
      // A hot heart while it's young: gold, white-hot only at first.
      if (!near && t < 0.6) {
        const c = m.size * 1.15;
        ctx.globalAlpha = envelope * flicker * (1 - t / 0.6) * 0.9;
        ctx.drawImage(sprites[t < 0.2 ? 0 : 1]!, m.x - c, m.y - c, c * 2, c * 2);
      }
    };

    const drawAsh = (m: Mote) => {
      const t = m.life / m.max;
      const envelope = Math.min(1, m.life / 1.2) * (1 - t);
      // A tumbling flake: a sliver that turns, widening and narrowing.
      const turn = m.life * (0.8 + (m.seed % 1) * 1.6) + m.seed;
      const s = m.size;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(turn);
      ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(turn * 1.3)));
      if (m.alight && t < 0.5) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = envelope * (1 - t * 2) * 0.55;
        ctx.drawImage(sprites[1]!, -s * 2.2, -s * 2.2, s * 4.4, s * 4.4);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = envelope * (0.35 + 0.35 * m.depth);
      ctx.fillStyle = ASH;
      ctx.fillRect(-s, -s * 0.6, s * 2, s * 1.2);
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      // Scrolling drags the air a little. Clamped, so a jump to an anchor
      // doesn't fling everything off screen.
      const dy = Math.max(-120, Math.min(120, window.scrollY - scroll));
      scroll = window.scrollY;
      // A slow wind that shifts over a minute or so.
      const wind = Math.sin(clock * 0.07) * 9 + Math.sin(clock * 0.023 + 1.7) * 6;

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      // Ash painted as ash; embers added as light on top.
      for (const m of motes) {
        if (m.ash && step(m, dt, dy, wind)) drawAsh(m);
      }
      ctx.globalCompositeOperation = "lighter";
      for (const m of motes) {
        if (!m.ash && step(m, dt, dy, wind)) drawEmber(m);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(120, Math.max(30, (w * h) / 18000)) * density);
      while (motes.length < target) motes.push(spawn(undefined, true));
      motes.length = target;
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      scroll = window.scrollY;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return <canvas ref={ref} className={styles.embers} aria-hidden="true" />;
}
