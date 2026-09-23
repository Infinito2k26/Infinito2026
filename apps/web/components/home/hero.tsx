import { getImageProps } from "next/image";
import Link from "next/link";
import ScrollScene from "@/components/ui/scroll-scene";
import FireCanvas from "@/components/home/fire-canvas";
import Sword from "@/components/home/sword";
import styles from "./hero.module.css";

/**
 * The landing hero — Ragnarök, burning.
 *
 * The key art is kept as the battlefield behind everything, but its baked-in
 * title is pushed out of frame and under the dusk grade: the title is live
 * type now, full-bleed and on fire, so it can be as big as the screen allows
 * and react to scroll.
 *
 * Layers, back to front: art (parallax) → multiply grade → fire glow → fade →
 * sword + trail → title → canvas flames → actions.
 *
 * `main-desktop` (2.4:1), `main-tablet` (2.4:1) and `main-mobile` (4:5) are
 * three different compositions, so they still ship through a real <picture>
 * via getImageProps.
 *
 * On scroll (ScrollScene, mode "exit"): the sword swings down across the
 * title, the title scales up and burns away, the art sinks.
 */

const ALT =
  "A battlefield of ruins beneath a burning sky: warriors with hammer and spear face a wolf and a fire giant.";

const COMMON = {
  alt: ALT,
  sizes: "100vw",
  priority: true,
  quality: 75,
} as const;

export default function Hero({ underNav = false }: { underNav?: boolean }) {
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...COMMON, src: "/main-desktop.png", width: 2592, height: 1080 });

  const {
    props: { srcSet: tablet },
  } = getImageProps({ ...COMMON, src: "/main-tablet.png", width: 1584, height: 660 });

  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...COMMON, src: "/main-mobile.png", width: 1080, height: 1350 });

  return (
    <ScrollScene
      mode="exit"
      className={`${styles.hero} ${underNav ? styles.underNav : ""}`}
    >
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
        <picture className={styles.picture}>
          <source media="(min-width: 1280px)" srcSet={desktop} />
          <source media="(min-width: 769px)" srcSet={tablet} />
          <source media="(max-width: 768px)" srcSet={mobile} />
          <img {...rest} alt={ALT} className={styles.art} />
        </picture>
        <div className={styles.grade} aria-hidden="true" />
        <div className={styles.fireGlow} aria-hidden="true" />
        <div className={styles.fade} aria-hidden="true" />
      </div>

      <Sword className={styles.sword} />

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

      <FireCanvas className={styles.flames} density={1.1} />

      <div className={styles.actions}>
        <Link href="/signup" className={styles.primary}>
          Enter the battlefield <span aria-hidden="true">→</span>
        </Link>
        <Link href="/sports" className={styles.secondary}>
          Choose your sport <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className={styles.cue} aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </ScrollScene>
  );
}
