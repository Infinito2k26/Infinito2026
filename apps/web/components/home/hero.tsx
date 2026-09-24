import { getImageProps } from "next/image";
import Link from "next/link";
import ScrollScene from "@/components/ui/scroll-scene";
import FireCanvas from "@/components/home/fire-canvas";
import buttons from "./buttons.module.css";
import styles from "./hero.module.css";

/**
 * The landing hero — Surtr, the fire giant, igniting.
 *
 * One painting, drawn twice: once as smouldering embers (dark, desaturated)
 * and once at full fire, masked to an ellipse that grows from the giant's
 * blazing sword as the reader scrolls. The scene is pinned
 * (sticky) while that happens, then scrolls away. All of it is CSS reading
 * --progress from ScrollScene; see hero.module.css.
 *
 * Layers, back to front: embers → fire (masked) → core glow → scrim →
 * canvas flames → copy.
 *
 * `hero-ragnarok.jpg` was generated for Infinito with ChatGPT (September
 * 2026): the giant stands right of centre, hands on his planted sword, with
 * dark smoke on the left for the copy.
 */

const ALT =
  "Surtr, the horned fire giant of Ragnarök, resting both hands on a blazing sword while a Norse hall burns and a tiny army stands at his feet.";

export default function Hero({ underNav = false }: { underNav?: boolean }) {
  const { props: art } = getImageProps({
    src: "/hero-ragnarok.jpg",
    alt: ALT,
    width: 1672,
    height: 941,
    // Matches the stage: ~3.6× the viewport wide on phones (centred on the
    // giant), 1.6× on tablets, full-bleed on desktop.
    sizes: "(max-width: 768px) 360vw, (max-width: 1023px) 160vw, 110vw",
    preload: true,
    quality: 75,
  });

  return (
    <ScrollScene
      mode="exit"
      className={`${styles.hero} ${underNav ? "" : styles.belowNav}`}
    >
      <div className={styles.pin}>
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
              <span className={styles.titleMain}>Ragnarök</span>
              <span className="srOnly"> — Infinito 2026, IIT Patna, 9–11 October 2026</span>
            </h1>
            <p className={styles.dates}>
              <span>9–11</span> October 2026
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/signup" className={buttons.primary}>
              Enter the battlefield <span aria-hidden="true">→</span>
            </Link>
            <Link href="/sports" className={buttons.secondary}>
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
