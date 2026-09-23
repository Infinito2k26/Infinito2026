import { getImageProps } from "next/image";
import Link from "next/link";
import ScrollScene from "@/components/ui/scroll-scene";
import FireCanvas from "@/components/home/fire-canvas";
import styles from "./hero.module.css";

/**
 * The landing hero — Surtr, the fire giant, igniting.
 *
 * One painting (`hero-surtr.jpg`), drawn twice: once as smouldering embers
 * (dark, desaturated) and once at full fire, masked to an ellipse that grows
 * from the giant's burning head as the reader scrolls. The scene is pinned
 * (sticky) while that happens, then scrolls away. All of it is CSS reading
 * --progress from ScrollScene; see hero.module.css.
 *
 * Layers, back to front: embers → fire (masked) → core glow → scrim →
 * canvas flames → copy.
 *
 * The painting is signed third-party art (Guardino 2017): it needs the
 * artist's permission, or replacing, before this ships publicly.
 */

const ALT =
  "Surtr, the fire giant of Ragnarök, horned and wreathed in flame, a great sword in his hand.";

export default function Hero({ underNav = false }: { underNav?: boolean }) {
  const { props: art } = getImageProps({
    src: "/hero-surtr.jpg",
    alt: ALT,
    width: 1992,
    height: 1386,
    // The stage renders the painting wider than the viewport.
    sizes: "(max-width: 768px) 320vw, 125vw",
    preload: true,
    quality: 75,
  });

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
            {/* eslint-disable-next-line @next/next/no-img-element -- srcSet from getImageProps */}
            <img {...art} alt={ALT} className={styles.art} />
            {/* eslint-disable-next-line @next/next/no-img-element -- same image, the lit pass */}
            <img {...art} alt="" aria-hidden="true" className={styles.lit} />
            <span className={styles.core} aria-hidden="true" />
          </div>
          <div className={styles.scrim} aria-hidden="true" />
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
      </div>
    </ScrollScene>
  );
}
