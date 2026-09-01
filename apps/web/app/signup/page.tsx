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
import { getPasswordStrength } from '@/lib/password-strength';

import styles from './signup.module.css';

const signupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    consent: z.literal(true, {
        message: 'You must agree to the Privacy Policy and data collection',
    }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const router = useRouter();
    const [apiError, setApiError] = React.useState('');
    const [password, setPassword] = React.useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });

    const { onChange: onPasswordChange, ...passwordField } = register('password');
    const strength = getPasswordStrength(password);

    const onSubmit = async (data: SignupFormValues) => {
        try {
            setApiError('');
            await api.post('/auth/register', data);
            router.push('/login?registered=1');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create account';
            setApiError(message);
        }
    };

    return (
        <AuthLayout>
            <div className={styles.header}>
                <h1 className={styles.title}>Create Your Account</h1>
                <p className={styles.subtitle}>Join Infinito 2K26</p>
            </div>

            {apiError && (
                <div className={styles.errorAlert}>
                    {apiError}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label htmlFor="name" className={styles.label}>
                        Full Name
                    </label>
                    <Input
                        id="name"
                        placeholder="Aditi Sharma"
                        disabled={isSubmitting}
                        error={errors.name?.message}
                        {...register('name')}
                    />
                </div>

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
                        onChange={(e) => {
                            setPassword(e.target.value);
                            onPasswordChange(e);
                        }}
                        {...passwordField}
                    />
                    {password.length > 0 && (
                        <>
                            <div className={styles.strengthMeter} aria-hidden="true">
                                {[1, 2, 3, 4].map((bar) => (
                                    <span
                                        key={bar}
                                        className={`${styles.strengthBar} ${
                                            bar <= strength.score ? styles.strengthBarFilled : ''
                                        }`}
                                        style={
                                            bar <= strength.score
                                                ? ({ '--strength-color': strength.color } as React.CSSProperties)
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                            <span
                                className={styles.strengthLabel}
                                style={{ '--strength-color': strength.color } as React.CSSProperties}
                            >
                                {strength.label}
                            </span>
                        </>
                    )}
                </div>

                <div className={styles.checkboxGroup}>
                    <input
                        type="checkbox"
                        id="consent"
                        className={styles.checkbox}
                        disabled={isSubmitting}
                        {...register('consent')}
                    />
                    <label htmlFor="consent" className={styles.checkboxLabel}>
                        I agree to the{' '}
                        <Link href="/privacy-policy" className={styles.link} target="_blank">
                            Privacy Policy
                        </Link>{' '}
                        and{' '}
                        <Link href="/terms-and-conditions" className={styles.link} target="_blank">
                            Terms &amp; Conditions
                        </Link>
                        , and consent to data collection.
                    </label>
                </div>
                {errors.consent && (
                    <span className={styles.errorText}>{errors.consent.message}</span>
                )}

                <Button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                >
                    Create Account
                </Button>
            </form>

            <div className={styles.footer}>
                <p className={styles.footerText}>
                    Already have an account?{' '}
                    <Link href="/login" className={styles.link}>
                        Log In
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
