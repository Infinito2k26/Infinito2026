import Link from "next/link";
import Hero from "@/components/home/hero";
import Countdown from "@/components/home/countdown";
import SportSlab from "@/components/home/sport-slab";
import Ornament from "@/components/ui/ornament";
import Reveal from "@/components/ui/reveal";
import CountUp from "@/components/ui/count-up";
import { FEATURED_SPORTS } from "@/lib/sports";
import styles from "./home-content.module.css";

const STATS = [
  { value: 17, label: "Sports" },
  { value: 3, label: "Categories" },
  { value: 3, label: "Days of war" },
  { value: 11, label: "Editions" },
];

const DAYS = [
  {
    numeral: "I",
    day: "Day I",
    date: "9 October",
    title: "The Gathering",
    body: "Opening ceremony, group stages across every team sport, and the first heats on the track.",
  },
  {
    numeral: "II",
    day: "Day II",
    date: "10 October",
    title: "The Reckoning",
    body: "Knockouts begin. Individual finals in chess, squash and table tennis, and the powerlifting platform opens.",
  },
  {
    numeral: "III",
    day: "Day III",
    date: "11 October",
    title: "The Last Stand",
    body: "Finals across every field, the athletics relay, and the closing ceremony with the overall trophy.",
  },
];

// Bento: the first and last featured sports take a double-width slab on desktop.
const WIDE = new Set([0, 5]);

export type FestDates = {
  start: string;
  label: string;
};

// Shared by the public "/" landing page and the logged-in "Home" tab at
// /dashboard — same battlefield banner and sections either way, see
// apps/web/app/page.tsx and apps/web/app/dashboard/page.tsx. `underNav` is set
// only on "/", where the hero runs up under the fixed transparent navbar.
export default function HomeContent({
  festDates,
  underNav = false,
}: {
  festDates: FestDates;
  underNav?: boolean;
}) {
  return (
    <div className={styles.ruins}>
      <Hero underNav={underNav} />

      <section className={styles.stats} aria-label="Infinito 2026 at a glance">
        <div className={styles.statsInner}>
          {STATS.map(({ value, label }, i) => (
            <Reveal key={label} index={i} className={styles.stat}>
              <span className={styles.statValue}>
                <CountUp value={value} />
              </span>
              <span className={styles.statRule} aria-hidden="true" />
              <span className={styles.statLabel}>{label}</span>
            </Reveal>
          ))}
        </div>
        <Countdown target={festDates.start} />
      </section>

      <section className={styles.sports}>
        <div className={styles.inner}>
          <div className={styles.sectionHeadRow}>
            <Reveal className={styles.sectionHead}>
              <p className={styles.eyebrow}>The battlefield awaits</p>
              <h2 className={styles.sectionTitle}>Choose your sport</h2>
              <p className={styles.sectionLede}>
                Seventeen sports across three categories. Pick your ground, gather
                your side, and register before entries close on 4 October.
              </p>
            </Reveal>
            <Link href="/sports" className={styles.textLink}>
              See all seventeen sports →
            </Link>
          </div>

          <div className={styles.bento}>
            {FEATURED_SPORTS.map((sport, i) => (
              <Reveal
                key={sport.id}
                index={i}
                className={`${styles.bentoCell} ${WIDE.has(i) ? styles.bentoWide : ""}`}
              >
                <SportSlab sport={sport} wide={WIDE.has(i)} eager={i < 2} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.schedule}>
        <div className={styles.inner}>
          <Reveal className={styles.sectionHead}>
            <p className={styles.eyebrow}>{festDates.label}</p>
            <h2 className={styles.sectionTitle}>Three days</h2>
          </Reveal>

          <ol className={styles.timeline}>
            {DAYS.map(({ numeral, day, date, title, body }, i) => (
              <li
                key={day}
                className={`${styles.dayItem} ${i === DAYS.length - 1 ? styles.climax : ""}`}
              >
                <span className={styles.node} aria-hidden="true" />
                <Reveal index={i} className={styles.day}>
                  <span className={styles.numeral} aria-hidden="true">
                    {numeral}
                  </span>
                  <p className={styles.dayLabel}>
                    {day} · {date}
                  </p>
                  <h3 className={styles.dayTitle}>{title}</h3>
                  <p className={styles.dayBody}>{body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.legacyBand}>
        <Ornament variant="ridge" fill="var(--abyss-950)" className={styles.legacyRidge} />
        <div className={styles.legacyGlow} aria-hidden="true" />
        <div className={styles.legacyEmbers} aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
        <Reveal className={styles.legacy}>
          <Ornament variant="valknut" className={styles.legacyMark} />
          <h2 className={styles.legacyTitle}>From the ruins, we rise</h2>
          <p className={styles.legacyBody}>
            One fest. Countless battles. One legacy still to be written. The ruins
            remain — what stands on them next is yours to decide.
          </p>
          <Link href="/signup" className={styles.legacyCta}>
            Write your legacy <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
