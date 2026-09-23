"use client";

import { useEffect, useRef } from "react";
import { FLAME_STAGES, flameSprites } from "@/components/home/flame-sprites";
import styles from "./fire-giant.module.css";

/**
 * Surtr, the fire giant of Ragnarök — an original SVG figure whose sword arm
 * is a real jointed rig (shoulder → elbow → wrist), driven by scroll.
 *
 * Choreography (hero scroll progress p, 0 → 1 as the hero leaves):
 *   rest      p 0      sword raised at its side, flames licking up the blade
 *   wind-up   → 0.10   arm hauled overhead, blade cocked behind the shoulder,
 *                      body leaning back, eyes flaring
 *   strike    → 0.30   an overhead arc down across the body (accelerating)
 *   follow    → 0.36   drives through; the impact shakes the scene, flashes,
 *                      and throws a shockwave and sparks from the blade tip
 *
 * The pose is never set straight from scroll: every joint chases its target
 * on a damped spring, so wheel steps become a weighty, continuous swing with a
 * little overshoot, and scrolling back up rewinds it just as smoothly.
 *
 * The blade's fire is canvas, not SVG: flames are emitted along the blade in
 * screen space and rise on their own, so a fast swing leaves a burning trail,
 * plus a motion ribbon behind the tip.
 *
 * Geometry (viewBox 1000×1300): shoulder S (760, 450), elbow E (760, 650),
 * wrist F (760, 880). The arm is drawn hanging straight down; the sword is
 * drawn blade-up with its grip at F. Angles are SVG rotations in degrees.
 *
 * Pauses off-screen; under reduced motion it holds the rest pose and draws no
 * canvas fire.
 */

type Pose = {
  shoulder: number; // upper arm, about S
  elbow: number; // forearm, relative, about E
  blade: number; // sword, absolute (wrist = blade − shoulder − elbow)
  lean: number; // body, about the hips
  head: number; // head tilt
};

const REST: Pose = { shoulder: -22, elbow: 12, blade: 10, lean: 0, head: 0 };
const WIND: Pose = { shoulder: -165, elbow: -45, blade: 150, lean: 3.5, head: -5 };
const STRIKE: Pose = { shoulder: -320, elbow: 8, blade: -135, lean: -5, head: 7 };
const FOLLOW: Pose = { shoulder: -328, elbow: 14, blade: -144, lean: -6.5, head: 9 };

const KEYS = ["shoulder", "elbow", "blade", "lean", "head"] as const;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeIn = (t: number) => t * t * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

function mix(a: Pose, b: Pose, t: number): Pose {
  const out = {} as Pose;
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

function choreography(p: number): Pose {
  if (p < 0.1) return mix(REST, WIND, easeInOut(p / 0.1));
  if (p < 0.3) return mix(WIND, STRIKE, easeIn(clamp01((p - 0.1) / 0.2)));
  return mix(STRIKE, FOLLOW, easeOut(clamp01((p - 0.3) / 0.06)));
}

// Deterministic noise, so server and client render the same strands.
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// The mane: strands streaming out from behind the head.
const MANE = Array.from({ length: 16 }, (_, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  const k = Math.floor(i / 2);
  const x0 = 500 + side * (46 + k * 6);
  const y0 = 262 + k * 16;
  const reach = 80 + rand(i + 2) * 110;
  const drop = 40 + k * 22 + rand(i + 4) * 50;
  const x1 = x0 + side * reach * 0.55;
  const y1 = y0 + drop * 0.2 - 30 * rand(i + 6);
  const x2 = x0 + side * reach;
  const y2 = y0 + drop;
  return {
    d: `M${x0} ${y0} Q${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    w: (4 + rand(i + 8) * 7).toFixed(1),
    delay: `${(-rand(i + 10) * 4).toFixed(2)}s`,
  };
});

const mirror = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${1000 - Number(x)} ${y}`);

const HORN =
  "M545 268 C590 250 650 235 700 190 C740 150 752 100 738 50 C772 96 774 162 744 216 C712 276 640 302 572 306 Z";

type Flame = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; spark: boolean };
type Ring = { x: number; y: number; r: number; life: number };
type Sample = { tx: number; ty: number; mx: number; my: number };

export default function FireGiant({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const upperRef = useRef<SVGGElement>(null);
  const foreRef = useRef<SVGGElement>(null);
  const swordRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const body = bodyRef.current;
    const head = headRef.current;
    const upper = upperRef.current;
    const fore = foreRef.current;
    const sword = swordRef.current;
    if (!root || !canvas || !ctx || !body || !head || !upper || !fore || !sword) return;

    const scene = root.closest("section") ?? root;

    const apply = (q: Pose) => {
      body.setAttribute("transform", `rotate(${q.lean.toFixed(2)} 500 840)`);
      head.setAttribute("transform", `rotate(${q.head.toFixed(2)} 500 400)`);
      upper.setAttribute("transform", `rotate(${q.shoulder.toFixed(2)} 760 450)`);
      fore.setAttribute("transform", `rotate(${q.elbow.toFixed(2)} 760 650)`);
      const wrist = q.blade - q.shoulder - q.elbow;
      sword.setAttribute("transform", `rotate(${wrist.toFixed(2)} 760 880)`);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(REST);
      return;
    }

    const sprites = flameSprites();
    const flames: Flame[] = [];
    const rings: Ring[] = [];
    const trail: Sample[] = [];
    const pose: Pose = { ...REST };
    const vel: Pose = { shoulder: 0, elbow: 0, blade: 0, lean: 0, head: 0 };
    let w = 0;
    let h = 0;
    let scale = 1;
    let raf = 0;
    let running = false;
    let last = performance.now();
    let armed = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.max(0.55, h / 900);
    };

    const progress = () => {
      const r = scene.getBoundingClientRect();
      return clamp01(-r.top / r.height);
    };

    const emit = (x: number, y: number, spread: number, spark: boolean, burst = 1) => {
      const f: Flame = {
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * (spark ? 6 * burst : 0.6) * scale,
        vy: -(spark ? 1 + Math.random() * 5 * burst : 0.7 + Math.random() * 1.6) * scale,
        life: 0,
        max: spark ? 30 + Math.random() * 40 : 16 + Math.random() * 26,
        size: (spark ? 1.4 + Math.random() * 2.2 : 9 + Math.random() * 18) * scale,
        spark,
      };
      flames.push(f);
    };

    const impact = (x: number, y: number) => {
      rings.push({ x, y, r: 10 * scale, life: 0 });
      for (let i = 0; i < 70; i++) emit(x, y, 30 * scale, true, 1.6);
      for (let i = 0; i < 26; i++) emit(x, y, 60 * scale, false);
      root.style.setProperty("--ix", `${((x / w) * 100).toFixed(1)}%`);
      root.style.setProperty("--iy", `${((y / h) * 100).toFixed(1)}%`);
      scene.removeAttribute("data-impact");
      void (scene as HTMLElement).offsetWidth; // restart the CSS animations
      scene.setAttribute("data-impact", "");
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      // --- Pose: spring every joint toward the choreographed target ---------
      const p = progress();
      const target = choreography(p);
      target.shoulder += Math.sin(t * 1.3) * 1.6; // breathing
      target.lean += Math.sin(t * 0.9) * 0.5;
      const k = 70;
      const c = 2 * Math.sqrt(k) * 0.72;
      for (let s = 0; s < 2; s++) {
        const h2 = dt / 2;
        for (const key of KEYS) {
          const a = k * (target[key] - pose[key]) - c * vel[key];
          vel[key] += a * h2;
          pose[key] += vel[key] * h2;
        }
      }
      apply(pose);

      // Eyes burn hotter through the wind-up and strike.
      const fury = clamp01(p / 0.1) * (1 - clamp01((p - 0.6) / 0.3));
      root.style.setProperty("--fury", fury.toFixed(3));

      // --- Blade in screen space --------------------------------------------
      const m = sword.getScreenCTM();
      const box = canvas.getBoundingClientRect();
      if (!m) return;
      const at = (x: number, y: number) => {
        const pt = new DOMPoint(x, y).matrixTransform(m);
        return [pt.x - box.left, pt.y - box.top] as const;
      };
      const [bx, by] = at(760, 836);
      const [tx, ty] = at(760, 216);
      const [mx, my] = at(760, 520);
      const len = Math.hypot(tx - bx, ty - by);

      const prev = trail[trail.length - 1];
      const speed = prev ? Math.hypot(tx - prev.tx, ty - prev.ty) : 0;
      trail.push({ tx, ty, mx, my });
      if (trail.length > 12) trail.shift();

      // Impact: once per swing, when the blade drives past the strike line.
      if (armed && pose.blade < -128) {
        armed = false;
        impact(tx, ty);
      } else if (!armed && pose.blade > 20) {
        armed = true;
      }

      // Fire along the blade, heavier as it moves; sparks when it's fast.
      const n = 4 + Math.min(14, speed * 0.35);
      for (let i = 0; i < n; i++) {
        const u = 0.06 + Math.random() * 0.94;
        emit(bx + (tx - bx) * u, by + (ty - by) * u, len * 0.05, false);
      }
      if (speed > 10) {
        for (let i = 0; i < speed * 0.15; i++) emit(tx, ty, len * 0.04, true);
      }

      // --- Draw -------------------------------------------------------------
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // Motion ribbon between the tip and mid-blade over the last frames.
      if (trail.length > 2) {
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1]!;
          const b = trail[i]!;
          const seg = Math.hypot(b.tx - a.tx, b.ty - a.ty);
          if (seg < 2) continue;
          const alpha = (i / trail.length) * Math.min(1, seg / 30) * 0.5;
          ctx.fillStyle = `rgba(212, 98, 47, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.tx, a.ty);
          ctx.lineTo(b.tx, b.ty);
          ctx.lineTo(b.mx, b.my);
          ctx.lineTo(a.mx, a.my);
          ctx.closePath();
          ctx.fill();
        }
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(255, 236, 210, 0.55)";
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        trail.forEach((s, i) => (i ? ctx.lineTo(s.tx, s.ty) : ctx.moveTo(s.tx, s.ty)));
        ctx.stroke();
      }

      // Glow hugging the blade.
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(212, 98, 47, 0.12)";
      ctx.lineWidth = len * 0.1;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.strokeStyle = "rgba(240, 150, 90, 0.22)";
      ctx.lineWidth = len * 0.035;
      ctx.stroke();

      // Flames and sparks.
      for (let i = flames.length - 1; i >= 0; i--) {
        const f = flames[i]!;
        f.life += 1;
        const u = f.life / f.max;
        if (u >= 1) {
          flames.splice(i, 1);
          continue;
        }
        f.x += f.vx;
        f.y += f.vy;
        if (f.spark) f.vy += 0.08 * scale;
        const stage = Math.min(FLAME_STAGES.length - 1, Math.floor(u * FLAME_STAGES.length));
        const img = sprites[f.spark ? 0 : stage];
        if (!img) continue;
        const size = f.spark ? f.size : f.size * (1 - u * 0.6);
        const stretch = f.spark ? 1 : 1.5 + u * 1.2;
        ctx.globalAlpha = (f.spark ? 1 : 0.55) * (1 - u) * Math.min(1, u * 5);
        ctx.drawImage(img, f.x - size, f.y - size * stretch, size * 2, size * 2 * stretch);
      }
      if (flames.length > 900) flames.splice(0, flames.length - 900);
      ctx.globalAlpha = 1;

      // Shockwaves: flattened rings racing out along the ground.
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]!;
        r.life += dt;
        const u = r.life / 0.7;
        if (u >= 1) {
          rings.splice(i, 1);
          continue;
        }
        r.r += (1 - u) * 34 * scale;
        ctx.strokeStyle = `rgba(247, 190, 130, ${(0.8 * (1 - u)).toFixed(3)})`;
        ctx.lineWidth = (10 - u * 8) * scale;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.26, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    apply(pose);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()));
    io.observe(root);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className={`${styles.root} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.figure}>
        <div className={styles.halo} />
        <svg className={styles.svg} viewBox="0 0 1000 1300">
          <defs>
            <linearGradient id="giant-skin" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="1300">
              <stop offset="0" stopColor="#140706" />
              <stop offset="0.45" stopColor="#1f0a08" />
              <stop offset="1" stopColor="#4d170e" />
            </linearGradient>
            <linearGradient id="giant-rim" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="1300">
              <stop offset="0" stopColor="#a3272a" />
              <stop offset="0.6" stopColor="#d4622f" />
              <stop offset="1" stopColor="#f0a06a" />
            </linearGradient>
            <linearGradient id="giant-horn" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#1b0a08" />
              <stop offset="1" stopColor="#6b2416" />
            </linearGradient>
            <linearGradient id="giant-blade" gradientUnits="userSpaceOnUse" x1="734" y1="0" x2="786" y2="0">
              <stop offset="0" stopColor="#c1442a" />
              <stop offset="0.3" stopColor="#f0a06a" />
              <stop offset="0.5" stopColor="#fff6e8" />
              <stop offset="0.7" stopColor="#f0a06a" />
              <stop offset="1" stopColor="#a3272a" />
            </linearGradient>
            <radialGradient id="giant-eye">
              <stop offset="0" stopColor="#fff1dc" />
              <stop offset="0.35" stopColor="#f08a4a" stopOpacity="0.9" />
              <stop offset="1" stopColor="#d4622f" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Legs, sinking into the fire */}
          <path
            className={styles.part}
            d="M372 840 C350 920 330 1040 318 1300 L478 1300 L494 1040 L506 1040 L522 1300 L682 1300 C670 1040 650 920 628 840 Z"
          />

          <g ref={bodyRef}>
            {/* Mane, streaming behind the head */}
            <g className={styles.mane}>
              {MANE.map(({ d, w, delay }, i) => (
                <path key={i} d={d} strokeWidth={w} style={{ animationDelay: delay }} />
              ))}
            </g>

            {/* Hunched torso: traps rising around a sunken head */}
            <path
              className={styles.part}
              d="M452 380 C420 330 360 300 290 318 C220 336 180 390 178 450 C176 510 200 560 238 590 C250 650 290 720 360 780 L372 840 L628 840 L640 780 C710 720 750 650 762 590 C800 560 824 510 822 450 C820 390 780 336 710 318 C640 300 580 330 548 380 Z"
            />
            <g className={styles.shade}>
              <path d="M292 468 C356 522 440 534 496 504 L496 546 C428 566 346 546 292 468 Z" />
              <path d="M708 468 C644 522 560 534 504 504 L504 546 C572 566 654 546 708 468 Z" />
              <path d="M440 604 L496 610 L496 650 L446 644 Z M560 604 L504 610 L504 650 L554 644 Z" />
              <path d="M448 676 L496 682 L496 722 L454 716 Z M552 676 L504 682 L504 722 L546 716 Z" />
            </g>

            {/* Off arm, hanging, claws loose */}
            <path className={styles.part} d="M190 430 C160 500 150 580 165 650 L250 660 C275 590 285 510 275 440 Z" />
            <path className={styles.part} d="M160 640 C138 700 140 780 165 850 L240 850 C262 780 268 710 252 648 Z" />
            <path
              className={styles.part}
              d="M158 840 C140 870 146 920 170 940 L184 978 L196 942 L208 988 L220 946 L234 980 L240 936 C260 915 264 870 246 842 Z"
            />

            <g className={styles.lava}>
              <path d="M500 420 L490 470 L505 520 L494 575 L502 630" />
              <path d="M494 575 L462 602 L444 650 M505 520 L544 548 L558 600" />
              <path d="M330 480 L360 530 L348 590 L380 640 L372 700" />
              <path d="M670 480 L642 530 L654 590 L622 640 L630 700" />
              <path d="M470 724 L500 770 L530 724" />
              <path d="M300 372 L338 418 L328 462 M700 372 L662 418 L672 462" />
              <path d="M222 420 L210 482 L232 524 M200 530 L216 590 L204 632" />
              <path d="M192 700 L206 762 L196 820" />
            </g>

            {/* Belt and a tattered war-cloth */}
            <path className={styles.part} d="M364 812 L636 812 L640 858 L360 858 Z" />
            <path
              className={styles.part}
              d="M372 858 L628 858 L618 984 L592 946 L570 1016 L544 958 L516 1036 L490 962 L466 1022 L446 952 L424 1004 L404 948 L386 994 Z"
            />

            {/* Head, sunk between the shoulders */}
            <g ref={headRef}>
              <path className={styles.horn} d={HORN} />
              <path className={styles.horn} d={mirror(HORN)} />
              <path
                className={styles.part}
                d="M440 270 C445 235 555 235 560 270 L575 318 C582 350 570 378 548 396 L522 412 L478 412 L452 396 C430 378 418 350 425 318 Z"
              />
              <path d="M428 298 L500 318 L572 298 L566 318 L500 340 L434 318 Z" fill="#070302" />
              <g className={styles.eyes}>
                <circle cx="474" cy="330" r="38" fill="url(#giant-eye)" className={styles.eyeGlow} />
                <circle cx="526" cy="330" r="38" fill="url(#giant-eye)" className={styles.eyeGlow} />
                <path d="M454 320 L490 330 L486 340 L458 332 Z" fill="#fff4e2" />
                <path d="M546 320 L510 330 L514 340 L542 332 Z" fill="#fff4e2" />
              </g>
              <path className={styles.mouth} d="M468 384 L481 395 L491 384 L500 397 L509 384 L519 395 L532 384" />
              <path className={styles.lava} d="M500 246 L494 272 L504 294 M452 352 L470 368 M548 352 L530 368" />
            </g>

            {/* Sword arm: upper arm → forearm → sword, each on its own pivot */}
            <g ref={upperRef}>
              <path
                className={styles.part}
                d="M718 430 C705 500 708 580 720 650 L800 660 C815 590 818 510 805 440 Z"
              />
              <path className={styles.lava} d="M748 480 L764 540 L752 610" />
              <g ref={foreRef}>
                <path
                  className={styles.part}
                  d="M722 640 C705 700 708 780 728 850 L792 850 C812 780 816 700 798 640 Z"
                />
                <path className={styles.lava} d="M770 690 L756 750 L768 820" />
                <g ref={swordRef}>
                  <path d="M760 216 L786 290 L779 836 L741 836 L734 290 Z" fill="url(#giant-blade)" />
                  <path className={styles.fuller} d="M760 256 L760 816" />
                  <path className={styles.guard} d="M700 832 L820 832 L804 858 L716 858 Z" />
                  <path className={styles.guard} d="M700 832 L676 810 L720 838 Z M820 832 L844 810 L800 838 Z" />
                  <rect x="751" y="858" width="18" height="78" fill="#0e0605" />
                  <path className={styles.pommel} d="M760 930 L776 948 L760 966 L744 948 Z" />
                </g>
                <path
                  className={styles.part}
                  d="M722 842 C708 864 712 910 734 924 L786 924 C808 910 812 864 798 842 Z"
                />
                <path className={styles.knuckles} d="M728 868 L792 868 M730 892 L790 892" />
              </g>
            </g>

            {/* Deltoid cap over the sword shoulder */}
            <path
              className={styles.part}
              d="M735 400 C800 390 845 440 835 505 C828 548 800 560 775 550 C755 510 742 460 735 400 Z"
            />
          </g>
        </svg>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.flash} />
    </div>
  );
}
