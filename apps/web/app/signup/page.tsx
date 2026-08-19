"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

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

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });

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
        <div className={styles.pageWrapper}>
            <Card className={styles.signupCard}>
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
                            {...register('password')}
                        />
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
                            and consent to data collection.
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
            </Card>
        </div>
    );
}
