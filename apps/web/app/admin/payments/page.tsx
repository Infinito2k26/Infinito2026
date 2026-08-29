"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, XCircle } from 'lucide-react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';

import styles from './admin-payments.module.css';

interface AdminPayment {
    id: string;
    amount: string;
    mode: string;
    status: 'INITIATED' | 'RECONCILIATION_PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
    screenshotUrl: string | null;
    transactionId: string | null;
    rejectionReason: string | null;
    createdAt: string;
    registration: {
        id: string;
        status: string;
        event: { id: string; name: string };
        user: { id: string; name: string; email: string } | null;
        team: {
            id: string;
            name: string;
            captain: { id: string; name: string; email: string };
        } | null;
    };
}

function formatInr(amount: string): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(amount));
}

function registrantLabel(registration: AdminPayment['registration']): string {
    if (registration.user) {
        return `${registration.user.name} (${registration.user.email})`;
    }
    if (registration.team) {
        return `${registration.team.name} — captain ${registration.team.captain.name} (${registration.team.captain.email})`;
    }
    return 'Unknown registrant';
}

const reviewSchema = z.object({
    action: z.enum(['SUCCESS', 'FAILED']),
    rejectionReason: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.action === 'FAILED' && (!data.rejectionReason || data.rejectionReason.length < 5)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A detailed reason is required for rejection",
            path: ["rejectionReason"],
        });
    }
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const ReviewActionForm = ({
    paymentId,
    onComplete,
}: {
    paymentId: string;
    onComplete: () => void;
}) => {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: { action: 'SUCCESS' },
    });

    const selectedAction = watch('action');

    const onSubmit = async (data: ReviewFormValues) => {
        await api.patch(`/admin/payments/${paymentId}/verify`, {
            status: data.action,
            rejectionReason: data.rejectionReason,
        });
        onComplete();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.reviewForm}>
            <div className={styles.actionToggle}>
                <label className={`${styles.radioLabel} ${selectedAction === 'SUCCESS' ? styles.radioApprove : ''}`}>
                    <input type="radio" value="SUCCESS" {...register('action')} className={styles.radioInput} />
                    Approve
                </label>
                <label className={`${styles.radioLabel} ${selectedAction === 'FAILED' ? styles.radioReject : ''}`}>
                    <input type="radio" value="FAILED" {...register('action')} className={styles.radioInput} />
                    Reject
                </label>
            </div>

            {selectedAction === 'FAILED' && (
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Reason for Rejection</label>
                    <textarea
                        className={`${styles.textarea} ${errors.rejectionReason ? styles.inputError : ''}`}
                        placeholder="Tell the registrant what's wrong with the proof..."
                        rows={2}
                        disabled={isSubmitting}
                        {...register('rejectionReason')}
                    />
                    {errors.rejectionReason && <span className={styles.errorText}>{errors.rejectionReason.message}</span>}
                </div>
            )}

            <div className={styles.formActions}>
                <Button type="button" onClick={onComplete} disabled={isSubmitting} className={styles.cancelBtn}>
                    Cancel
                </Button>
                <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                    Submit Verdict
                </Button>
            </div>
        </form>
    );
};

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<AdminPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/admin/payments?status=RECONCILIATION_PENDING');
            setPayments(data?.payments ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Pending Payments</h1>
                    <p className={styles.pageSubtitle}>Review UPI screenshot + transaction ID submissions.</p>
                </div>
            </header>

            <div className={styles.listContainer}>
                {isLoading ? (
                    <p className="text-muted-foreground p-4">Loading payments...</p>
                ) : payments.length === 0 ? (
                    <p className="text-muted-foreground p-4">No payments awaiting review.</p>
                ) : payments.map((payment) => (
                    <Card key={payment.id} className={styles.paymentCard}>
                        <div className={styles.cardTop}>
                            <div className={styles.registrantInfo}>
                                <h3 className={styles.eventName}>{payment.registration.event.name}</h3>
                                <span className={styles.registrantMeta}>{registrantLabel(payment.registration)}</span>
                            </div>
                            <span className={styles.amount}>{formatInr(payment.amount)}</span>
                        </div>

                        <div className={styles.proofRow}>
                            {payment.screenshotUrl && (
                                <a
                                    href={payment.screenshotUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.screenshotLink}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={payment.screenshotUrl}
                                        alt="Payment screenshot"
                                        className={styles.screenshotThumb}
                                    />
                                </a>
                            )}
                            <div className={styles.txnDetails}>
                                <span className={styles.txnLabel}>Transaction ID</span>
                                <span className={styles.txnValue}>{payment.transactionId ?? '—'}</span>
                            </div>
                        </div>

                        {payment.status === 'FAILED' && payment.rejectionReason && (
                            <div className={styles.resolutionDetails}>
                                <strong>Rejection Reason:</strong> {payment.rejectionReason}
                            </div>
                        )}

                        {payment.status === 'RECONCILIATION_PENDING' && (
                            <>
                                {activeReviewId !== payment.id && (
                                    <div className={styles.actionArea}>
                                        <Button onClick={() => setActiveReviewId(payment.id)} className={styles.reviewTriggerBtn}>
                                            Review Payment
                                        </Button>
                                    </div>
                                )}

                                {activeReviewId === payment.id && (
                                    <div className={styles.activeReviewZone}>
                                        <ReviewActionForm
                                            paymentId={payment.id}
                                            onComplete={() => {
                                                setActiveReviewId(null);
                                                fetchPayments();
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {payment.status === 'SUCCESS' && (
                            <span className={`${styles.statusBadge} ${styles.statusApproved}`}><CheckCircle size={14} /> Approved</span>
                        )}
                        {payment.status === 'FAILED' && (
                            <span className={`${styles.statusBadge} ${styles.statusRejected}`}><XCircle size={14} /> Rejected</span>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
