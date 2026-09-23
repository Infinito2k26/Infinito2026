import { getImageProps } from "next/image";
import Link from "next/link";
import ScrollScene from "@/components/ui/scroll-scene";
import FireCanvas from "@/components/home/fire-canvas";
import FireGiant from "@/components/home/fire-giant";
import styles from "./hero.module.css";

/**
 * The landing hero — Surtr, the fire giant, sword raised over the ruins.
 *
 * The giant is an original, rigged SVG figure (<FireGiant>) standing in front
 * of the key art's battlefield; scrolling makes it wind up and strike, with
 * canvas fire streaming off the blade (see fire-giant.tsx).
 *
 * The battlefield art sits on a "stage" that keeps its own aspect ratio and is
 * positioned by one focal point per breakpoint (CSS custom properties).
 * `hero-ragnarok-*.jpg` are `main-*.png` with the baked-in title and the
 * painted giant's sword removed; what is left of the painted giant is hidden
 * behind the new one.
 *
 * The section is taller than the screen and its scene (.pin) is sticky, so the
 * swing plays out in full view before the hero scrolls away.
 *
 * Layers, back to front: stage (art) → grade → fire glow → fade → giant →
 * canvas flames → copy.
 */

const ALT =
  "A ruined battlefield under a burning sky, where warriors with hammer and spear face a wolf.";

const COMMON = {
  alt: ALT,
  // The stage renders the art several viewports wide around the giant.
  sizes: "300vw",
  priority: true,
  quality: 75,
} as const;

export default function Hero({ underNav = false }: { underNav?: boolean }) {
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...COMMON, src: "/hero-ragnarok-desktop.jpg", width: 2592, height: 1080 });

  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...COMMON, src: "/hero-ragnarok-mobile.jpg", width: 1080, height: 1350 });

  return (
    <ScrollScene
      mode="exit"
      className={`${styles.hero} ${underNav ? "" : styles.belowNav}`}
    >
      <div className={styles.pin}>
        {/* Heat shimmer for the title. Kept tiny — displacement of a few px. */}
        <svg className={styles.defs} aria-hidden="true" focusable="false">
          <filter id="ragnarok-heat" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="2" seed="3">
              <animate
                attributeName="baseFrequency"
                dur="7s"
                values="0.012 0.06; 0.016 0.09; 0.012 0.06"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="7" />
          </filter>
        </svg>

        <div className={styles.artWrap}>
          <div className={styles.stage}>
            <picture className={styles.picture}>
              <source media="(min-width: 769px)" srcSet={desktop} />
              <source media="(max-width: 768px)" srcSet={mobile} />
              <img {...rest} alt={ALT} className={styles.art} />
            </picture>
          </div>
          <div className={styles.grade} aria-hidden="true" />
          <div className={styles.fireGlow} aria-hidden="true" />
          <div className={styles.fade} aria-hidden="true" />
        </div>

        <FireGiant className={styles.giant} />

        <FireCanvas className={styles.flames} density={1.1} />

        <div className={styles.copy}>
          <div className={styles.titleBlock}>
            <p className={styles.kicker}>
              <span>Infinito 2026</span>
              <i aria-hidden="true" />
              <span>11th edition</span>
              <i aria-hidden="true" />
              <span>IIT Patna</span>
            </p>
            <h1 className={styles.title}>
              <span className={styles.titleOf}>Ruins of</span>
              <span className={styles.titleMain} data-text="Ragnarök">
                Ragnarök
              </span>
              <span className="srOnly"> — Infinito 2026, IIT Patna, 9–11 October 2026</span>
            </h1>
            <p className={styles.dates}>
              <span>9–11</span> October 2026
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/signup" className={styles.primary}>
              Enter the battlefield <span aria-hidden="true">→</span>
            </Link>
            <Link href="/sports" className={styles.secondary}>
              Choose your sport <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className={styles.cue} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </div>
    </ScrollScene>
  );
}
