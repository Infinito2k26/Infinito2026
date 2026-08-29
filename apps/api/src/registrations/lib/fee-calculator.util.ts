import { FeeStructure, GenderCategory } from '@prisma/client';

export interface FeeCalculationInput {
  feeStructure: FeeStructure;
  feeFlat: number | null;
  feePerHead: number | null;
  feeMale: number | null;
  feeFemale: number | null;
  // Team roster size for PER_HEAD team events; 1 for individual events.
  participantCount: number;
  genderDeclared: GenderCategory | null;
  isIITP: boolean;
  accommodationOpted: boolean;
  accommodationRate: number | null;
  accommodationDays: number | null;
  accommodationHeadcount: number | null;
}

/**
 * Pure fee computation, kept free of Nest/Prisma-service concerns so it can
 * be unit-tested in isolation. Callers are responsible for validating
 * genderDeclared is present when feeStructure is GENDER_BASED before calling.
 */
export function calculateRegistrationFee(input: FeeCalculationInput): number {
  if (input.isIITP) {
    return 0;
  }

  let base: number;

  switch (input.feeStructure) {
    case FeeStructure.FLAT:
      base = input.feeFlat ?? 0;
      break;
    case FeeStructure.PER_HEAD:
      base = (input.feePerHead ?? 0) * input.participantCount;
      break;
    case FeeStructure.GENDER_BASED:
      base =
        input.genderDeclared === GenderCategory.MEN
          ? (input.feeMale ?? 0)
          : (input.feeFemale ?? 0);
      break;
    default:
      base = 0;
  }

  const accommodation = input.accommodationOpted
    ? (input.accommodationRate ?? 0) *
      (input.accommodationDays ?? 0) *
      (input.accommodationHeadcount ?? 0)
    : 0;

  return base + accommodation;
}
