import React from 'react';
import { Clock } from 'lucide-react';
import styles from './styles.module.css';

export function PendingStateView() {
  return (
    <div className={styles.pendingContainer}>
      <Clock className={styles.pendingIcon} size={48} />
      <p className={styles.pendingText}>
        Your application is currently under review by the Infinito Admin team.
      </p>
    </div>
  );
}
