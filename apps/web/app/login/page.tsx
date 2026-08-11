"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';

import styles from './login.module.css';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        // TODO: Wire up lib/api.ts and global auth state here
        console.log('Login payload:', data);
    };

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.loginCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Sign in to your Infinito account</p>
                </div>

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
                        <Link href="/register" className={styles.link}>
                            Join the Waitlist
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}