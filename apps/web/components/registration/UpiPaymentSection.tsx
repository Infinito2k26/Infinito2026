"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import styles from "./UpiPaymentSection.module.css";

interface UpiPaymentSectionProps {
  /** Amount due in INR. Pass 0 for IITP registrations, which are fee-waived. */
  amountDue: number;
  vpa: string;
  payeeName?: string;
  qrImageUrl?: string;
  /** IITP registrations are always fee-waived (see Event fee logic). */
  isIITP?: boolean;
}

const DEFAULT_QR_IMAGE = "/payment/upi-qr-placeholder.svg";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function UpiPaymentSection({
  amountDue,
  vpa,
  payeeName = "Infinito 2K26",
  qrImageUrl = DEFAULT_QR_IMAGE,
  isIITP = false,
}: UpiPaymentSectionProps) {
  const [copied, setCopied] = useState(false);
  const isWaived = isIITP || amountDue === 0;

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) - VPA stays selectable as text.
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Payment</h3>
        <span className={styles.amount}>{formatInr(amountDue)}</span>
      </div>

      {isWaived ? (
        <div className={styles.waivedBanner}>
          No payment required — IITP registrations are fee-waived.
        </div>
      ) : (
        <>
          <p className={styles.instructions}>
            Scan the QR code with any UPI app, or pay directly to the VPA below.
            Keep the payment confirmation screenshot and transaction ID handy —
            you&apos;ll need to submit them on the next step.
          </p>

          <div className={styles.qrBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt={`UPI QR code to pay ${payeeName}`}
              className={styles.qrImage}
            />
          </div>

          <div className={styles.vpaRow}>
            <QrCode size={16} className={styles.vpaIcon} aria-hidden="true" />
            <span className={styles.vpaValue}>{vpa}</span>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyVpa}
              aria-label="Copy UPI ID"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className={styles.payee}>Payable to: {payeeName}</p>
        </>
      )}
    </div>
  );
}
