"use client";

import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Plus, Archive, Users, ExternalLink } from 'lucide-react';

import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Badge from '@/components/ui/badge';

import styles from './ca-tasks.module.css';

// Mock Data for Brands (In reality, fetched via GET /admin/brands)
const MOCK_BRANDS = [
  { id: 'brand_1', name: 'TechCorp Global' },
  { id: 'brand_2', name: 'Energy Drink Co.' },
];

// Mock Data for Tasks (In reality, fetched via GET /admin/ca-tasks)
const MOCK_TASKS = [
  { id: 'task_001', title: 'Share Launch Reel', type: 'URL', points: 50, isBrandSourced: false, status: 'ACTIVE' },
  { id: 'task_002', title: 'App Registration', type: 'URL', points: 120, isBrandSourced: true, brandName: 'TechCorp Global', status: 'ACTIVE' },
  { id: 'task_003', title: 'Campus Poster Screenshot', type: 'FILE', points: 75, isBrandSourced: false, status: 'ARCHIVED' },
];

// Schema enforcing the cross-validation rule from the hardening plan
const taskSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  points: z.coerce.number().min(1, 'Points must be greater than 0'),
  type: z.enum(['URL', 'FILE']),
  isBrandSourced: z.boolean().default(false),
  brandId: z.string().optional(),
}).refine((data) => {
  // Enforce: Brand tasks require a brand; team tasks forbid one.
  if (data.isBrandSourced && !data.brandId) return false;
  return true;
}, {
  message: "You must select a brand for a brand-sourced task",
  path: ["brandId"],
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function AdminTasksPage() {
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      type: 'URL',
      isBrandSourced: false,
    }
  });

  const isBrandSourced = watch('isBrandSourced');

  const onSubmit: SubmitHandler<TaskFormValues> = async (data: TaskFormValues) => {
    // TODO: Wire up POST /admin/ca-tasks
    console.log('Creating task:', data);
    reset();
    setIsCreating(false);
  };

  const handleArchive = async (taskId: string) => {
    // TODO: Wire up PATCH /admin/ca-tasks/:id (soft delete)
    console.log(`Archiving task: ${taskId}`);
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Manage Tasks</h1>
          <p className={styles.pageSubtitle}>Create promotional tasks and monitor submissions.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : <><Plus size={16} /> New Task</>}
        </Button>
      </header>

      {isCreating && (
        <Card className={styles.createCard}>
          <h2 className={styles.cardTitle}>Create New Task</h2>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Task Title</label>
              <Input
                placeholder="e.g., Share the main poster"
                disabled={isSubmitting}
                error={errors.title?.message}
                {...register('title')}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Description</label>
              <textarea
                className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                placeholder="Detailed instructions for the ambassadors..."
                rows={3}
                disabled={isSubmitting}
                {...register('description')}
              />
              {errors.description && <span className={styles.errorText}>{errors.description.message}</span>}
            </div>

            <div className={styles.grid2Col}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Points Config</label>
                <Input
                  type="number"
                  placeholder="e.g., 50"
                  disabled={isSubmitting}
                  error={errors.points?.message}
                  {...register('points')}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Proof Type</label>
                <select className={styles.select} disabled={isSubmitting} {...register('type')}>
                  <option value="URL">URL Link</option>
                  <option value="FILE">File Upload (Screenshot)</option>
                </select>
              </div>
            </div>

            <div className={styles.brandToggleWrapper}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="isBrandSourced"
                  className={styles.checkbox}
                  disabled={isSubmitting}
                  {...register('isBrandSourced')}
                />
                <label htmlFor="isBrandSourced" className={styles.checkboxLabel}>
                  This is a brand-sponsored task
                </label>
              </div>

              {isBrandSourced && (
                <div className={styles.brandSelectWrapper}>
                  <select
                    className={`${styles.select} ${errors.brandId ? styles.inputError : ''}`}
                    disabled={isSubmitting}
                    {...register('brandId')}
                    defaultValue=""
                  >
                    <option value="" disabled>Select the sponsoring brand...</option>
                    {MOCK_BRANDS.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                  {errors.brandId && <span className={styles.errorText}>{errors.brandId.message}</span>}
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                Publish Task
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className={styles.listContainer}>
        {MOCK_TASKS.map((task) => (
          <Card key={task.id} className={`${styles.taskCard} ${task.status === 'ARCHIVED' ? styles.archivedCard : ''}`}>
            <div className={styles.taskMeta}>
              <div className={styles.taskHeader}>
                <h3 className={styles.taskTitle}>{task.title}</h3>
                <span className={`${styles.statusBadge} ${task.status === 'ACTIVE' ? styles.statusActive : styles.statusArchived}`}>
                  {task.status}
                </span>
              </div>
              <div className={styles.taskDetails}>
                <span className={styles.detailTag}>{task.points} Pts</span>
                <span className={styles.detailTag}>{task.type}</span>
                {task.isBrandSourced ? (
                  <span className={styles.brandTag}>Brand: {task.brandName}</span>
                ) : (
                  <span className={styles.teamTag}>Infinito Team</span>
                )}
              </div>
            </div>

            <div className={styles.taskActions}>
              <Link href={`/admin/ca-tasks/${task.id}/assignments`} className={styles.reviewLink}>
                <Users size={16} /> Review Submissions <ExternalLink size={14} />
              </Link>

              {task.status === 'ACTIVE' && (
                <button
                  onClick={() => handleArchive(task.id)}
                  className={styles.archiveBtn}
                  aria-label="Archive Task"
                >
                  <Archive size={16} /> Archive
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}