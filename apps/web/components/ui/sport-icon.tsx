import styles from "./sport-icon.module.css";

/**
 * Engraved-line sport marks.
 *
 * The teaser site used emoji (⚽ 🏐 🏏), which render differently on every
 * device and carry none of the theme. These are drawn in the key art's own idiom
 * — thin charcoal stroke, no fill — for the places a full poster does not fit:
 * filters, table cells, dropdowns, badges.
 *
 * Keyed by the same slugs as the poster files in /public, so `event-chess.jpg`
 * and the "chess" icon stay in step. Unknown slugs fall back to a rune mark
 * rather than rendering nothing.
 */

export type SportSlug =
  | "athletics"
  | "badminton"
  | "basketball"
  | "chess"
  | "cricket"
  | "football"
  | "kabaddi"
  | "lawntennis"
  | "powerlifting"
  | "squash"
  | "tabletennis"
  | "volleyball";

const PATHS: Record<SportSlug, React.ReactNode> = {
  football: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5 L15.8 10.3 L14.3 14.8 H9.7 L8.2 10.3 Z" />
      <path d="M12 3v4.5M20.6 10.3l-4.8 0M18.3 19.4l-4-4.6M5.7 19.4l4-4.6M3.4 10.3l4.8 0" />
    </>
  ),
  basketball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3.4 9.5c3.4 1.6 5.6 4.6 5.6 8.9M20.6 9.5c-3.4 1.6-5.6 4.6-5.6 8.9" />
    </>
  ),
  volleyball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-3.6 3.4-4.6 8.2-2.6 12.6M20.7 10.2c-4.6-1.4-9.2.3-11.9 4.3M6.1 19.9c1.8-4.5 5.9-7.3 10.6-7.1" />
    </>
  ),
  cricket: (
    <>
      <path d="M14.2 4.6l5.2 5.2a1.8 1.8 0 0 1 0 2.5l-.9.9a1.8 1.8 0 0 1-2.5 0l-5.2-5.2a1.8 1.8 0 0 1 0-2.5l.9-.9a1.8 1.8 0 0 1 2.5 0Z" />
      <path d="M10.6 10.4 5.2 15.8" />
      <circle cx="6.5" cy="18.2" r="2.6" />
    </>
  ),
  kabaddi: (
    <>
      <path d="M12 3v18" strokeDasharray="2 2.4" />
      <path d="M8.4 8.6 4.2 12l4.2 3.4" />
      <path d="M4.6 12H9.6" />
      <path d="M15.6 8.6 19.8 12l-4.2 3.4" />
      <path d="M19.4 12h-5" />
    </>
  ),
  chess: (
    <>
      <circle cx="12" cy="5.6" r="2.4" />
      <path d="M9.6 9.2h4.8l-1 4.4h-2.8Z" />
      <path d="M9 17.2c0-2 1-3 1.6-3.6h2.8c.6.6 1.6 1.6 1.6 3.6Z" />
      <path d="M6.6 20.6h10.8" />
    </>
  ),
  badminton: (
    <>
      <path d="M13.4 3.4a2.6 2.6 0 0 1 3.7 3.7l-4 4-3.7-3.7Z" />
      <path d="M9.4 7.4 4.2 15a2.4 2.4 0 0 0 3.3 3.3l7.6-5.2" />
      <path d="M6.6 11.6 9.9 15M8.8 16.9l1.9-2.7" />
    </>
  ),
  tabletennis: (
    <>
      <path d="M14.8 3.6a5.4 5.4 0 0 1 0 8.8L11 15.2 7.4 11.6l2.8-4a5.4 5.4 0 0 1 4.6-4Z" />
      <path d="m7.9 14.4-3.3 4a1.6 1.6 0 0 0 2.3 2.2l4-3.4" />
      <circle cx="18.4" cy="16.6" r="2.2" />
    </>
  ),
  lawntennis: (
    <>
      <ellipse cx="13.4" cy="8.4" rx="5" ry="6.2" transform="rotate(-32 13.4 8.4)" />
      <path d="M10.2 12.8 5.4 19a1.9 1.9 0 0 0 2.7 2.6l5-4.6" />
      <path d="M10.6 5.2 16.8 11M9.6 9.2l5.6-5.4" />
    </>
  ),
  squash: (
    <>
      <path d="M12.4 3.2c3.4 0 5.6 2.6 5.6 5.8s-2.4 5.4-5.6 5.4-5.6-2.4-5.6-5.4 2.2-5.8 5.6-5.8Z" />
      <path d="M12.4 14.4v4.2a2 2 0 0 1-2 2H8.6" />
      <circle cx="19.4" cy="18.6" r="1.8" />
      <path d="M14.6 17.4h1.6M14.6 20h1.6" />
    </>
  ),
  athletics: (
    <>
      <rect x="2.6" y="6.6" width="18.8" height="10.8" rx="5.4" />
      <rect x="6.4" y="9.6" width="11.2" height="4.8" rx="2.4" />
      <path d="M12 6.6v2.9M12 14.5v2.9" />
    </>
  ),
  powerlifting: (
    <>
      <path d="M3 12h18" />
      <path d="M6.4 8.4v7.2M9 6.6v10.8M15 6.6v10.8M17.6 8.4v7.2" />
    </>
  ),
};

const FALLBACK = (
  <>
    <path d="M12 3.6 4.8 8v8L12 20.4 19.2 16V8Z" />
    <path d="M12 8.4 9 13.6h6Z" />
  </>
);

type SportIconProps = {
  sport: string;
  /** Pixel size; icons are drawn on a 24px grid. */
  size?: number;
  className?: string;
  /** Provide when the icon is the only label for its control. */
  title?: string;
};

export default function SportIcon({
  sport,
  size = 24,
  className,
  title,
}: SportIconProps) {
  const slug = sport.toLowerCase().replace(/[^a-z]/g, "") as SportSlug;
  const glyph = PATHS[slug] ?? FALLBACK;

  return (
    <svg
      className={[styles.icon, className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  );
}
