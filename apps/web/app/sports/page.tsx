import Link from 'next/link';
import PublicLayout from '@/components/layout/public-layout';
import Button from '@/components/ui/button';
import styles from './sports.module.css';

export default function SportsPage() {
    return (
        <PublicLayout>
            <div className={styles.wrapper}>
                <h1 className={styles.title}>Sports</h1>
                <p className={styles.description}>
                    Get ready for intense competition and thrilling sports action. The full sports
                    calendar is being finalized — in the meantime, browse the events already open.
                </p>
                <Link href="/events">
                    <Button variant="secondary">Browse Events</Button>
                </Link>
            </div>
        </PublicLayout>
    );
}
