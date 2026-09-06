import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import { Env } from '../../config/env.schema';

interface EmailVerificationJobData {
  email: string;
  code: string;
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
    const { email, code } = job.data;

    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY not set; would have emailed ${email}: OTP ${code}`,
      );
      return;
    }

    await this.resend.emails.send({
      from: this.config.get('EMAIL_FROM', { infer: true }),
      to: email,
      subject: 'Verify your Infinito 2K26 email',
      html: `
        <p>Welcome to Infinito 2K26!</p>

        <p>Your email verification OTP is:</p>

        <h2>${code}</h2>

        <p>This OTP expires in 5 minutes.</p>

        <p>If you didn't create this account, you can safely ignore this email.</p>
      `,
    });
  }
}
