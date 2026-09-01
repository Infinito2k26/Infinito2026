"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

import styles from './onboard.module.css';

const onboardSchema = z.object({
    college: z.string().min(1, 'College is required'),
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
            await api.post('/ca/onboard', data);
            router.push('/dashboard/ca');
        } catch (error: unknown) {
            const status = (error as { status?: number })?.status;
            const message = status === 409
                ? 'You have already onboarded as a Campus Ambassador.'
                : error instanceof Error ? error.message : 'Failed to onboard';
            setApiError(message);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.onboardCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome to the Team</h1>
                    <p className={styles.subtitle}>
                        You&apos;ve been approved as a Campus Ambassador! Enter your assigned college to generate your referral link.
                    </p>
                </div>

                {apiError && (
                    <div className={styles.errorText}>{apiError}</div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="college" className={styles.label}>
                            Assigned College
                        </label>
                        <Input
                            id="college"
                            placeholder="Enter your college"
                            disabled={isSubmitting}
                            error={errors.college?.message}
                            {...register('college')}
                        />
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
