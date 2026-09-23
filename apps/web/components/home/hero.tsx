import { getImageProps } from "next/image";
import Link from "next/link";
import Ornament from "@/components/ui/ornament";
import styles from "./hero.module.css";

/**
 * The landing hero.
 *
 * Four things about the supplied art drive this component:
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
 * 3. The art is painted on a pale sky, and the landing page is dark. Rather
 *    than ship a second set of files, a multiply grade sits over it: the sky
 *    burns down to ember around the title and to abyss at the edges, while the
 *    charcoal figures — already near black — survive untouched.
 *
 * 4. Every crop ends in a dark band of ruin. That band is where the actions sit,
 *    because it's the one region of the image with guaranteed contrast.
 */

const ALT =
  "Infinito 2026, 11th edition, presented by IIT Patna. Ruins of Ragnarok, 9th to 11th October 2026. Warriors with hammer and spear face a wolf and a fire giant across a battlefield of ruins beneath a burning sky.";

const COMMON = {
  alt: ALT,
  sizes: "100vw",
  priority: true,
  quality: 82,
} as const;

const EMBERS = 18;

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
    <section className={`${styles.hero} ${underNav ? styles.underNav : ""}`}>
      <h1 className="srOnly">
        Infinito 2026 — Ruins of Ragnarok, IIT Patna, 9–11 October 2026
      </h1>

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

      <div className={styles.embers} aria-hidden="true">
        {Array.from({ length: EMBERS }).map((_, i) => (
          <span key={i} className={styles.ember} />
        ))}
      </div>

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

      <Ornament variant="ridge" fill="var(--char-900)" className={styles.ridge} />
    </section>
  );
}
