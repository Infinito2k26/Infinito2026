import { RegistrationStatus } from '@prisma/client';

// Only PENDING_PAYMENT is reachable today (registration creation). The full
// table exists so the Day 2 payment webhook (-> CONFIRMED/WAITLISTED) and
// Day 3 cancellation (-> CANCELLED/REFUNDED) can reuse it without redefining
// transitions.
export const REGISTRATION_STATUS_TRANSITIONS: Record<
  RegistrationStatus,
  RegistrationStatus[]
> = {
  [RegistrationStatus.PENDING_PAYMENT]: [
    RegistrationStatus.CONFIRMED,
    RegistrationStatus.WAITLISTED,
    RegistrationStatus.CANCELLED,
  ],
  [RegistrationStatus.CONFIRMED]: [
    RegistrationStatus.CANCELLED,
    RegistrationStatus.REFUNDED,
  ],
  [RegistrationStatus.WAITLISTED]: [
    RegistrationStatus.CONFIRMED,
    RegistrationStatus.CANCELLED,
  ],
  [RegistrationStatus.CANCELLED]: [],
  [RegistrationStatus.REFUNDED]: [],
};

export function canTransitionRegistrationStatus(
  from: RegistrationStatus,
  to: RegistrationStatus,
): boolean {
  return REGISTRATION_STATUS_TRANSITIONS[from].includes(to);
}
