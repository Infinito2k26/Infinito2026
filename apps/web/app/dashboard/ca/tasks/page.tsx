"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2, Upload, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { api } from '@/lib/api';

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

// Remove static mock tasks
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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [activeSubmittingId, setActiveSubmittingId] = useState<string | null>(null);

    React.useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const data = await api.get('/ca/tasks');
            if (data && data.tasks) setTasks(data.tasks);
        } catch (err: any) {
            setApiError(err?.message || 'Failed to load tasks');
        } finally {
            setIsLoading(false);
        }
    };

    // Form hooks configured dynamically per task input needs
    const urlForm = useForm<{ proofUrl: string }>({ resolver: zodResolver(urlSchema) });
    const fileForm = useForm<{ proofFile: FileList }>({ resolver: zodResolver(fileSchema) });

    const handleUrlSubmit = async (taskId: string, data: { proofUrl: string }) => {
        setActiveSubmittingId(taskId);
        try {
            await api.post(`/ca/tasks/${taskId}/submit`, { proofUrl: data.proofUrl });
            await fetchTasks(); // Refresh list to show PENDING state
            urlForm.reset();
        } catch (err: any) {
            alert(err?.message || 'Failed to submit URL proof');
        }
        setActiveSubmittingId(null);
    };

    const handleFileSubmit = async (taskId: string, data: { proofFile: FileList }) => {
        setActiveSubmittingId(taskId);
        try {
            const formData = new FormData();
            if (data.proofFile && data.proofFile[0]) {
                formData.append('file', data.proofFile[0]);
            }
            await api.post(`/ca/tasks/${taskId}/submit`, formData);
            await fetchTasks(); // Refresh list
            fileForm.reset();
        } catch (err: any) {
            alert(err?.message || 'Failed to upload proof');
        }
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
            
            {apiError && (
                <div className="bg-red-100 text-red-800 p-3 rounded-md mb-6 text-sm text-center border border-red-300">
                    {apiError}
                </div>
            )}

            <div className={styles.taskList}>
                {isLoading ? (
                    <p className="text-muted-foreground">Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p className="text-muted-foreground">No tasks available at the moment.</p>
                ) : (
                    tasks.map((task) => {
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
                }))}
            </div>
        </div>
    );
}