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

import styles from './login.module.css';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get('registered') === '1';
    const [apiError, setApiError] = React.useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setApiError('');
            const res = await api.post('/auth/login', data);
            
            if (res && res.accessToken) {
                localStorage.setItem('infinito_token', res.accessToken);
            }
            
            const role = res?.user?.role;
            if (role === 'ADMIN') {
                router.push('/admin');
            } else if (role === 'CAMPUS_AMBASSADOR') {
                router.push('/dashboard/ca');
            } else {
                router.push('/dashboard');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Invalid email or password';
            setApiError(message);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.loginCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Sign in to your Infinito account</p>
                </div>

                {justRegistered && !apiError && (
                    <div className={styles.successAlert}>
                        Account created! Log in to continue.
                    </div>
                )}

                {apiError && (
                    <div className={styles.errorAlert}>
                        {apiError}
                    </div>
                )}

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

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            disabled={isSubmitting}
                            error={errors.password?.message}
                            {...register('password')}
                        />
                    </div>

                    <Button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                    >
                        Login
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className={styles.link}>
                            Sign Up
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}