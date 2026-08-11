"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Card from '@/components/ui/card';
import Button from '@/components/ui/button';

import styles from './onboard.module.css';

// Fixed list of participating colleges to prevent data collisions and inappropriate link generation
const COLLEGES = [
    "College 1",
    "College 2",
    "College 3",
    "College 4",
    "College 5"
] as const;

const onboardSchema = z.object({
    college: z.enum(COLLEGES, {
        message: 'Please select a valid college from the list'
    }),
});

type OnboardFormValues = z.infer<typeof onboardSchema>;

export default function CAOnboardPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<OnboardFormValues>({
        resolver: zodResolver(onboardSchema),
    });

    const onSubmit = async (data: OnboardFormValues) => {
        // TODO: Wire up POST /ca/onboard via lib/api.ts
        // Note: The backend will return 409 if this CA already has a profile.
        console.log('Onboarding payload:', data);

        // On success, redirect to the main CA dashboard
        // router.push('/dashboard/ca');
    };

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.onboardCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome to the Team</h1>
                    <p className={styles.subtitle}>
                        You&apos;ve been approved as a Campus Ambassador! Select your assigned college to generate your referral link.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="college" className={styles.label}>
                            Assigned College
                        </label>
                        <div className={styles.selectWrapper}>
                            <select
                                id="college"
                                disabled={isSubmitting}
                                className={`${styles.select} ${errors.college ? styles.selectError : ''}`}
                                defaultValue=""
                                {...register('college')}
                            >
                                <option value="" disabled>Select your college...</option>
                                {COLLEGES.map((college) => (
                                    <option key={college} value={college}>
                                        {college}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.college && (
                            <span className={styles.errorText}>{errors.college.message}</span>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                    >
                        Generate Referral Link
                    </Button>
                </form>
            </Card>
        </div>
    );
}