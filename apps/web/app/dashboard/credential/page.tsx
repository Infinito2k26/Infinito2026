"use client";

import { useEffect, useState } from "react";
import { Download, QrCode, ScanLine } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
import Ornament from "@/components/ui/ornament";
import styles from "./credential.module.css";

interface Credential {
  id: string;
  scanCount: number;
  lastScannedAt: string | null;
  qrImageUrl: string;
  createdAt: string;
}

export default function CredentialPage() {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notIssuedYet, setNotIssuedYet] = useState(false);

  useEffect(() => {
    const fetchCredential = async () => {
      try {
        const res = await api.get("/identity/mine");
        setCredential(res.data);
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          setNotIssuedYet(true);
        } else {
          console.error("Failed to load credential", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredential();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>My Credential</h1>
        <p className={styles.pageSubtitle}>
          Your QR entry pass for Infinito 2K26. Show it at the gate for scanning.
        </p>
      </div>

      {notIssuedYet && (
        <Card className={styles.stateCard}>
          <QrCode size={40} className={styles.stateIcon} />
          <h3 className={styles.stateTitle}>No credential yet</h3>
          <p className={styles.stateBody}>
            Your QR credential is generated automatically once your registration
            payment is confirmed by an admin. Check back after your payment is
            verified.
          </p>
        </Card>
      )}

      {credential && (
        <div className={styles.pass}>
          <Ornament variant="valknut" className={styles.passMark} />

          <p className={styles.passEyebrow}>Infinito 2026 · Entry Credential</p>

          <div className={styles.qrChip}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={credential.qrImageUrl}
              alt="Your entry QR credential"
              className={styles.qrImage}
            />
          </div>

          <div className={styles.metaGroup}>
            <p className={styles.metaLine}>
              Issued {new Date(credential.createdAt).toLocaleDateString()}
            </p>
            <div className={styles.scanLine}>
              <ScanLine size={16} />
              <span>
                Scanned {credential.scanCount}{" "}
                {credential.scanCount === 1 ? "time" : "times"}
              </span>
            </div>
          </div>

          <a
            href={credential.qrImageUrl}
            download={`infinito-credential-${credential.id}.png`}
            className={styles.downloadBtn}
          >
            <Download size={16} />
            Download QR
          </a>
        </div>
      )}
    </div>
  );
}
