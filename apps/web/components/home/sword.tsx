import styles from "./sword.module.css";

/**
 * The great sword that swings down across the hero as the reader scrolls.
 *
 * Pure SVG and CSS: the parent ScrollScene writes --progress-ease, and the
 * stylesheet turns it into a rotation about the grip. A crimson trail — an arc
 * traced by the blade tip over the same sweep — draws in behind it.
 *
 * Geometry: the sword is drawn blade-up in a 100×1000 box with the grip's
 * centre at (50, 875). The swing runs from +12° (raised, leaning right) to
 * −125° (driven down to the left). The trail arc is those same two angles on a
 * circle the radius of the blade, so the two stay locked together.
 */

const FROM = 12;
const TO = -125;
const R = 0.92;

const rad = (deg: number) => (deg * Math.PI) / 180;
const tip = (deg: number) => [Math.sin(rad(deg)) * R, -Math.cos(rad(deg)) * R] as const;
const [x0, y0] = tip(FROM);
const [x1, y1] = tip(TO);
const ARC = `M ${x0.toFixed(4)} ${y0.toFixed(4)} A ${R} ${R} 0 0 0 ${x1.toFixed(4)} ${y1.toFixed(4)}`;

const RUNES = [
  "M-4 0 L4 8 M4 0 L-4 8",
  "M0 0 V10 M0 3 L5 0",
  "M-4 0 L0 8 L4 0",
  "M0 0 V10 M-4 5 H4",
  "M-4 8 L0 0 L4 8 M-2 5 H2",
  "M0 0 V10 M0 0 L5 4 L0 7",
  "M-4 0 H4 L-4 9 H4",
];

export default function Sword({ className }: { className?: string }) {
  return (
    <div className={`${styles.rig} ${className ?? ""}`} aria-hidden="true">
      <svg className={styles.trail} viewBox="-1 -1 2 2">
        <defs>
          <linearGradient id="trail-burn" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5e0f11" stopOpacity="0" />
            <stop offset="0.55" stopColor="#a3272a" />
            <stop offset="1" stopColor="#f0a06a" />
          </linearGradient>
        </defs>
        <path d={ARC} pathLength={1} className={styles.trailWide} />
        <path d={ARC} pathLength={1} className={styles.trailCore} />
      </svg>

      <svg className={styles.sword} viewBox="0 0 100 1000">
        <defs>
          <linearGradient id="blade-steel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2a2220" />
            <stop offset="0.42" stopColor="#9a8e84" />
            <stop offset="0.5" stopColor="#d9ccb9" />
            <stop offset="0.58" stopColor="#5c514a" />
            <stop offset="1" stopColor="#1b1715" />
          </linearGradient>
          <linearGradient id="blade-heat" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#d4622f" stopOpacity="0.9" />
            <stop offset="0.35" stopColor="#a3272a" stopOpacity="0.5" />
            <stop offset="1" stopColor="#a3272a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Blade */}
        <polygon points="50,0 66,92 62,792 38,792 34,92" fill="url(#blade-steel)" />
        <polygon
          points="50,0 66,92 62,792 38,792 34,92"
          fill="url(#blade-heat)"
          className={styles.heat}
        />
        <polyline points="50,0 34,92 38,792" className={styles.edge} />
        <polyline points="50,0 66,92 62,792" className={styles.edgeFaint} />
        <rect x="46.5" y="120" width="7" height="630" fill="#0e0c0b" />

        {/* Runes down the fuller, kindling as the sword swings */}
        <g className={styles.runes}>
          {RUNES.map((d, i) => (
            <path key={i} d={d} transform={`translate(50 ${170 + i * 82})`} />
          ))}
        </g>

        {/* Crossguard — a raw slab */}
        <polygon points="0,796 100,796 94,822 6,822" className={styles.guard} />
        <rect x="0" y="796" width="100" height="5" fill="#d4622f" opacity="0.55" />

        {/* Grip and pommel */}
        <rect x="41" y="822" width="18" height="112" fill="#1b1715" />
        {[836, 858, 880, 902, 924].map((y) => (
          <rect key={y} x="41" y={y} width="18" height="6" fill="#38302c" />
        ))}
        <polygon points="50,934 66,958 50,982 34,958" className={styles.pommel} />
      </svg>
    </div>
  );
}
