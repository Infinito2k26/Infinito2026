import Image from "next/image";
import Link from "next/link";
import SportIcon from "./sport-icon";
import styles from "./poster-card.module.css";

/**
 * The event poster card.
 *
 * The supplied posters already have the sport name set in crimson blackletter
 * inside the artwork, so nothing is ever drawn on top of the image — printing
 * "KABADDI" over a poster that already says KABADDI is the single easiest way to
 * make this site look unfinished.
 *
 * Instead every card carries a charcoal base strip. It holds the name and the
 * details the product actually needs to say, and it's what keeps a grid legible:
 * a dozen posters sharing the same bone ground otherwise wash into each other.
 */

export type PosterCardProps = {
  /** Matches the poster filename and the icon key, e.g. "kabaddi". */
  slug: string;
  name: string;
  /** Boys, Girls, Open. */
  category?: string;
  /** "Team · 7-a-side", "Individual", etc. */
  format?: string;
  date?: string;
  slotsLeft?: number;
  href: string;
  /** Override when the poster filename differs from the slug. */
  image?: string;
  /** Renders the first row of a grid eagerly; leave false below the fold. */
  priority?: boolean;
};

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
}: PosterCardProps) {
  const src = image ?? `/event-${slug}.jpg`;

  return (
    <Link href={href} className={styles.card}>
      <div className={styles.art}>
        <Image
          src={src}
          alt={`${name} at Infinito 2026 — Ruins of Ragnarok`}
          width={1600}
          height={2000}
          sizes="(max-width: 599px) 92vw, (max-width: 1023px) 46vw, 23vw"
          quality={78}
          priority={priority}
          className={styles.image}
        />
      </div>

      <div className={styles.strip}>
        <div className={styles.heading}>
          <SportIcon sport={slug} size={18} className={styles.icon} />
          <span className={styles.name}>{name}</span>
        </div>

        <div className={styles.meta}>
          {category ? <span className={styles.category}>{category}</span> : null}
          {format ? <span className={styles.detail}>{format}</span> : null}
        </div>

        {(date || slotsLeft !== undefined) && (
          <div className={styles.meta}>
            {date ? <span className={styles.detail}>{date}</span> : null}
            {slotsLeft !== undefined ? (
              <span
                className={slotsLeft === 0 ? styles.full : styles.slots}
              >
                {slotsLeft === 0 ? "Entries closed" : `${slotsLeft} slots left`}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  );
}
