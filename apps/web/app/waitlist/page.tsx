"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

const waitlistSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    college: z.string().min(2, 'College name is required'),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

export default function WaitlistPage() {
    const [apiError, setApiError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<WaitlistFormValues>({
        resolver: zodResolver(waitlistSchema),
    });

    const onSubmit = async (data: WaitlistFormValues) => {
        try {
            setApiError('');
            await api.post('/leads/waitlist', data);
            setIsSuccess(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to join waitlist';
            setApiError(message);
        }
    };

    return (
        <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md p-8 shadow-lg bg-white rounded-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Join the Waitlist</h1>
                    <p className="text-gray-500 mt-2">Get early access to Infinito 2K26</p>
                </div>

                {isSuccess ? (
                    <div className="text-center space-y-4">
                        <div className="bg-green-100 text-green-800 p-4 rounded-md border border-green-300">
                            Thank you! You have been successfully added to our waitlist. We will contact you soon.
                        </div>
                        <Link href="/" className="inline-block mt-4 text-blue-600 hover:underline">
                            Return to Homepage
                        </Link>
                    </div>
                ) : (
                    <>
                        {apiError && (
                            <div className="bg-red-100 text-red-800 p-3 rounded-md mb-6 text-sm text-center border border-red-300">
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-1">
                                <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    disabled={isSubmitting}
                                    error={errors.name?.message}
                                    {...register('name')}
                                />
                            </div>
                            
                            <div className="space-y-1">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@college.edu"
                                    disabled={isSubmitting}
                                    error={errors.email?.message}
                                    {...register('email')}
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="college" className="text-sm font-medium text-gray-700">College Name</label>
                                <Input
                                    id="college"
                                    placeholder="Your University"
                                    disabled={isSubmitting}
                                    error={errors.college?.message}
                                    {...register('college')}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-6"
                                disabled={isSubmitting}
                                loading={isSubmitting}
                            >
                                Join Waitlist
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 hover:underline font-medium">
                                Log in
                            </Link>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}