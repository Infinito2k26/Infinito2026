"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import { api } from '@/lib/api';

import styles from './admin-assignments.module.css';

interface TaskInfo {
    id: string;
    title: string;
    points: number;
}

interface TaskAssignment {
    id: string;
    status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
    proofUrl: string | null;
    pointsAwarded: number | null;
    rejectionReason: string | null;
    createdAt: string;
    caProfile: {
        assignedCollegeName: string;
        user: { name: string };
    };
}

const verifySchema = z.object({
    action: z.enum(['VERIFIED', 'REJECTED']),
    pointsOverride: z.number({ message: 'Points must be a valid number' }).optional(),
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

type VerifyFormValues = z.infer<typeof verifySchema>;

// Inline Review Component to keep form state isolated per submission
const ReviewActionForm = ({
    assignmentId,
    defaultPoints,
    onComplete
}: {
    assignmentId: string;
    defaultPoints: number;
    onComplete: () => void;
}) => {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<VerifyFormValues>({
        resolver: zodResolver(verifySchema),
        defaultValues: { action: 'VERIFIED', pointsOverride: defaultPoints }
    });

    const selectedAction = watch('action');

    const onSubmit = async (data: VerifyFormValues) => {
        await api.patch(`/admin/ca-task-assignments/${assignmentId}/verify`, {
            status: data.action,
            pointsOverride: data.action === 'VERIFIED' ? data.pointsOverride : undefined,
            rejectionReason: data.rejectionReason,
        });
        onComplete();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.reviewForm}>
            <div className={styles.actionToggle}>
                <label className={`${styles.radioLabel} ${selectedAction === 'VERIFIED' ? styles.radioApprove : ''}`}>
                    <input type="radio" value="VERIFIED" {...register('action')} className={styles.radioInput} />
                    Approve
                </label>
                <label className={`${styles.radioLabel} ${selectedAction === 'REJECTED' ? styles.radioReject : ''}`}>
                    <input type="radio" value="REJECTED" {...register('action')} className={styles.radioInput} />
                    Reject
                </label>
            </div>

            {selectedAction === 'VERIFIED' && (
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Points to Award (Override)</label>
                    <Input
                        type="number"
                        disabled={isSubmitting}
                        error={errors.pointsOverride?.message as string}
                        {...register('pointsOverride', { valueAsNumber: true })}
                    />
                </div>
            )}

            {selectedAction === 'REJECTED' && (
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Reason for Rejection</label>
                    <textarea
                        className={`${styles.textarea} ${errors.rejectionReason ? styles.inputError : ''}`}
                        placeholder="Tell the CA what needs fixing..."
                        rows={2}
                        disabled={isSubmitting}
                        {...register('rejectionReason')}
                    />
                    {errors.rejectionReason && <span className={styles.errorText}>{errors.rejectionReason.message as string}</span>}
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

export default function TaskAssignmentsPage({ params }: { params: { id: string } }) {
    const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null);
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

    const fetchAssignments = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/admin/ca-tasks/${params.id}/assignments`);
            setTaskInfo(res?.data?.task ?? null);
            setAssignments(res?.data?.assignments ?? []);
        } catch (err) {
            console.error("Failed to load assignments", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const renderProof = (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
            <ExternalLink size={14} /> View Proof
        </a>
    );

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.topNav}>
                <Link href="/admin/ca-tasks" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to Tasks
                </Link>
            </div>

            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Review Submissions</h1>
                {taskInfo && (
                    <div className={styles.taskMetaHeader}>
                        <span className={styles.taskTitle}>{taskInfo.title}</span>
                        <span className={styles.taskDefaultPoints}>{taskInfo.points} Pts Default</span>
                    </div>
                )}
            </header>

            <div className={styles.listContainer}>
                {isLoading ? (
                    <p className={styles.emptyState}>Loading submissions...</p>
                ) : assignments.length === 0 ? (
                    <p className={styles.emptyState}>No submissions yet.</p>
                ) : assignments.map((assignment) => (
                    <Card key={assignment.id} className={styles.assignmentCard}>
                        <div className={styles.cardTop}>
                            <div className={styles.caInfo}>
                                <h3 className={styles.caName}>{assignment.caProfile.user.name}</h3>
                                <span className={styles.caCollege}>{assignment.caProfile.assignedCollegeName}</span>
                            </div>
                            <div className={styles.statusBadgeWrapper}>
                                {assignment.status === 'VERIFIED' && <span className={`${styles.statusBadge} ${styles.statusApproved}`}><CheckCircle size={14} /> Verified</span>}
                                {assignment.status === 'REJECTED' && <span className={`${styles.statusBadge} ${styles.statusRejected}`}><XCircle size={14} /> Rejected</span>}
                                {assignment.status === 'SUBMITTED' && <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pending Review</span>}
                            </div>
                        </div>

                        {assignment.proofUrl && (
                            <div className={styles.proofSection}>
                                <span className={styles.proofLabel}>Proof Provided:</span>
                                {renderProof(assignment.proofUrl)}
                            </div>
                        )}

                        {assignment.status === 'VERIFIED' && assignment.pointsAwarded != null && (
                            <div className={styles.resolutionDetails}>
                                <strong>Points Awarded:</strong> {assignment.pointsAwarded}
                            </div>
                        )}

                        {assignment.status === 'REJECTED' && assignment.rejectionReason && (
                            <div className={styles.resolutionDetails}>
                                <strong>Rejection Reason:</strong> {assignment.rejectionReason}
                            </div>
                        )}

                        {assignment.status === 'SUBMITTED' && activeReviewId !== assignment.id && (
                            <div className={styles.actionArea}>
                                <Button onClick={() => setActiveReviewId(assignment.id)} className={styles.reviewTriggerBtn}>
                                    Review Submission
                                </Button>
                            </div>
                        )}

                        {activeReviewId === assignment.id && (
                            <div className={styles.activeReviewZone}>
                                <ReviewActionForm
                                    assignmentId={assignment.id}
                                    defaultPoints={taskInfo?.points ?? 0}
                                    onComplete={() => {
                                        setActiveReviewId(null);
                                        fetchAssignments();
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
