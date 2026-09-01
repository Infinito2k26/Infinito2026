import PublicLayout from '@/components/layout/public-layout';
import styles from './about.module.css';

export default function AboutPage() {
    return (
        <PublicLayout>
            <div className={styles.wrapper}>
                <h1 className={styles.title}>About Infinito</h1>
                <p className={styles.description}>
                    Infinito 2K26 is the annual sports fest of IIT Patna — Eastern India&apos;s largest
                    inter-college sporting event, bringing together athletes from across the region to
                    compete, connect, and celebrate sport. Full details on this year&apos;s edition are
                    on their way.
                </p>
            </div>
        </PublicLayout>
    );
}
