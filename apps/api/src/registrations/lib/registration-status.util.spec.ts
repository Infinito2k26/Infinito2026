import { RegistrationStatus } from '@prisma/client';
import { canTransitionRegistrationStatus } from './registration-status.util';

describe('canTransitionRegistrationStatus', () => {
  it.each([
    [RegistrationStatus.PENDING_PAYMENT, RegistrationStatus.CONFIRMED],
    [RegistrationStatus.PENDING_PAYMENT, RegistrationStatus.WAITLISTED],
    [RegistrationStatus.PENDING_PAYMENT, RegistrationStatus.CANCELLED],
    [RegistrationStatus.CONFIRMED, RegistrationStatus.CANCELLED],
    [RegistrationStatus.CONFIRMED, RegistrationStatus.REFUNDED],
    [RegistrationStatus.WAITLISTED, RegistrationStatus.CONFIRMED],
    [RegistrationStatus.WAITLISTED, RegistrationStatus.CANCELLED],
  ])('allows %s -> %s', (from, to) => {
    expect(canTransitionRegistrationStatus(from, to)).toBe(true);
  });

  it.each([
    [RegistrationStatus.PENDING_PAYMENT, RegistrationStatus.REFUNDED],
    [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING_PAYMENT],
    [RegistrationStatus.CONFIRMED, RegistrationStatus.WAITLISTED],
    [RegistrationStatus.CANCELLED, RegistrationStatus.CONFIRMED],
    [RegistrationStatus.REFUNDED, RegistrationStatus.CONFIRMED],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransitionRegistrationStatus(from, to)).toBe(false);
  });
});
