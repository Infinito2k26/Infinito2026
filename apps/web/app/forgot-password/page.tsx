"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

import styles from './forgot-password.module.css';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = React.useState(false);
    const [apiError, setApiError] = React.useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        try {
            setApiError('');
            await api.post('/auth/forgot-password', data);
            setSubmitted(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
            setApiError(message);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Forgot Password</h1>
                    <p className={styles.subtitle}>
                        Enter your email and we&apos;ll send you a link to reset your password.
                    </p>
                </div>

                {apiError && <div className={styles.errorAlert}>{apiError}</div>}

                {submitted ? (
                    <div className={styles.successAlert}>
                        If that email is registered, a reset link has been sent. Check your inbox.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@college.edu"
                                disabled={isSubmitting}
                                error={errors.email?.message}
                                {...register('email')}
                            />
                        </div>

                        <Button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                        >
                            Send Reset Link
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
            </Card>
        </div>
    );
}
