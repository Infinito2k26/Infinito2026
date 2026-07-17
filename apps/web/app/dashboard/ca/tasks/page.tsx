"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2, Upload, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';

import styles from './tasks.module.css';

// Exact domain contracts extracted from spec & addendum
type TaskType = 'URL' | 'FILE';
type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';

interface Task {
    id: string;
    title: string;
    description: string;
    points: number;
    type: TaskType;
    brandName?: string; // Brand-sourced vs Team-sourced
    submission?: {
        status: SubmissionStatus;
        rejectionReason?: string; // Mandated by Gap #11
        submittedValue?: string;
    };
}

// Fixed mock sample array matching standard API shapes for full-screen render checks
const MOCK_TASKS: Task[] = [
    {
        id: "task_001",
        title: "Share Infinito 2K26 Launch Reel",
        description: "Post our official teaser reel on your Instagram story and tag @infinito_iitp. Leave the story up for at least 20 hours.",
        points: 50,
        type: "URL",
        brandName: "Infinito Core Team",
        submission: { status: "NOT_SUBMITTED" }
    },
    {
        id: "task_002",
        title: "Circulate WhatsApp Poster blast",
        description: "Forward the main fest poster to your official college batch groups. Upload a clear screenshot showing the forwarded message tag.",
        points: 75,
        type: "FILE",
        submission: { status: "PENDING", submittedValue: "screenshot-uuid-xyz.png" }
    },
    {
        id: "task_003",
        title: "Register Sponsoring Brand App Accounts",
        description: "Sign up on our title sponsor's application using your college email address and submit your profile dashboard link.",
        points: 120,
        type: "URL",
        brandName: "TechCorp Global",
        submission: {
            status: "REJECTED",
            rejectionReason: "The link provided is broken or points to a private account dashboard. Please resubmit a public profile link.",
            submittedValue: "https://techcorp.com/user/private_profile"
        }
    }
];

// Explicit client-side validation rules targeting scheme and type safety constraints
const urlSchema = z.object({
    proofUrl: z.string().url('Please enter a valid URL').refine(
        (val) => val.startsWith('http://') || val.startsWith('https://'),
        { message: 'URL must use HTTP or HTTPS scheme' }
    )
});

const fileSchema = z.object({
    proofFile: z.any().refine((files) => files?.length === 1, 'Proof file screenshot is required')
});

export default function CATasksPage() {
    const [activeSubmittingId, setActiveSubmittingId] = useState<string | null>(null);

    // Form hooks configured dynamically per task input needs
    const urlForm = useForm<{ proofUrl: string }>({ resolver: zodResolver(urlSchema) });
    const fileForm = useForm<{ proofFile: any }>({ resolver: zodResolver(fileSchema) });

    const handleUrlSubmit = async (taskId: string, data: { proofUrl: string }) => {
        setActiveSubmittingId(taskId);
        // TODO: Wire up POST /ca/tasks/:taskId/submit via lib/api.ts
        console.log(`Submitting URL for task ${taskId}:`, data.proofUrl);
        setActiveSubmittingId(null);
    };

    const handleFileSubmit = async (taskId: string, data: { proofFile: any }) => {
        setActiveSubmittingId(taskId);
        // TODO: Handle multi-part form data conversion for file uploads
        console.log(`Submitting File payload for task ${taskId}:`, data.proofFile[0]);
        setActiveSubmittingId(null);
    };

    const renderStatusBadge = (status: SubmissionStatus) => {
        switch (status) {
            case 'PENDING':
                return <span className={`${styles.badge} ${styles.badgePending}`}><Clock size={14} /> Pending Review</span>;
            case 'APPROVED':
                return <span className={`${styles.badge} ${styles.badgeApproved}`}><CheckCircle2 size={14} /> Verified</span>;
            case 'REJECTED':
                return <span className={`${styles.badge} ${styles.badgeRejected}`}><XCircle size={14} /> Action Required</span>;
            default:
                return <span className={`${styles.badge} ${styles.badgeNone}`}>Not Started</span>;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Promotional Tasks</h1>
                <p className={styles.pageSubtitle}>Complete tasks, submit verified proofs, and rack up points to scale the leaderboard.</p>
            </header>

            <div className={styles.taskList}>
                {MOCK_TASKS.map((task) => {
                    const isPendingOrApproved = task.submission?.status === 'PENDING' || task.submission?.status === 'APPROVED';
                    const isCurrentSubmitting = activeSubmittingId === task.id;

                    return (
                        <Card key={task.id} className={styles.taskCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.titleArea}>
                                    <h2 className={styles.taskTitle}>{task.title}</h2>
                                    {task.brandName && <span className={styles.brandTag}>{task.brandName}</span>}
                                </div>
                                <div className={styles.pointsArea}>
                                    <span className={styles.pointsValue}>+{task.points}</span>
                                    <span className={styles.pointsLabel}>Pts</span>
                                </div>
                            </div>

                            <p className={task.description}>{task.description}</p>

                            <div className={styles.statusRow}>
                                {renderStatusBadge(task.submission?.status || 'NOT_SUBMITTED')}
                                <span className={styles.typeLabel}>
                                    Method: {task.type === 'URL' ? 'Drop Link' : 'Screenshot Upload'}
                                </span>
                            </div>

                            {/* Rejection Audit Banner (Gap #11 Protection) */}
                            {task.submission?.status === 'REJECTED' && task.submission.rejectionReason && (
                                <div className={styles.rejectionBanner}>
                                    <AlertCircle size={16} className={styles.errorIcon} />
                                    <div className={styles.bannerContent}>
                                        <strong>Reason for rejection:</strong>
                                        <p>{task.submission.rejectionReason}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Processing Submissions UI Elements */}
                            {!isPendingOrApproved && (
                                <div className={styles.submissionZone}>
                                    {task.type === 'URL' ? (
                                        <form
                                            onSubmit={urlForm.handleSubmit((data) => handleUrlSubmit(task.id, data))}
                                            className={styles.inlineForm}
                                        >
                                            <div className={styles.inputFlex}>
                                                <Input
                                                    placeholder="https://instagram.com/p/..."
                                                    disabled={isCurrentSubmitting}
                                                    error={urlForm.formState.errors.proofUrl?.message}
                                                    {...urlForm.register('proofUrl')}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={isCurrentSubmitting}
                                                loading={isCurrentSubmitting}
                                                className={styles.actionBtn}
                                            >
                                                <Link2 size={16} /> Submit
                                            </Button>
                                        </form>
                                    ) : (
                                        <form
                                            onSubmit={fileForm.handleSubmit((data) => handleFileSubmit(task.id, data))}
                                            className={styles.inlineForm}
                                        >
                                            <div className={styles.fileInputWrapper}>
                                                <input
                                                    type="file"
                                                    id={`file-${task.id}`}
                                                    accept="image/*"
                                                    disabled={isCurrentSubmitting}
                                                    className={styles.nativeFileInput}
                                                    {...fileForm.register('proofFile')}
                                                />
                                                <label htmlFor={`file-${task.id}`} className={styles.fileLabel}>
                                                    <Upload size={16} /> Choose Verification Image
                                                </label>
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={isCurrentSubmitting}
                                                loading={isCurrentSubmitting}
                                                className={styles.actionBtn}
                                            >
                                                Upload
                                            </Button>
                                        </form>
                                    )}
                                    {task.type === 'FILE' && fileForm.formState.errors.proofFile && (
                                        <span className={styles.errorSpan}>
                                            {fileForm.formState.errors.proofFile.message as string}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}