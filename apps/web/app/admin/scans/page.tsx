"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Copy } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/card";
import styles from "./scans.module.css";

interface ScanLogRow {
  id: string;
  gate: string;
  direction: "ENTRY" | "EXIT";
  result: "VALID" | "INVALID" | "DUPLICATE" | "EXPIRED";
  createdAt: string;
  holderName: string | null;
  scannedBy: { id: string; name: string };
}

function ResultBadge({ result }: { result: ScanLogRow["result"] }) {
  if (result === "VALID") {
    return (
      <span className={`${styles.badge} ${styles.badgeValid}`}>
        <CheckCircle size={14} /> Valid
      </span>
    );
  }
  if (result === "DUPLICATE") {
    return (
      <span className={`${styles.badge} ${styles.badgeDuplicate}`}>
        <Copy size={14} /> Duplicate
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.badgeInvalid}`}>
      <XCircle size={14} /> {result === "EXPIRED" ? "Expired" : "Invalid"}
    </span>
  );
}

export default function AdminScansPage() {
  const [scans, setScans] = useState<ScanLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await api.get("/admin/scans?limit=50");
        setScans(res.data?.scans ?? []);
      } catch (err) {
        console.error("Failed to load scan logs", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScans();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Gate Scan Log</h1>
        <p className={styles.pageSubtitle}>
          Most recent QR credential scans across all gates.
        </p>
      </div>

      <Card className={styles.tableCard} padding="none">
        {isLoading ? (
          <p className={styles.emptyState}>Loading scans...</p>
        ) : scans.length === 0 ? (
          <p className={styles.emptyState}>No scans recorded yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.headRow}>
                <th className={styles.headCell}>Time</th>
                <th className={styles.headCell}>Holder</th>
                <th className={styles.headCell}>Gate</th>
                <th className={styles.headCell}>Direction</th>
                <th className={styles.headCell}>Result</th>
                <th className={styles.headCell}>Scanned By</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className={styles.bodyRow}>
                  <td className={styles.cellNowrap}>
                    {new Date(scan.createdAt).toLocaleString()}
                  </td>
                  <td className={styles.cell}>{scan.holderName ?? "—"}</td>
                  <td className={styles.cell}>{scan.gate}</td>
                  <td className={styles.cell}>{scan.direction}</td>
                  <td className={styles.cell}>
                    <ResultBadge result={scan.result} />
                  </td>
                  <td className={styles.cell}>{scan.scannedBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
