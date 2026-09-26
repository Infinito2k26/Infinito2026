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
 * 2026): the giant stands right of centre, hands on his planted sword.
 *
 * Over it, centred, the fest's lockup from the Infinito_ui Figma file: the
 * dragon-infinity crest (`infinito-logo.png`) and the INFINITO 26 lettering
 * (`infinito-wordmark.png`, just the letters: the small print that sits
 * around them in the file is set below as real text).
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
  // The lettering is ~8.6 × --t1 wide (see hero.module.css): the column on
  // phones, about half the screen on desktop.
  const { props: wordmark } = getImageProps({
    src: "/infinito-wordmark.png",
    alt: "Infinito 2026",
    width: 3399,
    height: 513,
    sizes: "(max-width: 768px) 92vw, (max-width: 1023px) 64vw, 54vw",
    preload: true,
    quality: 75,
  });
  const { props: crest } = getImageProps({
    src: "/infinito-logo.png",
    alt: "",
    width: 909,
    height: 501,
    sizes: "(max-width: 768px) 32vw, 18vw",
    loading: "eager",
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
            {/* eslint-disable-next-line @next/next/no-img-element -- srcSet from getImageProps */}
            <img {...crest} alt="" aria-hidden="true" className={styles.crest} />
            <h1 className={styles.title}>
              {/* eslint-disable-next-line @next/next/no-img-element -- srcSet from getImageProps */}
              <img {...wordmark} alt="Infinito 2026" className={styles.wordmark} />
              <span className={styles.theme}>
                <span className={styles.themeLead}>
                  <span>Ruins of</span>
                </span>{" "}
                <span className={styles.themeMain}>Ragnarök</span>
              </span>
            </h1>
            <p className={styles.dates}>
              <span>9–11</span> October 2026
            </p>
            <p className={styles.kicker}>
              <span>IIT Patna</span>
              <i aria-hidden="true" />
              <span>11th edition</span>
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
