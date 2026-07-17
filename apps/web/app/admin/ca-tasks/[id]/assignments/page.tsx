"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';

import styles from './admin-assignments.module.css';

// Mock Data (In reality, fetched via GET /admin/ca-tasks/:id/assignments)
const MOCK_TASK_INFO = {
    id: 'task_001',
    title: 'Share Launch Reel',
    defaultPoints: 50,
    type: 'URL', // Or 'FILE'
};

const MOCK_ASSIGNMENTS = [
    { id: 'assign_1', caName: 'Rahul Sharma', college: 'IIT Delhi', status: 'PENDING', submittedValue: 'https://instagram.com/p/xyz', submittedAt: '2 hours ago' },
    { id: 'assign_2', caName: 'Priya Singh', college: 'NIT Warangal', status: 'APPROVED', pointsAwarded: 50, submittedValue: 'https://instagram.com/p/abc', submittedAt: '1 day ago' },
    { id: 'assign_3', caName: 'Aman Gupta', college: 'BITS Pilani', status: 'REJECTED', rejectionReason: 'Link is broken.', submittedValue: 'https://instagram.com/broken', submittedAt: '2 days ago' },
];

const verifySchema = z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    pointsOverride: z.number({ message: 'Points must be a valid number' }).optional(),
    rejectionReason: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.action === 'REJECT' && (!data.rejectionReason || data.rejectionReason.length < 5)) {
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
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(verifySchema),
        defaultValues: { action: 'APPROVE', pointsOverride: defaultPoints }
    });

    const selectedAction = watch('action');

    const onSubmit = async (data: any) => {
        // TODO: Wire up POST /admin/ca-task-assignments/:id/verify
        console.log(`Verifying assignment ${assignmentId}:`, data);
        onComplete();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.reviewForm}>
            <div className={styles.actionToggle}>
                <label className={`${styles.radioLabel} ${selectedAction === 'APPROVE' ? styles.radioApprove : ''}`}>
                    <input type="radio" value="APPROVE" {...register('action')} className={styles.radioInput} />
                    Approve
                </label>
                <label className={`${styles.radioLabel} ${selectedAction === 'REJECT' ? styles.radioReject : ''}`}>
                    <input type="radio" value="REJECT" {...register('action')} className={styles.radioInput} />
                    Reject
                </label>
            </div>

            {selectedAction === 'APPROVE' && (
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

            {selectedAction === 'REJECT' && (
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
    const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

    const renderProof = (type: string, value: string) => {
        if (type === 'URL') {
            return (
                <a href={value} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
                    <ExternalLink size={14} /> Open Submitted Link
                </a>
            );
        }
        return (
            <a href={value} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
                <ImageIcon size={14} /> View Uploaded Image
            </a>
        );
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.topNav}>
                <Link href="/admin/ca-tasks" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to Tasks
                </Link>
            </div>

            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Review Submissions</h1>
                <div className={styles.taskMetaHeader}>
                    <span className={styles.taskTitle}>{MOCK_TASK_INFO.title}</span>
                    <span className={styles.taskDefaultPoints}>{MOCK_TASK_INFO.defaultPoints} Pts Default</span>
                </div>
            </header>

            <div className={styles.listContainer}>
                {MOCK_ASSIGNMENTS.map((assignment) => (
                    <Card key={assignment.id} className={styles.assignmentCard}>
                        <div className={styles.cardTop}>
                            <div className={styles.caInfo}>
                                <h3 className={styles.caName}>{assignment.caName}</h3>
                                <span className={styles.caCollege}>{assignment.college} • {assignment.submittedAt}</span>
                            </div>
                            <div className={styles.statusBadgeWrapper}>
                                {assignment.status === 'APPROVED' && <span className={`${styles.statusBadge} ${styles.statusApproved}`}><CheckCircle size={14} /> Approved</span>}
                                {assignment.status === 'REJECTED' && <span className={`${styles.statusBadge} ${styles.statusRejected}`}><XCircle size={14} /> Rejected</span>}
                                {assignment.status === 'PENDING' && <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pending</span>}
                            </div>
                        </div>

                        <div className={styles.proofSection}>
                            <span className={styles.proofLabel}>Proof Provided:</span>
                            {renderProof(MOCK_TASK_INFO.type, assignment.submittedValue)}
                        </div>

                        {assignment.status === 'APPROVED' && assignment.pointsAwarded && (
                            <div className={styles.resolutionDetails}>
                                <strong>Points Awarded:</strong> {assignment.pointsAwarded}
                            </div>
                        )}

                        {assignment.status === 'REJECTED' && assignment.rejectionReason && (
                            <div className={styles.resolutionDetails}>
                                <strong>Rejection Reason:</strong> {assignment.rejectionReason}
                            </div>
                        )}

                        {assignment.status === 'PENDING' && activeReviewId !== assignment.id && (
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
                                    defaultPoints={MOCK_TASK_INFO.defaultPoints}
                                    onComplete={() => setActiveReviewId(null)}
                                />
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
