import React from "react";
import { EmptyState } from "@/components/ui/empty-state";
import styles from "./analytics.module.css";

export default function AnalyticsPage() {
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>
          View your performance metrics, referrals, and engagement statistics.
        </p>
      </div>

      <EmptyState
        title="Not enough data"
        description="Your analytics dashboard will populate once you start referring participants."
      />
    </div>
  );
}
