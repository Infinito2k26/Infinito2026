"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2, Upload, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

import styles from './tasks.module.css';

// Matches the backend's real ProofType/TaskStatus enums (apps/api/prisma/schema.prisma)
type ProofType = 'AUTO' | 'URL_SUBMISSION' | 'SCREENSHOT' | 'PHOTO';
type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

interface Assignment {
    status: AssignmentStatus;
    rejectionReason?: string | null;
    proofUrl?: string | null;
}

interface Task {
    id: string;
    title: string;
    description: string;
    points: number;
    proofType: ProofType;
    brand?: { name: string } | null;
    assignments: Assignment[];
}

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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSubmittingId, setActiveSubmittingId] = useState<string | null>(null);

    const urlForm = useForm<{ proofUrl: string }>({ resolver: zodResolver(urlSchema) });
    const fileForm = useForm<{ proofFile: FileList }>({ resolver: zodResolver(fileSchema) });

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/ca/tasks');
            setTasks(data ?? []);
        } catch (err) {
            console.error("Failed to load tasks", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleUrlSubmit = async (taskId: string, data: { proofUrl: string }) => {
        setActiveSubmittingId(taskId);
        try {
            await api.post(`/ca/tasks/${taskId}/submit`, { proofUrl: data.proofUrl });
            urlForm.reset();
            await fetchTasks();
        } catch (err) {
            console.error(`Failed to submit task ${taskId}`, err);
        } finally {
            setActiveSubmittingId(null);
        }
    };

    const handleFileSubmit = async (taskId: string, data: { proofFile: FileList }) => {
        const file = data.proofFile[0];
        if (!file) return;

        setActiveSubmittingId(taskId);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/ca/tasks/${taskId}/submit`, formData);
            fileForm.reset();
            await fetchTasks();
        } catch (err) {
            console.error(`Failed to submit task ${taskId}`, err);
        } finally {
            setActiveSubmittingId(null);
        }
    };

    const renderStatusBadge = (status?: AssignmentStatus) => {
        switch (status) {
            case 'SUBMITTED':
                return <span className={`${styles.badge} ${styles.badgePending}`}><Clock size={14} /> Pending Review</span>;
            case 'VERIFIED':
                return <span className={`${styles.badge} ${styles.badgeApproved}`}><CheckCircle2 size={14} /> Verified</span>;
            case 'REJECTED':
                return <span className={`${styles.badge} ${styles.badgeRejected}`}><XCircle size={14} /> Action Required</span>;
            default:
                return <span className={`${styles.badge} ${styles.badgeNone}`}>Not Started</span>;
        }
    };

    if (isLoading) {
        return null;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Promotional Tasks</h1>
                <p className={styles.pageSubtitle}>Complete tasks, submit verified proofs, and rack up points to scale the leaderboard.</p>
            </header>

            <div className={styles.taskList}>
                {tasks.length === 0 ? (
                    <p className="text-muted-foreground p-4">No active tasks right now.</p>
                ) : tasks.map((task) => {
                    const assignment = task.assignments[0];
                    // Backend only allows a first submission — once an assignment exists
                    // (SUBMITTED/VERIFIED/REJECTED) the submit endpoint 409s, so the form
                    // is hidden rather than offering a resubmit the API would reject.
                    const hasAssignment = Boolean(assignment);
                    const isCurrentSubmitting = activeSubmittingId === task.id;
                    const isFileTask = task.proofType === 'SCREENSHOT' || task.proofType === 'PHOTO';
                    const isUrlTask = task.proofType === 'URL_SUBMISSION';

                    return (
                        <Card key={task.id} className={styles.taskCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.titleArea}>
                                    <h2 className={styles.taskTitle}>{task.title}</h2>
                                    {task.brand?.name && <span className={styles.brandTag}>{task.brand.name}</span>}
                                </div>
                                <div className={styles.pointsArea}>
                                    <span className={styles.pointsValue}>+{task.points}</span>
                                    <span className={styles.pointsLabel}>Pts</span>
                                </div>
                            </div>

                            <p>{task.description}</p>

                            <div className={styles.statusRow}>
                                {renderStatusBadge(assignment?.status)}
                                <span className={styles.typeLabel}>
                                    Method: {isFileTask ? 'Screenshot Upload' : 'Drop Link'}
                                </span>
                            </div>

                            {assignment?.status === 'REJECTED' && assignment.rejectionReason && (
                                <div className={styles.rejectionBanner}>
                                    <AlertCircle size={16} className={styles.errorIcon} />
                                    <div className={styles.bannerContent}>
                                        <strong>Reason for rejection:</strong>
                                        <p>{assignment.rejectionReason}</p>
                                    </div>
                                </div>
                            )}

                            {!hasAssignment && isUrlTask && (
                                <div className={styles.submissionZone}>
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
                                </div>
                            )}

                            {!hasAssignment && isFileTask && (
                                <div className={styles.submissionZone}>
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
                                    {fileForm.formState.errors.proofFile && (
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
