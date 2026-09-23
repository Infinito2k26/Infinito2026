import { getImageProps } from "next/image";
import Link from "next/link";
import ScrollScene from "@/components/ui/scroll-scene";
import FireCanvas from "@/components/home/fire-canvas";
import Sword from "@/components/home/sword";
import styles from "./hero.module.css";

/**
 * The landing hero — the fire giant of Ragnarök, sword raised.
 *
 * The key art's giant is the subject now: the art sits on a "stage" that keeps
 * its own aspect ratio and is scaled and positioned around the giant (stage
 * geometry lives in CSS custom properties per breakpoint), so the giant fills
 * the hero instead of the battlefield around it.
 *
 * `hero-ragnarok-*.jpg` are `main-*.png` with the baked-in title and the
 * giant's sword painted out. The sword is live SVG (<Sword>), pinned to the
 * giant's fist on a second stage layered above the dusk grade, so it glows
 * instead of being multiplied down with the art.
 *
 * Layers, back to front: stage (art + parallax) → grade → fire glow → fade →
 * stage (eyes, sword) → canvas flames → copy.
 *
 * On scroll (ScrollScene, mode "exit"): the giant looms closer, its eyes
 * flare, and the sword winds back and strikes down across the hero, leaving a
 * burning trail; the copy lifts away.
 */

const ALT =
  "A fire giant wreathed in flame raises a burning sword over a ruined battlefield, where warriors with hammer and spear face a wolf.";

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

      {/* Same geometry as the art's stage, above the grade: the giant's eyes
          and its sword, pinned to the painted fist. */}
      <div className={styles.foreground} aria-hidden="true">
        <div className={`${styles.stage} ${styles.foreStage}`}>
          <span className={styles.eyes} />
          <Sword className={styles.sword} />
        </div>
      </div>

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
    </ScrollScene>
  );
}
