"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';

import styles from './register.module.css';

const waitlistSchema = z.object({
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    college: z.string().min(2, 'College name is required'),
    consent: z.literal(true, {
        message: 'You must agree to the Privacy Policy and data collection',
    }),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

export default function RegisterWaitlistPage() {
    const searchParams = useSearchParams();
    const referralCode = searchParams.get('ref');

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<WaitlistFormValues>({
        resolver: zodResolver(waitlistSchema),
    });

    const onSubmit = async (data: WaitlistFormValues) => {
        const payload = {
            ...data,
            referralCode: referralCode || null,
        };
        // TODO: Wire up POST /leads/waitlist via lib/api.ts
        console.log('Waitlist payload:', payload);
    };

    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.registerCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Registration Opens<br /> July 20th</h1>
                    <p className={styles.subtitle}>
                        Leave your details and you'll be emailed the moment it's live. No payment is required today.
                    </p>
                </div>

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
                            placeholder="+91 "
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
                        Join the Waitlist
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