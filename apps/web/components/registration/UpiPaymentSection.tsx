"use client";

import { useState } from "react";
import { Copy, Check, QrCode, Upload, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import styles from "./UpiPaymentSection.module.css";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface UpiPaymentSectionProps {
  /** Amount due in INR. Pass 0 for IITP registrations, which are fee-waived. */
  amountDue: number;
  vpa: string;
  payeeName?: string;
  qrImageUrl?: string;
  /** IITP registrations are always fee-waived (see Event fee logic). */
  isIITP?: boolean;
  /** Registration this payment is submitted against. Required unless isIITP/waived or onSubmit is provided. */
  registrationId?: string;
  /** Called once the screenshot + transaction ID are successfully submitted for review. */
  onSubmitted?: () => void;
  /** True when resuming a registration whose payment proof was already submitted (RECONCILIATION_PENDING/SUCCESS) — skips straight to the "submitted" banner instead of showing the upload form again. */
  initiallySubmitted?: boolean;
  /**
   * Override for what happens on submit — receives a FormData already
   * carrying transactionId/idempotencyKey/file. When omitted, defaults to
   * POST /payments with registrationId (the event-registration flow). Pass
   * this to reuse the same UPI/screenshot UI against a different endpoint
   * (e.g. merch order payment).
   */
  onSubmit?: (formData: FormData) => Promise<void>;
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
  registrationId,
  onSubmitted,
  onSubmit,
  initiallySubmitted = false,
}: UpiPaymentSectionProps) {
  const [copied, setCopied] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(initiallySubmitted);
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

  const handleFileChange = (selected: File | null) => {
    setFileError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError("Only JPG, PNG, or WEBP screenshots are accepted.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFileError("Screenshot must be under 5 MB.");
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!registrationId && !onSubmit) || !file || !transactionId.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("transactionId", transactionId.trim());
      formData.append("idempotencyKey", crypto.randomUUID());
      formData.append("file", file);

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        formData.append("registrationId", registrationId as string);
        await api.post("/payments", formData);
      }
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit payment proof.",
      );
    } finally {
      setSubmitting(false);
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

          {(registrationId || onSubmit) && !submitted && (
            <form className={styles.proofForm} onSubmit={handleSubmit}>
              <label className={styles.fieldLabel} htmlFor="upi-transaction-id">
                Transaction ID
              </label>
              <input
                id="upi-transaction-id"
                type="text"
                className={styles.textInput}
                placeholder="e.g. 123456789012"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />

              <label className={styles.fieldLabel} htmlFor="upi-screenshot">
                Payment screenshot
              </label>
              <label className={styles.fileDropzone} htmlFor="upi-screenshot">
                <Upload size={18} aria-hidden="true" />
                <span>{file ? file.name : "Choose screenshot (JPG, PNG, WEBP, max 5 MB)"}</span>
              </label>
              <input
                id="upi-screenshot"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.hiddenFileInput}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                required
              />
              {fileError && <p className={styles.errorText}>{fileError}</p>}

              {submitError && <p className={styles.errorText}>{submitError}</p>}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting || !file || !transactionId.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
                    Submitting...
                  </>
                ) : (
                  "Submit payment proof"
                )}
              </button>
            </form>
          )}

          {submitted && (
            <div className={styles.successBanner}>
              Payment proof submitted. Admin will verify it shortly — you can
              track status on your dashboard.
            </div>
          )}
        </>
      )}
    </div>
  );
}
