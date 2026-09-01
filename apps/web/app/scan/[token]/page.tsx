"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  UserCircle,
  MapPin,
  BedDouble,
  UtensilsCrossed,
  ScanLine,
  CheckCircle,
  Copy,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import Button from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/page-spinner";
import { ErrorState } from "@/components/ui/error-state";
import styles from "./scan.module.css";

type ScanDirection = "ENTRY" | "EXIT";
type ScanResult = "VALID" | "INVALID" | "DUPLICATE" | "EXPIRED";

interface ScanDashboard {
  credentialId: string;
  holder: {
    name: string;
    phone: string | null;
    photoUrl: string | null;
    college: string | null;
    isIITP: boolean;
    teamName: string | null;
    role: string | null;
    idType: string | null;
    idNumber: string | null;
  };
  event: { name: string; sportCategory: string; venue: string | null };
  accommodationOpted: boolean;
  messOnlyOpted: boolean;
  scanCount: number;
  lastScannedAt: string | null;
  recentScans: {
    gate: string;
    direction: ScanDirection;
    result: ScanResult;
    createdAt: string;
  }[];
}

export default function ScanPage() {
  const { token } = useParams<{ token: string }>();
  const [dashboard, setDashboard] = useState<ScanDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [gate, setGate] = useState("");
  const [direction, setDirection] = useState<ScanDirection>("ENTRY");
  const [isLogging, setIsLogging] = useState(false);
  const [logResult, setLogResult] = useState<{
    result: ScanResult;
    direction: ScanDirection;
    gate: string;
  } | null>(null);
  const [logError, setLogError] = useState<string | null>(null);

  const loadDashboard = () => {
    setIsLoading(true);
    setLoadError(null);
    api
      .get(`/identity/scan/${token}`)
      .then((res) => setDashboard(res.data))
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to load this credential.";
        setLoadError(message);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (token) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogScan = async () => {
    if (!gate.trim()) return;
    setIsLogging(true);
    setLogError(null);
    setLogResult(null);
    try {
      const res = await api.post("/identity/scan", { token, gate, direction });
      const { result } = res.data;
      setLogResult({ result, direction, gate });
      setDashboard((prev) =>
        prev
          ? {
              ...prev,
              scanCount:
                result === "VALID" ? prev.scanCount + 1 : prev.scanCount,
              lastScannedAt:
                result === "VALID" ? new Date().toISOString() : prev.lastScannedAt,
              recentScans: [
                { gate, direction, result, createdAt: new Date().toISOString() },
                ...prev.recentScans,
              ].slice(0, 5),
            }
          : prev,
      );
    } catch (err: unknown) {
      setLogError(err instanceof ApiError ? err.message : "Failed to log scan.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className={styles.container}>
      {isLoading && <PageSpinner message="Loading credential..." />}

      {!isLoading && loadError && (
        <ErrorState
          title="Couldn't verify this QR"
          description={loadError}
          onRetry={loadDashboard}
        />
      )}

      {!isLoading && dashboard && (
        <>
          <div className={styles.profileCard}>
            <div className={styles.photoWrap}>
              {dashboard.holder.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dashboard.holder.photoUrl}
                  alt={dashboard.holder.name}
                  className={styles.photo}
                />
              ) : (
                <UserCircle size={64} className={styles.photoFallback} />
              )}
            </div>

            <h1 className={styles.holderName}>{dashboard.holder.name}</h1>
            <p className={styles.holderMeta}>
              {dashboard.holder.college ?? "—"}
              {dashboard.holder.isIITP && (
                <span className={styles.iitpBadge}>IITP</span>
              )}
            </p>

            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Event</span>
                <span className={styles.infoValue}>
                  {dashboard.event.name}
                </span>
              </div>
              {dashboard.holder.teamName && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Team</span>
                  <span className={styles.infoValue}>
                    {dashboard.holder.teamName}
                    {dashboard.holder.role ? ` · ${dashboard.holder.role}` : ""}
                  </span>
                </div>
              )}
              {dashboard.event.venue && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    <MapPin size={14} /> Venue
                  </span>
                  <span className={styles.infoValue}>
                    {dashboard.event.venue}
                  </span>
                </div>
              )}
              {dashboard.holder.idType && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID</span>
                  <span className={styles.infoValue}>
                    {dashboard.holder.idType} · {dashboard.holder.idNumber}
                  </span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>
                  <ScanLine size={14} /> Scans
                </span>
                <span className={styles.infoValue}>
                  {dashboard.scanCount}
                  {dashboard.lastScannedAt &&
                    ` · last ${new Date(dashboard.lastScannedAt).toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className={styles.addonRow}>
              {dashboard.accommodationOpted && (
                <span className={styles.addonBadge}>
                  <BedDouble size={14} /> Accommodation
                </span>
              )}
              {dashboard.messOnlyOpted && (
                <span className={styles.addonBadge}>
                  <UtensilsCrossed size={14} /> Mess only
                </span>
              )}
            </div>
          </div>

          <div className={styles.actionCard}>
            <h2 className={styles.actionTitle}>Log gate scan</h2>

            <div className={styles.directionToggle}>
              {(["ENTRY", "EXIT"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.directionBtn} ${
                    direction === d ? styles.directionBtnActive : ""
                  }`}
                  onClick={() => setDirection(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            <input
              className={styles.gateInput}
              placeholder="Gate / location (e.g. Gate 1, Mess Hall)"
              value={gate}
              onChange={(e) => setGate(e.target.value)}
            />

            <Button
              onClick={handleLogScan}
              loading={isLogging}
              disabled={!gate.trim()}
              className={styles.logBtn}
            >
              Log {direction}
            </Button>

            {logError && <p className={styles.logError}>{logError}</p>}

            {logResult && (
              <div
                className={`${styles.resultBanner} ${
                  logResult.result === "VALID"
                    ? styles.resultValid
                    : styles.resultWarn
                }`}
              >
                {logResult.result === "VALID" ? (
                  <CheckCircle size={16} />
                ) : (
                  <Copy size={16} />
                )}
                {logResult.result === "VALID"
                  ? `${logResult.direction} logged at ${logResult.gate}`
                  : `Already scanned ${logResult.direction} — duplicate`}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
