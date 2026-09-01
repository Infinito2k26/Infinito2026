import { FeeStructure, GenderCategory } from '@prisma/client';
import {
  calculateRegistrationFee,
  FeeCalculationInput,
} from './fee-calculator.util';

const base: FeeCalculationInput = {
  feeStructure: FeeStructure.FLAT,
  feeFlat: 500,
  feePerHead: null,
  feeMale: null,
  feeFemale: null,
  participantCount: 1,
  genderDeclared: null,
  isIITP: false,
  accommodationOpted: false,
  accommodationRate: null,
  accommodationDays: null,
  accommodationHeadcount: null,
  messOnlyOpted: false,
  messOnlyRate: null,
  messOnlyHeadcount: null,
};

describe('calculateRegistrationFee', () => {
  it('returns 0 regardless of fee structure when isIITP is true', () => {
    expect(calculateRegistrationFee({ ...base, isIITP: true })).toBe(0);
    expect(
      calculateRegistrationFee({
        ...base,
        isIITP: true,
        feeStructure: FeeStructure.PER_HEAD,
        feePerHead: 249,
        participantCount: 6,
      }),
    ).toBe(0);
  });

  it('computes FLAT fee', () => {
    expect(calculateRegistrationFee(base)).toBe(500);
  });

  it('computes PER_HEAD fee as rate x participantCount', () => {
    expect(
      calculateRegistrationFee({
        ...base,
        feeStructure: FeeStructure.PER_HEAD,
        feeFlat: null,
        feePerHead: 249,
        participantCount: 6,
      }),
    ).toBe(1494);
  });

  it('computes GENDER_BASED fee using feeMale for MEN', () => {
    expect(
      calculateRegistrationFee({
        ...base,
        feeStructure: FeeStructure.GENDER_BASED,
        feeFlat: null,
        feeMale: 6500,
        feeFemale: 3000,
        genderDeclared: GenderCategory.MEN,
      }),
    ).toBe(6500);
  });

  it('computes GENDER_BASED fee using feeFemale for WOMEN', () => {
    expect(
      calculateRegistrationFee({
        ...base,
        feeStructure: FeeStructure.GENDER_BASED,
        feeFlat: null,
        feeMale: 6500,
        feeFemale: 3000,
        genderDeclared: GenderCategory.WOMEN,
      }),
    ).toBe(3000);
  });

  it('adds the accommodation surcharge (rate x days x headcount) when opted in', () => {
    expect(
      calculateRegistrationFee({
        ...base,
        accommodationOpted: true,
        accommodationRate: 490,
        accommodationDays: 3,
        accommodationHeadcount: 5,
      }),
    ).toBe(500 + 490 * 3 * 5);
  });

  it('ignores accommodation fields when accommodationOpted is false', () => {
    expect(
      calculateRegistrationFee({
        ...base,
        accommodationOpted: false,
        accommodationRate: 490,
        accommodationDays: 3,
        accommodationHeadcount: 5,
      }),
    ).toBe(500);
  });

  it('adds the mess-only surcharge (rate x days x headcount) when opted in', () => {
    expect(
      calculateRegistrationFee({
        ...base,
        messOnlyOpted: true,
        messOnlyRate: 200,
        accommodationDays: 3,
        messOnlyHeadcount: 4,
      }),
    ).toBe(500 + 200 * 3 * 4);
  });

  it('ignores mess-only fields when messOnlyOpted is false', () => {
    expect(
      calculateRegistrationFee({
        ...base,
        messOnlyOpted: false,
        messOnlyRate: 200,
        accommodationDays: 3,
        messOnlyHeadcount: 4,
      }),
    ).toBe(500);
  });

  it('stacks accommodation and mess-only for different subsets of the team, sharing accommodationDays', () => {
    expect(
      calculateRegistrationFee({
        ...base,
        accommodationOpted: true,
        accommodationRate: 490,
        accommodationDays: 3,
        accommodationHeadcount: 5,
        messOnlyOpted: true,
        messOnlyRate: 200,
        messOnlyHeadcount: 4,
      }),
    ).toBe(500 + 490 * 3 * 5 + 200 * 3 * 4);
  });
});
