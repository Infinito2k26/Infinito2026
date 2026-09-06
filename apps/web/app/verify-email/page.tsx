"use client";

import React from 'react';
import Link from 'next/link';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

import AuthLayout from '@/components/layout/auth-layout';
import { api, ApiError } from '@/lib/api';

import styles from '../forgot-password/forgot-password.module.css';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();

    const email = searchParams.get('email') ?? '';

    const [code, setCode] = React.useState('');
    const [status, setStatus] = React.useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = React.useState('');

    const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (code.length !== 6) {
            setErrorMessage('Please enter the 6-digit OTP.');
            setStatus('error');
            return;
        }

        setStatus('verifying');
        setErrorMessage('');

        try {
            await api.post('/auth/verify-email', {
                email,
                code,
            });

            setStatus('success');
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof ApiError
                    ? error.message
                    : 'Invalid or expired OTP.',
            );
            setStatus('error');
        }
    };

    return (
        <AuthLayout>
            <div className={styles.header}>
                <h1 className={styles.title}>Verify Email</h1>

                <p className={styles.subtitle}>
                    Enter the 6-digit verification code sent to your email.
                </p>
            </div>

            {email && (
                <p className={styles.subtitle}>
                    Code sent to <strong>{email}</strong>
                </p>
            )}

            {status === 'success' ? (
                <>
                    <div className={styles.successAlert}>
                        Your email is verified successfully.
                    </div>

                    <div className={styles.footer}>
                        <p className={styles.footerText}>
                            <Link href="/login" className={styles.link}>
                                Go to Login
                            </Link>
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <form onSubmit={handleVerify}>
                        <Input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={code}
                            onChange={(event) =>
                                setCode(event.target.value.replace(/\D/g, ''))
                            }
                            placeholder="Enter 6-digit OTP"
                            disabled={status === 'verifying'}
                        />

                        <Button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={status === 'verifying' || code.length !== 6}
                            loading={status === 'verifying'}
                        >
                            Verify Email
                        </Button>
                    </form>

                    {status === 'error' && (
                        <div className={styles.errorAlert}>
                            {errorMessage}
                        </div>
                    )}

                    <div className={styles.footer}>
                        <p className={styles.footerText}>
                            <Link href="/login" className={styles.link}>
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </>
            )}
        </AuthLayout>
    );
}