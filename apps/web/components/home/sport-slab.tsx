import Image from "next/image";
import Link from "next/link";
import type { Sport } from "@/lib/sports";
import styles from "./sport-slab.module.css";

/**
 * A featured sport on the landing page — a stone slab with the poster burnt
 * into it. Landing only; every list page keeps the plain PosterCard.
 *
 * The poster already carries the sport's name in blackletter at the top, so the
 * slab anchors the art high and sets the broadcast name low, over a scrim, where
 * the art is only ruin. `wide` slabs span two grid columns on desktop.
 *
 * On hover the slab burns in two: the poster is drawn twice, each copy clipped
 * to one side of a jagged diagonal, and the halves part to show molten lava
 * beneath. The name stays whole on top.
 */
export default function SportSlab({
  sport,
  wide = false,
  eager = false,
}: {
  sport: Sport;
  wide?: boolean;
  eager?: boolean;
}) {
  return (
    <Link
      href={`/events?sport=${sport.id}`}
      className={`${styles.slab} ${wide ? styles.wide : ""}`}
    >
      <span className={styles.seam} aria-hidden="true" />
      {(["A", "B"] as const).map((side) => (
        <span key={side} className={`${styles.half} ${styles[`half${side}`]}`}>
          <span className={`${styles.shard} ${styles[`shard${side}`]}`}>
          <Image
            src={`/event-${sport.poster}.jpg`}
            alt={side === "A" ? `${sport.name} at Infinito 2026 — Ruins of Ragnarok` : ""}
            width={1600}
            height={2000}
            sizes={wide ? "(max-width: 1023px) 46vw, 600px" : "(max-width: 1023px) 46vw, 300px"}
            quality={75}
            loading={eager ? "eager" : "lazy"}
            className={styles.poster}
          />
            <span className={styles.grade} aria-hidden="true" />
            <span className={styles.burn} aria-hidden="true" />
          </span>
        </span>
      ))}

      <span className={styles.info}>
        <span
          className={`${styles.tag} ${sport.category === "Boys" ? styles.tagCrimson : ""}`}
        >
          {sport.category}
        </span>
        <span className={styles.name}>{sport.name}</span>
        <span className={styles.format}>{sport.format}</span>
      </span>
    </Link>
  );
}
