import React from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import styles from './styles.module.css';

export function PendingStateView() {
  return (
    <div className={styles.pendingContainer}>
      <Clock className={styles.pendingIcon} size={48} />
      <p className={styles.pendingText}>
        Your application is currently under review by the Infinito Admin team.
      </p>
      <p className={styles.pendingHint}>
        We&apos;ll notify you once it&apos;s decided. In the meantime, browse{' '}
        <Link href="/events" className={styles.pendingLink}>
          this year&apos;s events
        </Link>{' '}
        so you know what you&apos;ll be representing.
      </p>
    </div>
  );
}
