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
  college: string | null;
  phone: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", college: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data);
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

  const startEditing = () => {
    if (!profile) return;
    setForm({
      name: profile.name,
      phone: profile.phone ?? "",
      college: profile.college ?? "",
    });
    setFormError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phone.trim().length < 10) {
      setFormError("Please enter a valid phone number");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const res = await api.patch('/auth/me', form);
      setProfile(res.data);
      setIsEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update your profile.");
    } finally {
      setIsSaving(false);
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
        ) : isEditing ? (
          <Card className={styles.card}>
            <h3 className={styles.cardTitle}>Edit Profile</h3>
            <form onSubmit={handleSave} className={styles.editForm}>
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={isSaving}
              />
              <Input
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={formError ?? undefined}
                disabled={isSaving}
              />
              <Input
                label="College"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                disabled={isSaving}
              />
              <div className={styles.editActions}>
                <Button type="submit" disabled={isSaving} loading={isSaving}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
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
                <span className={styles.fieldValue}>{profile.phone ?? '—'}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>College</span>
                <span className={styles.fieldValue}>{profile.college ?? '—'}</span>
              </div>
            </div>
            <Button variant="outline" onClick={startEditing} className={styles.editBtn}>
              Edit Profile
            </Button>
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
