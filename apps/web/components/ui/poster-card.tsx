"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PaperBurn from "@/components/home/paper-burn";
import { PAPER_DECKLE, PAPER_GRAIN } from "@/components/home/paper";
import styles from "./poster-card.module.css";

/**
 * A sport or an event as a fight bill: its poster printed on parchment, pinned
 * to a stone slab. The same card on the landing page, the sports and events
 * walls, and the dashboard's events.
 *
 * On hover the bill burns away from where the pointer came in (<PaperBurn>),
 * uncovering the slab beneath with the details carved into it. The slab's
 * text is the link's real content; the bill's printed text is decorative
 * (aria-hidden). On touch screens, and under reduced motion, the bill stays.
 *
 * The posters already have the sport's name set in blackletter inside the
 * art, so nothing is printed over them: the bill's own type sits on the
 * parchment below, where the poster fades out.
 */

export type PosterCardProps = {
  /** Matches the poster filename, e.g. "kabaddi". */
  slug: string;
  name: string;
  /** Boys, Girls, Open. */
  category?: string;
  /** "Team · 7-a-side", a fee, etc. */
  format?: string;
  date?: string;
  slotsLeft?: number;
  href: string;
  /** Override when the poster filename differs from the slug. */
  image?: string;
  /** The first row of a grid: loads its poster straight away. */
  priority?: boolean;
  /** The poster's `sizes`, for a grid that isn't 2-up on phones and 3–4-up
   *  above. */
  sizes?: string;
};

const DECKLE = { clipPath: PAPER_DECKLE };

export default function PosterCard({
  slug,
  name,
  category,
  format,
  date,
  slotsLeft,
  href,
  image,
  priority = false,
  sizes = "(max-width: 559px) 46vw, (max-width: 1023px) 31vw, 300px",
}: PosterCardProps) {
  const isGirls = category?.toLowerCase() === "girls";
  const boys = category?.toLowerCase() === "boys";

  // Girls' events have their own poster where one exists; otherwise the
  // sport's poster stands in.
  const defaultSrc = image ?? (isGirls ? `/event-${slug}-girls.jpg` : `/event-${slug}.jpg`);
  const fallbackSrc = `/event-${slug}.jpg`;
  const [src, setSrc] = useState(defaultSrc);
  useEffect(() => {
    setSrc(defaultSrc);
  }, [defaultSrc]);

  const hasMeta = Boolean(date) || slotsLeft !== undefined;

  return (
    <Link href={href} className={styles.card}>
      {/* The slab, uncovered as the bill burns */}
      <span className={styles.under}>
        {category ? (
          <span className={`${styles.uTag} ${boys ? styles.uTagCrimson : ""}`}>{category}</span>
        ) : null}
        <span className={styles.uName}>{name}</span>
        {format ? <span className={styles.uFormat}>{format}</span> : null}
        {hasMeta ? (
          <span className={styles.uMeta}>
            {date ? <span>{date}</span> : null}
            {slotsLeft !== undefined ? (
              <span className={slotsLeft === 0 ? styles.uFull : styles.uSlots}>
                {slotsLeft === 0 ? "Entries closed" : `${slotsLeft} slots left`}
              </span>
            ) : null}
          </span>
        ) : null}
        <span className={styles.uCta}>
          Enter the arena <span aria-hidden="true">→</span>
        </span>
      </span>

      {/* The bill (the canvas repaints this and burns it) */}
      <span
        className={styles.paper}
        style={{ ...DECKLE, backgroundImage: `url("${PAPER_GRAIN}")` }}
        data-paper=""
        aria-hidden="true"
      >
        <Image
          src={src}
          alt=""
          width={1600}
          height={2000}
          sizes={sizes}
          quality={75}
          loading={priority ? "eager" : "lazy"}
          className={styles.poster}
          onError={() => {
            if (src !== fallbackSrc) setSrc(fallbackSrc);
          }}
        />
        <span className={styles.age} />
        <span className={styles.print}>
          {category ? (
            <span className={`${styles.pTag} ${boys ? styles.pTagBoys : ""}`} data-print="">
              {category}
            </span>
          ) : null}
          <span className={styles.pName} data-print="">
            {name}
          </span>
          {format || date ? (
            <span className={styles.pFormat} data-print="">
              {[format, date].filter(Boolean).join(" · ")}
            </span>
          ) : null}
        </span>
      </span>

      <PaperBurn className={styles.fire} style={DECKLE} />
    </Link>
  );
}
