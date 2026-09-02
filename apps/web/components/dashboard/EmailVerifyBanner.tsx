"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import styles from "./EmailVerifyBanner.module.css";

export default function EmailVerifyBanner() {
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        const user = res?.data;
        if (user && !user.isEmailVerified && !user.isIITPVerified) {
          setEmail(user.email);
        }
      })
      .catch(() => {});
  }, []);

  if (!email) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      setSent(true);
    } catch (error: unknown) {
      // ponytail: enumeration-safe endpoint always "succeeds" server-side;
      // only a genuine network/5xx error reaches here.
      console.error(error instanceof ApiError ? error.message : error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.banner}>
      <span>
        Verify your email to enable payments — check your inbox for a link.
      </span>
      <button
        type="button"
        className={styles.resendBtn}
        onClick={handleResend}
        disabled={sending || sent}
      >
        {sent ? "Verification email sent" : sending ? "Sending…" : "Resend email"}
      </button>
    </div>
  );
}
