import Image from "next/image";
import Link from "next/link";
import type { Sport } from "@/lib/sports";
import PaperBurn from "@/components/home/paper-burn";
import { PAPER_DECKLE, PAPER_GRAIN } from "@/components/home/paper";
import styles from "./sport-slab.module.css";

/**
 * A featured sport on the landing page: a fight bill printed on parchment,
 * pinned to a stone slab. Landing only; every list page keeps the plain
 * PosterCard.
 *
 * On hover the bill burns away from where the pointer came in (<PaperBurn>),
 * uncovering the slab beneath with the sport's details carved into it. The slab's text is the
 * link's real content; the bill's printed text is decorative (aria-hidden).
 */
export default function SportSlab({
  sport,
  eager = false,
}: {
  sport: Sport;
  eager?: boolean;
}) {
  const deckle = { clipPath: PAPER_DECKLE };
  const boys = sport.category === "Boys";

  return (
    <Link
      href={`/events?sport=${sport.id}`}
      className={styles.slab}
    >
      {/* The slab, uncovered as the bill burns */}
      <span className={styles.under}>
        <span className={`${styles.uTag} ${boys ? styles.uTagCrimson : ""}`}>{sport.category}</span>
        <span className={styles.uName}>{sport.name}</span>
        <span className={styles.uFormat}>{sport.format}</span>
        <span className={styles.uCta}>
          Enter the arena <span aria-hidden="true">→</span>
        </span>
      </span>

      {/* The bill (the canvas repaints this and burns it) */}
      <span
        className={styles.paper}
        style={{ ...deckle, backgroundImage: `url("${PAPER_GRAIN}")` }}
        data-paper=""
        aria-hidden="true"
      >
        <Image
          src={`/event-${sport.poster}.jpg`}
          alt=""
          width={1600}
          height={2000}
          sizes="(max-width: 639px) 46vw, (max-width: 1240px) 31vw, 390px"
          quality={75}
          loading={eager ? "eager" : "lazy"}
          className={styles.poster}
        />
        <span className={styles.age} />
        <span className={styles.print}>
          <span className={`${styles.pTag} ${boys ? styles.pTagBoys : ""}`} data-print="">
            {sport.category}
          </span>
          <span className={styles.pName} data-print="">
            {sport.name}
          </span>
          <span className={styles.pFormat} data-print="">
            {sport.format}
          </span>
        </span>
      </span>

      <PaperBurn className={styles.fire} style={deckle} />
    </Link>
  );
}
