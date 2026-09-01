import PublicLayout from '@/components/layout/public-layout';
import styles from './upcoming.module.css';

export default function UpcomingPage() {
    return (
        <PublicLayout>
            <div className={styles.wrapper}>
                <h1 className={styles.title}>Coming Soon</h1>
                <p className={styles.description}>
                    This page isn&apos;t live yet. We&apos;re still building it out — check back closer to the
                    fest for updates.
                </p>
            </div>
        </PublicLayout>
    );
}
