"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

import styles from '../forgot-password/forgot-password.module.css';

const resetPasswordSchema = z
    .object({
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [apiError, setApiError] = React.useState('');
    const [done, setDone] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordFormValues) => {
        if (!token) {
            setApiError('This reset link is missing its token. Please request a new one.');
            return;
        }

        try {
            setApiError('');
            await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
            setDone(true);
            setTimeout(() => router.push('/login'), 2000);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'This link is invalid or has expired.';
            setApiError(message);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Reset Password</h1>
                    <p className={styles.subtitle}>Choose a new password for your account.</p>
                </div>

                {apiError && <div className={styles.errorAlert}>{apiError}</div>}

                {done ? (
                    <div className={styles.successAlert}>
                        Password reset. Redirecting to login&hellip;
                    </div>
                ) : !token ? (
                    <div className={styles.errorAlert}>
                        This link is missing its reset token. Please request a new one from the{' '}
                        <Link href="/forgot-password" className={styles.link}>
                            forgot password
                        </Link>{' '}
                        page.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="newPassword" className={styles.label}>
                                New Password
                            </label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="••••••••"
                                disabled={isSubmitting}
                                error={errors.newPassword?.message}
                                {...register('newPassword')}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>
                                Confirm New Password
                            </label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                disabled={isSubmitting}
                                error={errors.confirmPassword?.message}
                                {...register('confirmPassword')}
                            />
                        </div>

                        <Button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                        >
                            Reset Password
                        </Button>
                    </form>
                )}

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        <Link href="/login" className={styles.link}>
                            Back to Log In
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
