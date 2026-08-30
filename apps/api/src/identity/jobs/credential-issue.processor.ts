import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IdentityService } from '../identity.service';

interface PaymentConfirmedJobData {
  paymentId: string;
  registrationId: string;
  verifiedById: string;
}

@Processor('payment-confirmed')
@Injectable()
export class CredentialIssueProcessor extends WorkerHost {
  private readonly logger = new Logger(CredentialIssueProcessor.name);

  constructor(private readonly identityService: IdentityService) {
    super();
  }

  async process(job: Job<PaymentConfirmedJobData>): Promise<void> {
    this.logger.debug(
      `Issuing credentials for registration ${job.data.registrationId}`,
    );
    await this.identityService.issueCredentialsForPayment(
      job.data.registrationId,
    );
  }
}
