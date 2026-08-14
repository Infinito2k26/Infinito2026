"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

import styles from './register.module.css';

const registerSchema = z.object({
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    college: z.string().min(2, 'College name is required'),
    consent: z.literal(true, {
        message: 'You must agree to the Privacy Policy and data collection',
    }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const searchParams = useSearchParams();
    const refCode = searchParams.get('ref');

    const [successMessage, setSuccessMessage] = useState('');
    const [apiError, setApiError] = useState('');

    React.useEffect(() => {
        if (refCode) {
            api.post('/ca/referral/click', { referralCode: refCode }).catch(console.error);
        }
    }, [refCode]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setApiError('');
            setSuccessMessage('');
            
            const payload = {
                email: data.email,
                name: data.name,
                phone: data.phone,
                college: data.college,
            };
            
            const response = await api.post('/auth/register', payload);
            setSuccessMessage(response?.message || 'OTP sent to email for verification');
        } catch (error: any) {
            setApiError(error?.message || 'An error occurred during registration.');
        }
    };

    if (successMessage) {
        return (
            <div className={styles.pageWrapper}>
                <Card className={styles.registerCard}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Registration Successful</h1>
                        <p className={styles.subtitle}>{successMessage}</p>
                    </div>
                    <div className={styles.footer}>
                        <p className={styles.footerText}>
                            <Link href="/login" className={styles.link}>
                                Go to Sign In
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.registerCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create an Account</h1>
                    <p className={styles.subtitle}>
                        Register for Infinito 2K26
                    </p>
                </div>

                {apiError && (
                    <div className={styles.errorAlert}>
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name" className={styles.label}>Full Name</label>
                        <Input
                            id="name"
                            placeholder="Aditi Sharma"
                            disabled={isSubmitting}
                            error={errors.name?.message}
                            {...register('name')}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Email Address</label>
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
                        <label htmlFor="phone" className={styles.label}>Phone Number</label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="9876543210"
                            disabled={isSubmitting}
                            error={errors.phone?.message}
                            {...register('phone')}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="college" className={styles.label}>College Name</label>
                        <Input
                            id="college"
                            placeholder="Enter your college"
                            disabled={isSubmitting}
                            error={errors.college?.message}
                            {...register('college')}
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
                        Register
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        Already have an account?{' '}
                        <Link href="/login" className={styles.link}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}