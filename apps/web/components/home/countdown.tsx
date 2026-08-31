"use client";

import { useEffect, useState } from "react";
import styles from "./countdown.module.css";

/**
 * Days remaining until the fest opens.
 *
 * Rendered client-side only. Computing this on the server produces a value that
 * is already wrong by the time it reaches the reader and triggers a hydration
 * mismatch, so the markup stays empty until the browser fills it in.
 */

type Part = { value: number; label: string };

function partsUntil(target: string): Part[] | null {
  const ms = new Date(target).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;

  const total = Math.floor(ms / 1000);
  return [
    { value: Math.floor(total / 86400), label: "Days" },
    { value: Math.floor((total % 86400) / 3600), label: "Hours" },
    { value: Math.floor((total % 3600) / 60), label: "Minutes" },
  ];
}

export default function Countdown({ target }: { target: string }) {
  const [parts, setParts] = useState<Part[] | null>(null);

  useEffect(() => {
    setParts(partsUntil(target));
    const id = setInterval(() => setParts(partsUntil(target)), 30_000);
    return () => clearInterval(id);
  }, [target]);

  if (!parts) return null;

  return (
    <div className={styles.countdown}>
      <p className={styles.label}>Until the gates open</p>
      <div className={styles.parts}>
        {parts.map(({ value, label }) => (
          <div key={label} className={styles.part}>
            <span className={styles.value}>
              {String(value).padStart(2, "0")}
            </span>
            <span className={styles.unit}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
