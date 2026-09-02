import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import { Env } from '../../config/env.schema';

interface EmailVerificationJobData {
  email: string;
  verifyLink: string;
}

@Processor('email-verification')
@Injectable()
export class EmailVerificationProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailVerificationProcessor.name);
  private readonly resend: Resend | null;

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true });
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async process(job: Job<EmailVerificationJobData>): Promise<void> {
    const { email, verifyLink } = job.data;

    if (!this.resend) {
      // ponytail: no RESEND_API_KEY configured (local/dev) — log the link
      // instead of failing the job, so the verify flow stays testable.
      this.logger.warn(
        `RESEND_API_KEY not set; would have emailed ${email}: ${verifyLink}`,
      );
      return;
    }

    await this.resend.emails.send({
      from: this.config.get('EMAIL_FROM', { infer: true }),
      to: email,
      subject: 'Verify your Infinito 2K26 email',
      html: `<p>Welcome to Infinito 2K26! Please confirm this is your email address.</p><p><a href="${verifyLink}">Click here to verify your email</a>. This link expires in 24 hours.</p><p>If you didn't create this account, you can safely ignore this email.</p>`,
    });
  }
}
