"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import styles from "./ReferralCodeDisplay.module.css";

interface ReferralCodeDisplayProps {
  code: string;
  onCopy: () => void | Promise<void>;
  onShare: () => void;
}
export default function ReferralCodeDisplay({ code, onCopy, onShare }: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          onClick={handleCopy}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy Code"}
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
