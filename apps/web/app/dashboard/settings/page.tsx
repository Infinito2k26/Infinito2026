"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import styles from "./settings.module.css";

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data);
      setPhoneInput(res.data.phone ?? "");
    } catch (err) {
      console.error("Failed to load profile", err);
      setError(err instanceof Error ? err.message : "Failed to load your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSavePhone = async () => {
    if (phoneInput.trim().length < 10) {
      setPhoneError("Enter a valid phone number");
      return;
    }
    setPhoneError(null);
    setIsSavingPhone(true);
    try {
      const res = await api.patch('/auth/me/phone', { phone: phoneInput.trim() });
      setProfile(res.data);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Failed to save phone number.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.delete('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('infinito_token');
        router.push('/login');
      }
    }
  };

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Manage your account preferences and portal settings.
        </p>
      </div>

      <div className={styles.cardGroup}>
        {isLoading ? (
          <SectionSpinner message="Loading profile..." />
        ) : error || !profile ? (
          <ErrorState description={error ?? "Could not load your profile."} onRetry={fetchProfile} />
        ) : (
          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>Profile Information</h3>
            <div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Name</span>
                <span className={styles.fieldValue}>{profile.name}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Email</span>
                <span className={styles.fieldValue}>{profile.email}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Phone</span>
                {profile.phone ? (
                  <span className={styles.fieldValue}>{profile.phone}</span>
                ) : (
                  <div className={styles.phoneEditRow}>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      error={phoneError ?? undefined}
                      disabled={isSavingPhone}
                    />
                    <Button
                      onClick={handleSavePhone}
                      disabled={isSavingPhone}
                      loading={isSavingPhone}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>College</span>
                <span className={styles.fieldValue}>{profile.college ?? '—'}</span>
              </div>
            </div>
          </Card>
        )}

        <Card className={styles.card}>
          <h3 className={styles.dangerTitle}>Danger Zone</h3>
          <p className={styles.dangerText}>
            Logging out will clear your session and you will need to log in again.
          </p>
          <Button variant="outline" onClick={handleLogout} className={styles.signOutBtn}>
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
}
