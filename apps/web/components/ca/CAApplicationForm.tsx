import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import styles from './styles.module.css';

const formSchema = z.object({
  targetCollege: z.string().min(1, 'Target college is required'),
});

type FormValues = z.infer<typeof formSchema>;

export interface CAApplicationFormProps {
  onSubmit: (data: { targetCollege: string }) => void;
  isLoading: boolean;
}

export function CAApplicationForm({ onSubmit, isLoading }: CAApplicationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.inputGroup}>
          <label htmlFor="targetCollege" className={styles.label}>
            Target College
          </label>
          <input
            id="targetCollege"
            type="text"
            className={styles.input}
            placeholder="Enter the name of your college"
            disabled={isLoading}
            {...register('targetCollege')}
          />
          {errors.targetCollege && (
            <span className={styles.errorText}>{errors.targetCollege.message}</span>
          )}
        </div>
        
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className={styles.spinner} size={20} />
              <span>Submitting...</span>
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </form>
    </div>
  );
}
