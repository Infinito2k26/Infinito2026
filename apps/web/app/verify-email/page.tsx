"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import AuthLayout from '@/components/layout/auth-layout';
import { api, ApiError } from '@/lib/api';

import styles from '../forgot-password/forgot-password.module.css';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = React.useState<'verifying' | 'success' | 'error'>(
        token ? 'verifying' : 'error',
    );
    const [errorMessage, setErrorMessage] = React.useState('This link is missing its verification token.');

    React.useEffect(() => {
        if (!token) return;

        api.post('/auth/verify-email', { token })
            .then(() => setStatus('success'))
            .catch((error: unknown) => {
                setErrorMessage(
                    error instanceof ApiError ? error.message : 'This link is invalid or has expired.',
                );
                setStatus('error');
            });
    }, [token]);

    return (
        <AuthLayout>
            <div className={styles.header}>
                <h1 className={styles.title}>Verify Email</h1>
            </div>

            {status === 'verifying' && <p className={styles.subtitle}>Verifying your email&hellip;</p>}

            {status === 'success' && (
                <div className={styles.successAlert}>
                    Your email is verified. You can now submit payments and register for events.
                </div>
            )}

            {status === 'error' && <div className={styles.errorAlert}>{errorMessage}</div>}

            <div className={styles.footer}>
                <p className={styles.footerText}>
                    <Link href="/dashboard" className={styles.link}>
                        Go to Dashboard
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
