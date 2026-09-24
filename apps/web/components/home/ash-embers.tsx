"use client";

import { useEffect, useRef } from "react";
import { flameSprites } from "@/components/home/flame-sprites";
import { SPARK_EVENT, type SparkDetail } from "@/components/home/sparks";
import styles from "./ash-embers.module.css";

/**
 * Embers and ash in the air over the whole landing page — moving like the
 * real thing, and moving with the reader.
 *
 * The air: every mote rides a slowly turning field of eddies (the curl of 3D
 * value noise, so the flow swirls without ever bunching up) plus a drifting
 * wind. Nothing is on rails: each mote has momentum and is dragged towards
 * the air around it — small ones follow it closely, big ones lag. Embers are
 * buoyant while hot, so they climb fast, then slow, wander and go out as they
 * cool; ash is heavy and flutters down.
 *
 * The reader stirs it:
 *  - the pointer pushes the air it moves through and leaves a swirl behind;
 *    embers it fans flare up and burn a little longer;
 *  - scrolling gusts the air, and drags near motes further than far ones;
 *  - a click throws a small shower of sparks;
 *  - burning fight bills send sparks up from their burning edge (PaperBurn,
 *    through the `embers:spark` event in ./sparks).
 *
 * Depth: far motes are small, slow and dim; the nearest are large and soft,
 * as if out of focus, and shift against the pointer a little for parallax.
 * Fast sparks are drawn as short streaks along their path.
 *
 * Cost: one fixed canvas, pre-rendered sprites, around a thousand noise
 * lookups and a hundred-odd drawImage calls a frame; pixel ratio capped at
 * 1.5; paused while the tab is hidden; nothing at all under reduced motion.
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
  /** 0…1: how hard the pointer has just fanned it. */
  fan: number;
};

const ASH = "rgb(128, 116, 106)";
/** Eddy sizes: broad currents and smaller swirls inside them (1 / px). */
const BROAD = 1 / 320;
const FINE = 1 / 130;
/** How far the pointer's wake reaches, px. */
const WAKE = 170;
/** Sparks alive at once, from clicks and burning bills. */
const MAX_SPARKS = 90;

/** 3D value noise in −1…1 over a seeded permutation. */
function valueNoise3() {
  let s = Math.floor(Math.random() * 2147483646) + 1;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = p[i]!;
    p[i] = p[j]!;
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]!;
  const val = new Float32Array(256);
  for (let i = 0; i < 256; i++) val[i] = rnd() * 2 - 1;
  const fade = (t: number) => t * t * (3 - 2 * t);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const at = (i: number) => val[perm[i]!]!;

  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const X = xi & 255;
    const Y = yi & 255;
    const Z = zi & 255;
    const u = fade(x - xi);
    const v = fade(y - yi);
    const w = fade(z - zi);
    const A = perm[X]! + Y;
    const B = perm[X + 1]! + Y;
    const AA = perm[A]! + Z;
    const AB = perm[A + 1]! + Z;
    const BA = perm[B]! + Z;
    const BB = perm[B + 1]! + Z;
    return mix(
      mix(mix(at(AA), at(BA), u), mix(at(AB), at(BB), u), v),
      mix(mix(at(AA + 1), at(BA + 1), u), mix(at(AB + 1), at(BB + 1), u), v),
      w,
    );
  };
}

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
    const noise = valueNoise3();
    const motes: Mote[] = [];
    const sparks: Mote[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let clock = 0;

    // Scroll: last position, and a smoothed speed (px/s) for gusts.
    let scroll = window.scrollY;
    let scrollVel = 0;
    // Pointer: position, smoothed velocity (px/s), when it last moved.
    let px = -1e4;
    let py = -1e4;
    let pvx = 0;
    let pvy = 0;
    let pt = 0;
    // Parallax offset (px, applied × depth), easing towards its target.
    let parX = 0;
    let parY = 0;
    let parTX = 0;
    let parTY = 0;

    const curlA = { x: 0, y: 0 };
    const curlB = { x: 0, y: 0 };
    // The curl of the noise at (x, y, z): a swirling, divergence-free flow.
    const curl = (x: number, y: number, z: number, out: { x: number; y: number }) => {
      const e = 0.1;
      out.x = (noise(x, y + e, z) - noise(x, y - e, z)) / (2 * e);
      out.y = -(noise(x + e, y, z) - noise(x - e, y, z)) / (2 * e);
    };

    const spawn = (m: Mote = {} as Mote, anywhere = false): Mote => {
      m.ash = Math.random() < 0.22;
      m.alight = m.ash && Math.random() < 0.5;
      // Most of the air is far away.
      m.depth = Math.random() ** 1.7;
      m.x = Math.random() * w;
      if (m.ash) {
        // Ash settles from above, or is already hanging in the air.
        m.y = anywhere || Math.random() < 0.6 ? Math.random() * h : -12;
        m.vx = (Math.random() - 0.5) * 14;
        m.vy = m.alight ? -(8 + Math.random() * 14) : (Math.random() - 0.5) * 8;
        m.max = 10 + Math.random() * 8;
        m.size = 1.2 + 2.2 * m.depth + Math.random();
      } else {
        // Embers drift up from below, or kindle where they are.
        m.y = anywhere || Math.random() < 0.5 ? Math.random() * h : h + 20;
        m.vx = (Math.random() - 0.5) * 18;
        m.vy = -(10 + Math.random() * 30);
        m.max = 5 + Math.random() * 6;
        m.size = 1.2 + 2.6 * m.depth + Math.random() * 0.8;
      }
      m.life = anywhere ? Math.random() * m.max * 0.8 : 0;
      m.seed = Math.random() * 1000;
      m.fan = 0;
      return m;
    };

    const throwAt = (x: number, y: number, n: number, power: number, spread: number) => {
      for (let i = 0; i < n && sparks.length < MAX_SPARKS; i++) {
        // Mostly upward, fanned out by `spread` (radians either side).
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2 * spread;
        const speed = (70 + Math.random() * 190) * power;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life: 0,
          max: 0.8 + Math.random() * 1.4,
          size: 0.8 + Math.random() * 1.2,
          depth: 0.45 + Math.random() * 0.35,
          seed: Math.random() * 1000,
          ash: false,
          alight: false,
          fan: 0.4,
        });
      }
    };

    /** Moves a mote on through the air; false once it's out or gone. */
    const advance = (
      m: Mote,
      dt: number,
      z: number,
      turb: number,
      wind: number,
      lift: number,
      pSpeed: number,
      dScroll: number,
    ) => {
      m.life += dt;
      const t = m.life / m.max;
      if (t >= 1) return false;

      // The air where it is: broad currents, finer swirls, the wind, and an
      // updraft or downdraft while the page is scrolling.
      curl(m.x * BROAD, m.y * BROAD, z, curlA);
      curl(m.x * FINE + 31.7, m.y * FINE + 17.3, z * 1.7, curlB);
      let ax = (curlA.x + 0.5 * curlB.x) * turb + wind;
      let ay = (curlA.y + 0.5 * curlB.y) * turb + lift;

      // The pointer's wake: air dragged along with it, curling either side.
      if (pSpeed > 30) {
        const dx = m.x + parX * m.depth - px;
        const dy = m.y + parY * m.depth - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < WAKE * WAKE) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / WAKE) ** 2;
          const side = dx * pvy - dy * pvx > 0 ? 1 : -1;
          ax += pvx * f * 0.6 + (-dy / d) * pSpeed * f * 0.25 * side;
          ay += pvy * f * 0.6 + (dx / d) * pSpeed * f * 0.25 * side;
          m.fan = Math.min(1, m.fan + (pSpeed * f * dt) / 260);
        }
      }
      m.fan *= Math.exp(-dt * 1.4);

      // Dragged towards the air: small motes follow it closely, big ones lag.
      const blend = 1 - Math.exp(-((m.ash ? 2.4 : 1.8) / Math.sqrt(m.size)) * dt);
      m.vx += (ax - m.vx) * blend;
      m.vy += (ay - m.vy) * blend;
      if (m.ash) {
        // Heavy: it settles, fluttering.
        m.vy += (12 + 10 * m.depth) * dt;
      } else {
        // Buoyant while hot, more so when fanned — which also keeps it alight.
        const heat = 1 - t;
        m.vy -= (30 + 46 * m.depth) * heat * heat * (1 + m.fan) * dt;
        m.life = Math.max(0, m.life - m.fan * dt * 0.5);
      }

      // Near motes cross the screen faster; scrolling drags them further.
      const pace = 0.6 + 0.8 * m.depth;
      m.x += m.vx * pace * dt;
      m.y += m.vy * pace * dt - dScroll * (0.08 + 0.32 * m.depth);
      return m.y > -30 && m.y < h + 50 && m.x > -40 && m.x < w + 40;
    };

    const drawEmber = (m: Mote, spark: boolean) => {
      const t = m.life / m.max;
      const flicker = 0.7 + 0.3 * Math.sin(m.life * (8 + (m.seed % 1) * 7) + m.seed);
      const envelope = Math.min(1, m.life / (spark ? 0.04 : 0.5)) * (1 - t * t);
      const near = !spark && m.depth > 0.86;
      const x = m.x + parX * m.depth;
      const y = m.y + parY * m.depth;
      const flare = 1 + m.fan * 0.9;
      const alpha = Math.min(1, envelope * flicker * (near ? 0.34 : 0.6 + 0.4 * m.depth) * flare);
      // The glow, in the colour it has cooled to (ember → crimson → ash-red).
      const glow = sprites[Math.min(sprites.length - 1, 1 + Math.floor(t * 3.4))]!;
      const r = (near ? m.size * 5 : m.size * 3.4) * (1 + m.fan * 0.35);
      const v = Math.hypot(m.vx, m.vy);
      const speed = v * (0.6 + 0.8 * m.depth);

      ctx.globalAlpha = alpha;
      if (!near && speed > 12) {
        // A streak along its path: local +y turned onto the direction of
        // travel, the glow trailing behind the head and thinning as it
        // stretches, so a fast spark is a line rather than a smear.
        const tail = 1 + Math.min(2.6, speed / 80);
        const thin = r / Math.sqrt(tail);
        const ux = m.vx / v;
        const uy = m.vy / v;
        ctx.setTransform(dpr * uy, -dpr * ux, dpr * ux, dpr * uy, dpr * x, dpr * y);
        ctx.drawImage(glow, -thin, r - 2 * r * tail, 2 * thin, 2 * r * tail);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        ctx.drawImage(glow, x - r, y - r, 2 * r, 2 * r);
      }

      // A hot heart while it's young: white-hot at first, then gold.
      if (!near && t < 0.6) {
        const c = m.size * 1.15 * (1 + m.fan * 0.3);
        ctx.globalAlpha = Math.min(1, envelope * flicker * (1 - t / 0.6) * 0.9 * flare);
        ctx.drawImage(sprites[t < 0.2 ? 0 : 1]!, x - c, y - c, c * 2, c * 2);
      }
    };

    const drawAsh = (m: Mote) => {
      const t = m.life / m.max;
      const envelope = Math.min(1, m.life / 1.2) * (1 - t);
      // A tumbling flake: a sliver that turns, widening and narrowing.
      const turn = m.life * (0.8 + (m.seed % 1) * 1.6) + m.seed;
      const s = m.size;
      ctx.save();
      ctx.translate(m.x + parX * m.depth, m.y + parY * m.depth);
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

      // Scrolling: how far this frame (clamped, so a jump to an anchor
      // doesn't fling everything off screen) and how fast, smoothed.
      const dScroll = Math.max(-120, Math.min(120, window.scrollY - scroll));
      scroll = window.scrollY;
      scrollVel += (dScroll / Math.max(dt, 0.001) - scrollVel) * (1 - Math.exp(-dt * 8));

      // The pointer's wake dies away once it stops.
      const still = Math.exp(-dt * 5);
      pvx *= still;
      pvy *= still;
      const pSpeed = Math.hypot(pvx, pvy);
      const ease = 1 - Math.exp(-dt * 3);
      parX += (parTX - parX) * ease;
      parY += (parTY - parY) * ease;

      // Scrolling stirs the air, and pushes it against the direction of travel.
      const gust = Math.min(2.5, Math.abs(scrollVel) / 900);
      const turb = 26 * (1 + gust);
      const lift = -scrollVel * 0.1;
      const wind = Math.sin(clock * 0.07) * 10 + Math.sin(clock * 0.023 + 1.7) * 7;
      const z = clock * 0.06;

      for (const m of motes) {
        if (!advance(m, dt, z, turb, wind, lift, pSpeed, dScroll)) spawn(m);
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        if (!advance(sparks[i]!, dt, z, turb, wind, lift, pSpeed, dScroll)) {
          sparks[i] = sparks[sparks.length - 1]!;
          sparks.pop();
        }
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      // Ash painted as ash; embers and sparks added as light on top.
      for (const m of motes) if (m.ash) drawAsh(m);
      ctx.globalCompositeOperation = "lighter";
      for (const m of motes) if (!m.ash) drawEmber(m, false);
      for (const m of sparks) drawEmber(m, true);
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(120, Math.max(30, (w * h) / 18000)) * density);
      while (motes.length < target) motes.push(spawn(undefined, true));
      motes.length = target;
    };

    // --- The reader -------------------------------------------------------

    const track = (x: number, y: number, time: number) => {
      if (pt && time > pt) {
        const dt = (time - pt) / 1000;
        const clamp = (v: number) => Math.max(-3000, Math.min(3000, v));
        pvx += (clamp((x - px) / dt) - pvx) * 0.5;
        pvy += (clamp((y - py) / dt) - pvy) * 0.5;
      }
      px = x;
      py = y;
      pt = time;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      track(e.clientX, e.clientY, e.timeStamp);
      // Near motes drift against the pointer: a little depth.
      parTX = -(e.clientX / w - 0.5) * 30;
      parTY = -(e.clientY / h - 0.5) * 18;
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) track(touch.clientX, touch.clientY, e.timeStamp);
    };
    const onPointerGone = () => {
      pt = 0;
      px = py = -1e4;
    };
    const onClick = (e: MouseEvent) => throwAt(e.clientX, e.clientY, 14, 1.15, 1.4);
    const onSpark = (e: Event) => {
      const d = (e as CustomEvent<SparkDetail>).detail;
      throwAt(d.x, d.y, d.n ?? 1, d.power ?? 0.7, 0.9);
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
    const passive = { passive: true } as const;
    window.addEventListener("pointermove", onPointerMove, passive);
    window.addEventListener("touchmove", onTouchMove, passive);
    window.addEventListener("touchend", onPointerGone, passive);
    document.documentElement.addEventListener("pointerleave", onPointerGone, passive);
    window.addEventListener("click", onClick, passive);
    window.addEventListener(SPARK_EVENT, onSpark);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onPointerGone);
      document.documentElement.removeEventListener("pointerleave", onPointerGone);
      window.removeEventListener("click", onClick);
      window.removeEventListener(SPARK_EVENT, onSpark);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return <canvas ref={ref} className={styles.embers} aria-hidden="true" />;
}
