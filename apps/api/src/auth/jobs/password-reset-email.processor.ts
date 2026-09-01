import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import { Env } from '../../config/env.schema';

interface PasswordResetEmailJobData {
  email: string;
  resetLink: string;
}

@Processor('password-reset-email')
@Injectable()
export class PasswordResetEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(PasswordResetEmailProcessor.name);
  private readonly resend: Resend | null;

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true });
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async process(job: Job<PasswordResetEmailJobData>): Promise<void> {
    const { email, resetLink } = job.data;

    if (!this.resend) {
      // ponytail: no RESEND_API_KEY configured (local/dev) — log the link
      // instead of failing the job, so the reset flow stays testable.
      this.logger.warn(
        `RESEND_API_KEY not set; would have emailed ${email}: ${resetLink}`,
      );
      return;
    }

    await this.resend.emails.send({
      from: this.config.get('EMAIL_FROM', { infer: true }),
      to: email,
      subject: 'Reset your Infinito 2K26 password',
      html: `<p>Someone requested a password reset for this account.</p><p><a href="${resetLink}">Click here to reset your password</a>. This link expires in 30 minutes.</p><p>If you didn't request this, you can safely ignore this email.</p>`,
    });
  }
}
