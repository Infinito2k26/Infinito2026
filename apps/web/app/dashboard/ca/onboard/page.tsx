"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

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
    const router = useRouter();
    const [apiError, setApiError] = React.useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<OnboardFormValues>({
        resolver: zodResolver(onboardSchema),
    });

    const onSubmit = async (data: OnboardFormValues) => {
        try {
            setApiError('');
            await api.post('/ca/onboard', { college: data.college });
            router.push('/dashboard/ca');
        } catch (error: any) {
            setApiError(error?.message || 'Failed to complete onboarding');
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.onboardCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome to the Team</h1>
                    <p className={styles.subtitle}>
                        You've been approved as a Campus Ambassador! Select your assigned college to generate your referral link.
                    </p>
                </div>

                {apiError && (
                    <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4 text-sm text-center border border-red-300">
                        {apiError}
                    </div>
                )}

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