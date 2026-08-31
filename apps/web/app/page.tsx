import Link from "next/link";
import PublicLayout from "@/components/layout/public-layout";
import Hero from "@/components/home/hero";
import Countdown from "@/components/home/countdown";
import PosterCard from "@/components/ui/poster-card";
import Ornament from "@/components/ui/ornament";
import { FEATURED_SPORTS, FEST_DATES } from "@/lib/sports";
import styles from "./home.module.css";

const STATS = [
  { value: "17", label: "Sports" },
  { value: "3", label: "Categories" },
  { value: "3", label: "Days of war" },
  { value: "11", label: "Editions" },
];

const DAYS = [
  {
    day: "Day I",
    date: "9 October",
    title: "The Gathering",
    body: "Opening ceremony, group stages across every team sport, and the first heats on the track.",
  },
  {
    day: "Day II",
    date: "10 October",
    title: "The Reckoning",
    body: "Knockouts begin. Individual finals in chess, squash and table tennis, and the powerlifting platform opens.",
  },
  {
    day: "Day III",
    date: "11 October",
    title: "The Last Stand",
    body: "Finals across every field, the athletics relay, and the closing ceremony with the overall trophy.",
  },
];

export default function Home() {
  return (
    <PublicLayout>
      <Hero />

      <section className={styles.stats} aria-label="Infinito 2026 at a glance">
        <div className={styles.statsInner}>
          {STATS.map(({ value, label }) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
        <Countdown target={FEST_DATES.start} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <p className="eyebrow">The battlefield awaits</p>
          <h2 className={`${styles.sectionTitle} glow`}>Choose your sport</h2>
          <p className={styles.sectionLede}>
            Seventeen sports across three categories. Pick your ground, gather
            your side, and register before entries close on 4 October.
          </p>
        </div>

        <div className={styles.posterGrid}>
          {FEATURED_SPORTS.map((sport, i) => (
            <PosterCard
              key={sport.id}
              slug={sport.poster}
              name={sport.name}
              category={sport.category}
              format={sport.format}
              href={`/sports?sport=${sport.id}`}
              priority={i < 2}
            />
          ))}
        </div>

        <div className={styles.sectionFoot}>
          <Link href="/sports" className={styles.textLink}>
            See all seventeen sports →
          </Link>
        </div>
      </section>

      <section className={styles.schedule}>
        <div className={styles.sectionHead}>
          <p className="eyebrow">{FEST_DATES.label}</p>
          <h2 className={`${styles.sectionTitle} glow`}>Three days</h2>
        </div>
        <div className={styles.dayGrid}>
          {DAYS.map(({ day, date, title, body }) => (
            <article key={day} className={styles.day}>
              <p className={styles.dayLabel}>
                {day} · {date}
              </p>
              <h3 className={styles.dayTitle}>{title}</h3>
              <p className={styles.dayBody}>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <Ornament variant="ridge" />

      <section className={styles.legacy}>
        <Ornament variant="valknut" className={styles.legacyMark} />
        <h2 className={styles.legacyTitle}>From the ruins, we rise</h2>
        <p className={styles.legacyBody}>
          One fest. Countless battles. One legacy still to be written. The ruins
          remain — what stands on them next is yours to decide.
        </p>
        <Link href="/register" className={styles.legacyCta}>
          Write your legacy
        </Link>
      </section>
    </PublicLayout>
  );
}
