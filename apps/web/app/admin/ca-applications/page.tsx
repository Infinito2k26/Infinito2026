"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, XCircle } from 'lucide-react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';

import styles from './admin-applications.module.css';

interface CAApplication {
    id: string;
    targetCollege: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

const reviewSchema = z.object({
    action: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.action === 'REJECTED' && (!data.rejectionReason || data.rejectionReason.length < 5)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A detailed reason is required for rejection",
            path: ["rejectionReason"],
        });
    }
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const ReviewActionForm = ({
    applicationId,
    onComplete,
}: {
    applicationId: string;
    onComplete: () => void;
}) => {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: { action: 'APPROVED' },
    });

    const selectedAction = watch('action');

    const onSubmit = async (data: ReviewFormValues) => {
        await api.patch(`/admin/ca-applications/${applicationId}/review`, {
            status: data.action,
            rejectionReason: data.rejectionReason,
        });
        onComplete();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.reviewForm}>
            <div className={styles.actionToggle}>
                <label className={`${styles.radioLabel} ${selectedAction === 'APPROVED' ? styles.radioApprove : ''}`}>
                    <input type="radio" value="APPROVED" {...register('action')} className={styles.radioInput} />
                    Approve
                </label>
                <label className={`${styles.radioLabel} ${selectedAction === 'REJECTED' ? styles.radioReject : ''}`}>
                    <input type="radio" value="REJECTED" {...register('action')} className={styles.radioInput} />
                    Reject
                </label>
            </div>

            {selectedAction === 'REJECTED' && (
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Reason for Rejection</label>
                    <textarea
                        className={`${styles.textarea} ${errors.rejectionReason ? styles.inputError : ''}`}
                        placeholder="Tell the applicant what needs fixing..."
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

export default function AdminCAApplicationsPage() {
    const [applications, setApplications] = useState<CAApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/admin/ca-applications?status=PENDING');
            setApplications(data?.applications ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>CA Applications</h1>
                    <p className={styles.pageSubtitle}>Review requests to become a Campus Ambassador.</p>
                </div>
            </header>

            <div className={styles.listContainer}>
                {isLoading ? (
                    <p className="text-muted-foreground p-4">Loading applications...</p>
                ) : applications.length === 0 ? (
                    <p className="text-muted-foreground p-4">No applications found.</p>
                ) : applications.map((application) => (
                    <Card key={application.id} className={styles.applicationCard}>
                        <div className={styles.cardTop}>
                            <div className={styles.applicantInfo}>
                                <h3 className={styles.applicantName}>{application.user.name}</h3>
                                <span className={styles.applicantMeta}>{application.user.email} • {application.targetCollege}</span>
                            </div>
                            <div>
                                {application.status === 'APPROVED' && <span className={`${styles.statusBadge} ${styles.statusApproved}`}><CheckCircle size={14} /> Approved</span>}
                                {application.status === 'REJECTED' && <span className={`${styles.statusBadge} ${styles.statusRejected}`}><XCircle size={14} /> Rejected</span>}
                                {application.status === 'PENDING' && <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pending</span>}
                            </div>
                        </div>

                        {application.status === 'REJECTED' && application.rejectionReason && (
                            <div className={styles.resolutionDetails}>
                                <strong>Rejection Reason:</strong> {application.rejectionReason}
                            </div>
                        )}

                        {application.status === 'PENDING' && activeReviewId !== application.id && (
                            <div className={styles.actionArea}>
                                <Button onClick={() => setActiveReviewId(application.id)} className={styles.reviewTriggerBtn}>
                                    Review Application
                                </Button>
                            </div>
                        )}

                        {activeReviewId === application.id && (
                            <div className={styles.activeReviewZone}>
                                <ReviewActionForm
                                    applicationId={application.id}
                                    onComplete={() => {
                                        setActiveReviewId(null);
                                        fetchApplications();
                                    }}
                                />
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
