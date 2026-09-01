import { getImageProps } from "next/image";
import Link from "next/link";
import styles from "./hero.module.css";

/**
 * The landing hero.
 *
 * Three things about the supplied art drive this component:
 *
 * 1. `main-desktop` (2.4:1), `main-tablet` (2.4:1) and `main-mobile` (4:5) are
 *    three different compositions, not one image at three sizes. Scaling a
 *    single file crops the dragon out on desktop or letterboxes on a phone, so
 *    they ship through a real <picture> with `media` queries. `getImageProps`
 *    keeps Next's AVIF/WebP optimisation while letting us do that.
 *
 * 2. The art already contains the wordmark, the theme title, and the dates. So
 *    nothing is overlaid on it — the page's <h1> is rendered visually hidden for
 *    search engines and screen readers, and the alt text carries the words that
 *    otherwise exist only as pixels.
 *
 * 3. Every crop ends in a dark band of ruin. That band is where the actions sit,
 *    because it's the one region of the image with guaranteed contrast.
 */

const ALT =
  "Infinito 2026, 11th edition, presented by IIT Patna. Ruins of Ragnarok, 9th to 11th October 2026. Warriors with hammer and spear face a wolf and a fire giant across a battlefield of ruins beneath a pale sky.";

const COMMON = {
  alt: ALT,
  sizes: "100vw",
  priority: true,
  quality: 82,
} as const;

export default function Hero() {
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
    <section className={styles.hero}>
      <h1 className="srOnly">
        Infinito 2026 — Ruins of Ragnarok, IIT Patna, 9–11 October 2026
      </h1>

      <div className={styles.artWrap}>
        <picture>
          <source media="(min-width: 1280px)" srcSet={desktop} />
          <source media="(min-width: 769px)" srcSet={tablet} />
          <source media="(max-width: 768px)" srcSet={mobile} />
          <img {...rest} alt={ALT} className={styles.art} />
        </picture>

        <div className={styles.embers} aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className={styles.ember} />
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/register" className={styles.primary}>
          Enter the battlefield
        </Link>
        <Link href="/sports" className={styles.secondary}>
          Choose your sport
        </Link>
      </div>
    </section>
  );
}
