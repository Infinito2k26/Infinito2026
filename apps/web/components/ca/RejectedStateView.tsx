import React from 'react';
import { XCircle } from 'lucide-react';
import Button from '@/components/ui/button';
import styles from './styles.module.css';

export interface RejectedStateViewProps {
  rejectionReason: string | null;
  onReapply: () => void;
}

export function RejectedStateView({ rejectionReason, onReapply }: RejectedStateViewProps) {
  return (
    <div className={styles.rejectedContainer}>
      <XCircle className={styles.rejectedIcon} size={48} />
      <p className={styles.rejectedTitle}>Your application was not approved</p>
      {rejectionReason && (
        <p className={styles.rejectedReason}>{rejectionReason}</p>
      )}
      <Button onClick={onReapply}>Submit a New Application</Button>
    </div>
  );
}
