import styles from "./sword.module.css";

/**
 * The fire giant's burning sword, held in its fist in the hero art.
 *
 * The art's own sword has been painted out of `hero-ragnarok-*.jpg`; this one
 * is drawn in its place and pinned to the fist by the parent (the rig is a
 * zero-size point at the grip). Pure SVG and CSS: the parent ScrollScene writes
 * --progress, and the stylesheet turns it into a wind-up and a downward strike
 * about the grip. A crimson trail — the arc swept by the tip — burns in behind
 * the strike.
 *
 * Geometry: drawn blade-up in a 220×1000 box (x −60…160) with the grip's centre
 * at (50, 875). The strike runs from +26° (wound back) to −120° (driven down
 * across the battlefield). The trail arc uses the same two angles on a circle
 * the radius of the blade, so the two stay locked together.
 */

const FROM = 26;
const TO = -120;
const R = 0.92;

const rad = (deg: number) => (deg * Math.PI) / 180;
const tip = (deg: number) => [Math.sin(rad(deg)) * R, -Math.cos(rad(deg)) * R] as const;
const [x0, y0] = tip(FROM);
const [x1, y1] = tip(TO);
const ARC = `M ${x0.toFixed(4)} ${y0.toFixed(4)} A ${R} ${R} 0 0 0 ${x1.toFixed(4)} ${y1.toFixed(4)}`;

// One flame tongue in unit space: base at (0,0), licking up to (0,−1).
const TONGUE =
  "M0 0 C-0.55 -0.12 -0.62 -0.5 -0.12 -1 C-0.02 -0.72 0.34 -0.62 0.46 -0.34 C0.52 -0.16 0.3 0 0 0Z";

// Cheap deterministic noise so tongues are ragged, and server and client
// render the same markup.
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Tongues along both edges of the blade, biggest near the guard.
const TONGUES = Array.from({ length: 22 }, (_, i) => {
  const t = i / 21;
  const side = rand(i + 1) < 0.5 ? -1 : 1;
  const halfWidth = 13 - t * 8;
  const big = 0.6 + rand(i + 7) * 0.8;
  return {
    x: 50 + side * halfWidth * (0.4 + rand(i + 3) * 0.6),
    y: 780 - t * 720 + (rand(i + 5) - 0.5) * 40,
    lean: side * (6 + rand(i + 11) * 26),
    w: (40 - t * 18) * big,
    h: (170 - t * 80) * big,
    delay: `${(rand(i + 13) * 0.9).toFixed(3)}s`,
    dur: `${(0.55 + rand(i + 17) * 0.6).toFixed(3)}s`,
  };
});

export default function Sword({ className }: { className?: string }) {
  return (
    <div className={`${styles.rig} ${className ?? ""}`} aria-hidden="true">
      <svg className={styles.trail} viewBox="-1 -1 2 2">
        <defs>
          <linearGradient id="trail-burn" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5e0f11" stopOpacity="0" />
            <stop offset="0.5" stopColor="#a3272a" />
            <stop offset="1" stopColor="#f0a06a" />
          </linearGradient>
        </defs>
        <path d={ARC} pathLength={1} className={styles.trailWide} />
        <path d={ARC} pathLength={1} className={styles.trailCore} />
      </svg>

      <svg className={styles.sword} viewBox="-60 0 220 1000">
        <defs>
          <linearGradient id="blade-hot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c1442a" />
            <stop offset="0.3" stopColor="#f0a06a" />
            <stop offset="0.5" stopColor="#fff4e2" />
            <stop offset="0.7" stopColor="#f0a06a" />
            <stop offset="1" stopColor="#a3272a" />
          </linearGradient>
          {/* Heat: tongues ripple instead of reading as cut-out shapes. */}
          <filter id="blade-fire" x="-40%" y="-10%" width="180%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022 0.012" numOctaves="2" seed="7">
              <animate
                attributeName="seed"
                dur="1.2s"
                values="7;8;9;10;11;12"
                calcMode="discrete"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="46" />
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <linearGradient id="tongue-outer" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f08a4a" />
            <stop offset="0.55" stopColor="#c1442a" />
            <stop offset="1" stopColor="#8b1a1a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tongue-inner" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff1dc" />
            <stop offset="0.6" stopColor="#f7b26a" />
            <stop offset="1" stopColor="#f08a4a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Flames wrapping the blade */}
        <g className={styles.fire} filter="url(#blade-fire)">
          {TONGUES.map(({ x, y, lean, w, h, delay, dur }, i) => (
            <g key={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${lean.toFixed(2)})`}>
              <g
                className={styles.flick}
                style={{ animationDelay: delay, animationDuration: dur }}
              >
                <path d={TONGUE} transform={`scale(${w.toFixed(2)} ${h.toFixed(2)})`} fill="url(#tongue-outer)" />
                <path
                  d={TONGUE}
                  transform={`translate(${(-lean * 0.12).toFixed(2)} 4) scale(${(w * 0.5).toFixed(2)} ${(h * 0.6).toFixed(2)})`}
                  fill="url(#tongue-inner)"
                />
              </g>
            </g>
          ))}
        </g>

        {/* White-hot blade */}
        <polygon points="50,10 65,110 61,792 39,792 35,110" fill="url(#blade-hot)" />
        <polyline points="50,10 50,780" className={styles.core} />

        {/* Crossguard — a raw iron slab, lit from the blade */}
        <polygon points="2,792 98,792 92,820 8,820" className={styles.guard} />
        <rect x="2" y="792" width="96" height="4" fill="#f0a06a" opacity="0.8" />

        {/* Grip (mostly inside the giant's fist) and pommel */}
        <rect x="42" y="820" width="16" height="116" fill="#1b1715" />
        <polygon points="50,934 64,956 50,978 36,956" className={styles.pommel} />
      </svg>
    </div>
  );
}
