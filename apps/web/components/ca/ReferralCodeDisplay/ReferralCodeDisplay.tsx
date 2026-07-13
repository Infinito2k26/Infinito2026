"use client";

import styles from "./ReferralCodeDisplay.module.css";

interface ReferralCodeDisplayProps {
  code: string;
  onCopy: () => void;
  onShare: () => void;
}
export default function ReferralCodeDisplay({ code, onCopy ,onShare }: ReferralCodeDisplayProps) {
  return (
    <div className={styles.container}>
        <span className={styles.label}>Your Referral Code</span>
        <div className={styles.codeBox}>
        <span className={styles.code}>{code}</span>
        </div>
        <div className={styles.actions}>
        <button 
           type="button"
           className={`${styles.btn} ${styles.secondary}`}
           onClick={onCopy}
        >
          Copy Code
        </button>
        <button 
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            onClick={onShare}
         >
         Share Link
         </button>
        </div>
    </div>
  );
}