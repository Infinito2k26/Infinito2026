import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/public-layout';
import Ornament from '@/components/ui/ornament';
import styles from './about.module.css';

export const metadata: Metadata = {
    title: 'About',
    description:
        "Infinito is IIT Patna's annual sports fest — Eastern India's largest inter-college sporting event. Learn the story behind Ruins of Ragnarok.",
};

const STATS = [
    { value: '11ᵗʰ', label: 'Edition' },
    { value: '17', label: 'Sports' },
    { value: '3', label: 'Categories' },
    { value: '3', label: 'Days' },
];

export default function AboutPage() {
    return (
        <PublicLayout>
            <header className={styles.header}>
                <p className="eyebrow">From the ruins we rise</p>
                <h1 className={`${styles.title} glow`}>About Infinito</h1>
            </header>

            <section className={styles.stats} aria-label="Infinito by the numbers">
                {STATS.map((stat) => (
                    <div key={stat.label} className={styles.stat}>
                        <span className={styles.statValue}>{stat.value}</span>
                        <span className={styles.statLabel}>{stat.label}</span>
                    </div>
                ))}
            </section>

            <Ornament variant="arrowRule" className={styles.rule} />

            <article className={styles.prose}>
                <p>
                    Infinito is IIT Patna&apos;s annual sports fest — Eastern India&apos;s largest
                    inter-college sporting event. Every October, teams and individual athletes from
                    across the region converge on campus to compete across seventeen sports, three
                    categories, and three days that decide who leaves with the trophy.
                </p>

                <h2>Ruins of Ragnarok</h2>
                <p>
                    This edition&apos;s theme is <strong>Ruins of Ragnarok</strong> — from the ruins we
                    rise. Every champion arrives from some kind of wreckage: a lost final, an injury, a
                    season that ended too early. Infinito 2026 is built on that idea. The fest doesn&apos;t
                    ask who was undefeated last year — it asks who&apos;s ready to rise this one.
                </p>

                <h2>Eleven editions in</h2>
                <p>
                    Infinito has run for a decade before this one, growing from a campus-only meet into
                    the inter-college fixture it is today. Each edition has added a sport, a category, or
                    a few thousand more footsteps through the gates — this year continues that, with
                    seventeen sports open across Boys, Girls, and Open categories, run out of IIT
                    Patna&apos;s campus over 9–11 October 2026.
                </p>

                <h2>Who runs it</h2>
                <p>
                    Infinito is organized entirely by IIT Patna students — the same people building this
                    platform, running the gates, and verifying payments by hand at 1 a.m. during entry
                    week. A network of Campus Ambassadors extends the organizing team onto partner
                    campuses, spreading the word and helping teams register before the entries close.
                </p>

                <p>
                    Questions about this year&apos;s edition, sponsorship, or your college&apos;s
                    participation can be directed to the organizing team through the contact channels on
                    the fest&apos;s official pages.
                </p>
            </article>
        </PublicLayout>
    );
}
