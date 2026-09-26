import FireCanvas from "@/components/home/fire-canvas";
import page from "./page.module.css";

/**
 * The head of a public page: an ember eyebrow, the blackletter title and
 * whatever the page says under it (ledes as `<p className={page.lede}>`),
 * over a low bed of fire — the landing hero's flames banked down to a
 * smoulder along the bottom edge. `aside` sits to the right of the words on
 * wide screens (a page action, like the merch cart).
 *
 * FireCanvas stops drawing once the head scrolls out of view, and renders
 * nothing under reduced motion.
 */
export default function PageHead({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className={page.headBand}>
      <FireCanvas className={page.headFire} density={0.55} />
      <div className={page.head}>
        <div className={page.headWords}>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className={page.title}>{title}</h1>
          {children}
        </div>
        {aside ? <div className={page.headAside}>{aside}</div> : null}
      </div>
    </header>
  );
}
