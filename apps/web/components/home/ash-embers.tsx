"use client";

import { useEffect, useRef } from "react";
import { flameSprites } from "@/components/home/flame-sprites";
import { SPARK_EVENT, type SparkDetail } from "@/components/home/sparks";
import styles from "./ash-embers.module.css";

/**
 * Burning ash in the air over every public page — moving like the real thing,
 * and moving with the reader.
 *
 * What's in the air:
 *  - Flakes: torn scraps of burnt paper. Black char with a ragged rim that is
 *    still alight in places, a few live embers in the char. They tumble over
 *    as they go (a scrap seen edge-on is a sliver), ride the heat up while
 *    they burn, flicker, burn out to pale grey and settle back down. Some are
 *    already cold ash, drifting down from above.
 *  - Embers: small glowing bits, buoyant while hot, cooling from gold to
 *    crimson; fast ones draw as thin streaks along their path.
 *  - A few big soft embers right in front of the lens, out of focus.
 *
 * The air: everything rides a slowly turning field of eddies (the curl of 3D
 * value noise, so the flow swirls without bunching up) plus a drifting wind,
 * with momentum and drag — small bits follow the air closely, big ones lag,
 * and flat scraps catch it and glide sideways as they tip.
 *
 * The reader stirs it:
 *  - the pointer pushes the air it moves through and leaves a swirl behind;
 *    whatever it fans flares up — a dying scrap can catch again;
 *  - scrolling gusts the air, and drags near things further than far ones;
 *  - a click throws a small shower of sparks;
 *  - burning fight bills shed sparks and burning scraps from their burning
 *    edge (PaperBurn, through the `embers:spark` event in ./sparks).
 *
 * Cost: one fixed canvas, sprites pre-rendered once (flames from
 * flame-sprites, a dozen torn scraps here), a few hundred drawImage calls a
 * frame at most; pixel ratio capped at 1.5; paused while the tab is hidden;
 * nothing at all under reduced motion.
 *
 * Switched on and off with ASH_EMBERS in components/layout/effects.ts.
 */

type Kind = "ember" | "flake" | "bokeh";

type Mote = {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  /** Radius, px. */
  size: number;
  /** 0 far … 1 near */
  depth: number;
  seed: number;
  /** 0…1: how hard the pointer has just fanned it. */
  fan: number;
  /** 0…1. Embers cool as they age; flakes burn out by `burn` seconds. */
  heat: number;
  /** Flakes: heat at the start — 0 for a scrap that's already cold ash. */
  heat0: number;
  burn: number;
  /** Flakes: which scrap, its spin, and its tumble (turning over in 3D). */
  scrap: number;
  rot: number;
  spin: number;
  tum: number;
  tumble: number;
};

/** Eddy sizes: broad currents and smaller swirls inside them (1 / px). */
const BROAD = 1 / 320;
const FINE = 1 / 130;
/** How far the pointer's wake reaches, px. */
const WAKE = 170;
/** Short-lived bits alive at once, from clicks and burning bills. */
const MAX_SPARKS = 110;

/** Scrap sprites: canvas size, and the scrap's own radius inside it (the
 *  rest is room for the glow). */
const SCRAP = 64;
const SCRAP_R = 17;
const SCRAPS = 12;

type Scrap = { char: HTMLCanvasElement; ash: HTMLCanvasElement; glow: HTMLCanvasElement };

/** One torn scrap of burnt paper, three ways: charred, burnt out, and its
 *  burning rim. */
function makeScrap(): Scrap {
  const canvas = () => {
    const c = document.createElement("canvas");
    c.width = c.height = SCRAP;
    return [c, c.getContext("2d")!] as const;
  };
  const mid = SCRAP / 2;
  // A ragged outline, a little longer one way than the other.
  const n = 8 + Math.floor(Math.random() * 6);
  const squash = 0.55 + Math.random() * 0.5;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.55;
    const r = SCRAP_R * (0.5 + Math.random() * 0.55);
    pts.push([mid + Math.cos(a) * r, mid + Math.sin(a) * r * squash]);
  }
  const outline = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };
  const speckle = (ctx: CanvasRenderingContext2D, rgb: string, count: number) => {
    ctx.save();
    outline(ctx);
    ctx.clip();
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = `rgba(${rgb}, ${0.2 + Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.arc(
        mid + (Math.random() - 0.5) * SCRAP_R * 1.8,
        mid + (Math.random() - 0.5) * SCRAP_R * 1.8 * squash,
        0.8 + Math.random() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  };

  // Char: near-black, a grain of grey ash on it.
  const [char, c1] = canvas();
  outline(c1);
  c1.fillStyle = "#1d1412";
  c1.fill();
  speckle(c1, "96, 82, 74", 7);

  // Burnt out: the same scrap gone pale grey, darker where it was thicker.
  const [ash, c2] = canvas();
  outline(c2);
  c2.fillStyle = "#8b8078";
  c2.fill();
  speckle(c2, "58, 50, 46", 6);
  speckle(c2, "196, 188, 180", 4);

  // The burning rim: stretches of the edge alight, bloomed — a deep red band
  // where the char meets the fire, a bright line at the very edge, hottest in
  // spots — and a few live embers left in the char.
  const [glow, c3] = canvas();
  c3.lineJoin = "round";
  c3.lineCap = "round";
  c3.shadowColor = "rgba(255, 106, 28, 1)";
  c3.shadowBlur = 10;
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.25) continue;
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[(i + 1) % n]!;
    const hot = Math.random();
    const width = 1.5 + hot * 1.9;
    c3.beginPath();
    c3.moveTo(x0, y0);
    c3.lineTo(x1, y1);
    c3.strokeStyle = "rgba(150, 30, 14, 0.8)";
    c3.lineWidth = width + 2.2;
    c3.stroke();
    c3.strokeStyle = hot > 0.75 ? "#ffe2a6" : hot > 0.3 ? "#ff8a3a" : "#d9451f";
    c3.lineWidth = width;
    c3.stroke();
  }
  c3.fillStyle = "#ff9d4d";
  for (let i = 0; i < 4; i++) {
    c3.beginPath();
    c3.arc(
      mid + (Math.random() - 0.5) * SCRAP_R,
      mid + (Math.random() - 0.5) * SCRAP_R * squash,
      0.7 + Math.random() * 1.3,
      0,
      Math.PI * 2,
    );
    c3.fill();
  }
  return { char, ash, glow };
}

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

const blank = (): Mote => ({
  kind: "ember",
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 0,
  max: 1,
  size: 1,
  depth: 0,
  seed: 0,
  fan: 0,
  heat: 1,
  heat0: 1,
  burn: 1,
  scrap: 0,
  rot: 0,
  spin: 0,
  tum: 0,
  tumble: 0,
});

export default function AshEmbers({
  density = 1,
}: {
  /** Multiplier on the count. 1 ≈ 110 pieces on a 1440 × 900 screen. */
  density?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const flames = flameSprites();
    const scraps = Array.from({ length: SCRAPS }, () => makeScrap());
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

    const tumbling = (m: Mote) => {
      m.scrap = Math.floor(Math.random() * SCRAPS);
      m.rot = Math.random() * Math.PI * 2;
      m.spin = (Math.random() - 0.5) * 1.8;
      m.tum = Math.random() * Math.PI * 2;
      m.tumble = 1.2 + Math.random() * 3;
    };

    const spawn = (m: Mote = blank(), anywhere = false): Mote => {
      const r = Math.random();
      // 45% embers, 30% burning scraps, 18% cold ash, 7% out of focus.
      m.kind = r < 0.45 ? "ember" : r < 0.93 ? "flake" : "bokeh";
      m.seed = Math.random() * 1000;
      m.fan = 0;
      m.x = Math.random() * w;
      // Low on the screen is nearer the fire: more of everything starts there.
      const low = h * Math.sqrt(Math.random());
      if (m.kind === "ember") {
        m.depth = 0.9 * Math.random() ** 1.7;
        m.y = anywhere || Math.random() < 0.5 ? low : h + 20;
        m.vx = (Math.random() - 0.5) * 18;
        m.vy = -(10 + Math.random() * 30);
        m.max = 5 + Math.random() * 6;
        m.size = 1.2 + 2.6 * m.depth + Math.random() * 0.8;
        m.heat0 = m.heat = 1;
      } else if (m.kind === "flake") {
        tumbling(m);
        m.depth = Math.random() ** 1.1;
        m.vx = (Math.random() - 0.5) * 14;
        if (r < 0.75) {
          // A burning scrap, carried up on the heat until it burns out.
          m.y = anywhere || Math.random() < 0.45 ? low : h + 24;
          m.vy = -(12 + Math.random() * 24);
          m.max = 8 + Math.random() * 6;
          m.burn = m.max * (0.55 + Math.random() * 0.3);
          m.heat0 = 0.75 + Math.random() * 0.25;
          m.size = 5 + 9 * m.depth + Math.random() * 3;
        } else {
          // Burnt-out ash settling from above.
          m.y = anywhere || Math.random() < 0.6 ? Math.random() * h : -16;
          m.vy = (Math.random() - 0.3) * 8;
          m.max = 11 + Math.random() * 8;
          m.burn = 1;
          m.heat0 = 0;
          m.size = 2 + 4.5 * m.depth + Math.random() * 1.5;
        }
        m.heat = m.heat0;
      } else {
        // Out of focus, right in front of the lens.
        m.depth = 1;
        m.y = Math.random() * h;
        m.vx = (Math.random() - 0.5) * 8;
        m.vy = -(4 + Math.random() * 10);
        m.max = 7 + Math.random() * 7;
        m.size = 10 + Math.random() * 18;
        m.heat0 = m.heat = 1;
      }
      m.life = anywhere ? Math.random() * m.max * 0.8 : 0;
      return m;
    };

    /** Short-lived bits thrown from (x, y): sparks, and a share of burning
     *  scraps. Mostly upward, fanned out by `spread` radians either side. */
    const throwAt = (
      x: number,
      y: number,
      n: number,
      power: number,
      spread: number,
      scrapShare: number,
    ) => {
      for (let i = 0; i < n && sparks.length < MAX_SPARKS; i++) {
        const m = blank();
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2 * spread;
        m.x = x;
        m.y = y;
        m.seed = Math.random() * 1000;
        if (Math.random() < scrapShare) {
          const speed = (40 + Math.random() * 90) * power;
          m.kind = "flake";
          tumbling(m);
          m.spin *= 1.8;
          m.tumble *= 1.4;
          m.vx = Math.cos(a) * speed;
          m.vy = Math.sin(a) * speed;
          m.depth = 0.5 + Math.random() * 0.3;
          m.max = 2.5 + Math.random() * 2.5;
          m.burn = m.max * (0.5 + Math.random() * 0.3);
          m.heat0 = m.heat = 1;
          m.size = 3.5 + Math.random() * 4;
        } else {
          const speed = (70 + Math.random() * 190) * power;
          m.kind = "ember";
          m.vx = Math.cos(a) * speed;
          m.vy = Math.sin(a) * speed;
          m.depth = 0.45 + Math.random() * 0.35;
          m.max = 0.8 + Math.random() * 1.4;
          m.size = 0.8 + Math.random() * 1.2;
          m.fan = 0.4;
        }
        sparks.push(m);
      }
    };

    /** Moves a piece on through the air; false once it's out or gone. */
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

      if (m.kind === "flake") {
        m.heat = m.heat0 * Math.max(0, 1 - m.life / m.burn) ** 0.8;
        // Fanned, a scrap that was still alight catches again.
        if (m.heat0 > 0) m.heat = Math.min(1, m.heat + m.fan * 0.7);
        m.tum += m.tumble * dt;
        m.rot += m.spin * dt;
        // Flat: it glides sideways as it tips, the more so once it's cold.
        ax += Math.sin(m.tum) * (16 + 16 * (1 - m.heat));
        const blend = 1 - Math.exp(-(3 / Math.sqrt(m.size)) * dt);
        m.vx += (ax - m.vx) * blend;
        m.vy += (ay - m.vy) * blend;
        // Carried up while it burns; settles once it's ash.
        m.vy += ((9 + 8 * m.depth) * (1 - m.heat) - (26 + 30 * m.depth) * m.heat) * dt;
      } else if (m.kind === "ember") {
        const blend = 1 - Math.exp(-(1.8 / Math.sqrt(m.size)) * dt);
        m.vx += (ax - m.vx) * blend;
        m.vy += (ay - m.vy) * blend;
        // Buoyant while hot, more so when fanned — which also keeps it alight.
        m.heat = 1 - t;
        m.vy -= (30 + 46 * m.depth) * m.heat * m.heat * (1 + m.fan) * dt;
        m.life = Math.max(0, m.life - m.fan * dt * 0.5);
      } else {
        const blend = 1 - Math.exp(-1.2 * dt);
        m.vx += (ax * 0.5 - m.vx) * blend;
        m.vy += (ay * 0.5 - m.vy) * blend;
        m.vy -= 6 * dt;
      }

      // Near things cross the screen faster; scrolling drags them further.
      const pace = 0.6 + 0.8 * m.depth;
      m.x += m.vx * pace * dt;
      m.y += m.vy * pace * dt - dScroll * (0.08 + 0.32 * m.depth);
      return m.y > -40 && m.y < h + 60 && m.x > -60 && m.x < w + 60;
    };

    const drawEmber = (m: Mote, spark: boolean) => {
      const t = m.life / m.max;
      const flicker = 0.7 + 0.3 * Math.sin(m.life * (8 + (m.seed % 1) * 7) + m.seed);
      const envelope = Math.min(1, m.life / (spark ? 0.04 : 0.5)) * (1 - t * t);
      const x = m.x + parX * m.depth;
      const y = m.y + parY * m.depth;
      const flare = 1 + m.fan * 0.9;
      // The glow, in the colour it has cooled to (ember → crimson → ash-red).
      const glow = flames[Math.min(flames.length - 1, 1 + Math.floor(t * 3.4))]!;
      const r = m.size * 3.6 * (1 + m.fan * 0.35);
      const v = Math.hypot(m.vx, m.vy);
      const speed = v * (0.6 + 0.8 * m.depth);

      ctx.globalAlpha = Math.min(1, envelope * flicker * (0.65 + 0.35 * m.depth) * flare);
      if (speed > 12) {
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
      if (t < 0.6) {
        const c = m.size * 1.15 * (1 + m.fan * 0.3);
        ctx.globalAlpha = Math.min(1, envelope * flicker * (1 - t / 0.6) * 0.9 * flare);
        ctx.drawImage(flames[t < 0.2 ? 0 : 1]!, x - c, y - c, c * 2, c * 2);
      }
    };

    const drawFlake = (m: Mote) => {
      const t = m.life / m.max;
      const envelope = Math.min(1, m.life / 0.6) * Math.min(1, (1 - t) / 0.25);
      if (envelope <= 0) return;
      const scrap = scraps[m.scrap]!;
      const s = (SCRAP * m.size) / SCRAP_R;
      ctx.save();
      ctx.translate(m.x + parX * m.depth, m.y + parY * m.depth);
      ctx.rotate(m.rot);
      // Turning over: edge-on, a scrap is a sliver.
      ctx.scale(1, 0.18 + 0.82 * Math.abs(Math.cos(m.tum)));
      // Ash underneath, the char over it while it's burning, then the fire.
      ctx.globalAlpha = envelope * (0.55 + 0.35 * m.depth);
      ctx.drawImage(scrap.ash, -s / 2, -s / 2, s, s);
      if (m.heat > 0.02) {
        ctx.globalAlpha = envelope * Math.min(1, m.heat * 1.4);
        ctx.drawImage(scrap.char, -s / 2, -s / 2, s, s);
        // Crackling: two flickers beating against each other.
        const crackle =
          0.55 + 0.45 * (0.5 + 0.5 * Math.sin(m.life * 11 + m.seed)) * (0.5 + 0.5 * Math.sin(m.life * 4.3 + m.seed * 2));
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(1, envelope * m.heat * crackle * (1 + m.fan * 0.8));
        ctx.drawImage(scrap.glow, -s / 2, -s / 2, s, s);
      }
      ctx.restore();
    };

    const drawBokeh = (m: Mote) => {
      const t = m.life / m.max;
      const r = m.size;
      ctx.globalAlpha = Math.sin(Math.PI * t) * (0.1 + 0.06 * Math.sin(m.life * 1.7 + m.seed)) * (1 + m.fan);
      ctx.drawImage(
        flames[m.seed % 1 < 0.5 ? 1 : 2]!,
        m.x + parX - r,
        m.y + parY - r,
        2 * r,
        2 * r,
      );
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
      // Scraps first (painted, then lit), embers and sparks added as light,
      // the out-of-focus ones last since they're nearest.
      for (const m of motes) if (m.kind === "flake") drawFlake(m);
      for (const m of sparks) if (m.kind === "flake") drawFlake(m);
      ctx.globalCompositeOperation = "lighter";
      for (const m of motes) if (m.kind === "ember") drawEmber(m, false);
      for (const m of sparks) if (m.kind === "ember") drawEmber(m, true);
      for (const m of motes) if (m.kind === "bokeh") drawBokeh(m);
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
      const target = Math.round(Math.min(150, Math.max(40, (w * h) / 12000)) * density);
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
      // Near things drift against the pointer: a little depth.
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
    const onClick = (e: MouseEvent) => throwAt(e.clientX, e.clientY, 14, 1.15, 1.4, 0);
    const onSpark = (e: Event) => {
      const d = (e as CustomEvent<SparkDetail>).detail;
      throwAt(d.x, d.y, d.n ?? 1, d.power ?? 0.7, 0.9, d.scraps ?? 0);
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
