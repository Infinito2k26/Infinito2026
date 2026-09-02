"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthLayout from '@/components/layout/auth-layout';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

import styles from './forgot-password.module.css';

const requestSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const resetSchema = z
    .object({
        code: z.string().length(6, 'Enter the 6-digit code from your email'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = React.useState<string | null>(null);
    const [apiError, setApiError] = React.useState('');
    const [done, setDone] = React.useState(false);

    const requestForm = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema),
    });

    const resetForm = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
    });

    const onRequestCode = async (data: RequestFormValues) => {
        try {
            setApiError('');
            await api.post('/auth/forgot-password', data);
            setEmail(data.email);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
            setApiError(message);
        }
    };

    const onResetPassword = async (data: ResetFormValues) => {
        if (!email) return;

        try {
            setApiError('');
            await api.post('/auth/reset-password', {
                email,
                code: data.code,
                newPassword: data.newPassword,
            });
            setDone(true);
            setTimeout(() => router.push('/login'), 2000);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Invalid or expired code.';
            setApiError(message);
        }
    };

    return (
        <AuthLayout>
            <div className={styles.header}>
                <h1 className={styles.title}>Forgot Password</h1>
                <p className={styles.subtitle}>
                    {!email
                        ? "Enter your email and we'll send you a 6-digit code."
                        : `Enter the code sent to ${email} and choose a new password.`}
                </p>
            </div>

            {apiError && <div className={styles.errorAlert}>{apiError}</div>}

            {done ? (
                <div className={styles.successAlert}>
                    Password reset. Redirecting to login&hellip;
                </div>
            ) : !email ? (
                <form onSubmit={requestForm.handleSubmit(onRequestCode)} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@college.edu"
                            disabled={requestForm.formState.isSubmitting}
                            error={requestForm.formState.errors.email?.message}
                            {...requestForm.register('email')}
                        />
                    </div>

                    <Button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={requestForm.formState.isSubmitting}
                        loading={requestForm.formState.isSubmitting}
                    >
                        Send Code
                    </Button>
                </form>
            ) : (
                <form onSubmit={resetForm.handleSubmit(onResetPassword)} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="code" className={styles.label}>
                            6-Digit Code
                        </label>
                        <Input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="123456"
                            disabled={resetForm.formState.isSubmitting}
                            error={resetForm.formState.errors.code?.message}
                            {...resetForm.register('code')}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="newPassword" className={styles.label}>
                            New Password
                        </label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            disabled={resetForm.formState.isSubmitting}
                            error={resetForm.formState.errors.newPassword?.message}
                            {...resetForm.register('newPassword')}
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
                            disabled={resetForm.formState.isSubmitting}
                            error={resetForm.formState.errors.confirmPassword?.message}
                            {...resetForm.register('confirmPassword')}
                        />
                    </div>

                    <Button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={resetForm.formState.isSubmitting}
                        loading={resetForm.formState.isSubmitting}
                    >
                        Reset Password
                    </Button>
                </form>
            )}

            <div className={styles.footer}>
                <p className={styles.footerText}>
                    Remembered your password?{' '}
                    <Link href="/login" className={styles.link}>
                        Log In
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
